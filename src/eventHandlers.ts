import { MySocket, MyServer } from "types/socketTypes";
import Lobby, { createLobby, joinLobby, leaveLobby } from "./lobby";
import Game, { createGame } from "./game";
import { Mancala } from "./mancala";

const lobbies: { [lobbyId: string]: Lobby } = {};
const games: { [lobbyId: string]: Game } = {};

export function registerLobbyHandlers(socket: MySocket, io: MyServer) {

    const handleCreateLobby = () => {
        
        if (!validate(socket, { lobby: { isNotAnyMember: true }})) return;
        
        const lobby = createLobby(socket.id);
        
        const { id: lobbyId } = lobby;
        lobbies[lobbyId] = lobby;
        socket.data.lobbyId = lobbyId;
        socket.join(lobbyId);

        socket.emit("lobby:create:success", lobby);
    };
    const handleJoinLobby = (lobbyId: string) => {
        // if (socket.data.lobbyId != null) return; // Socket cannot join more than 1 lobby
        // if (lobbies[lobbyId] == null) return; // Lobby doesn't exist
        // if (lobbies[lobbyId].size >= lobbies[lobbyId].capacity) return; // Lobby is full
        console.log(`${socket.id}: wants to join a Lobby`);
        
        if (!validate(socket, { lobby: { isNotAnyMember: true, exists: lobbyId, isNotFull: true }})) return;

        console.log('validated');

        lobbies[lobbyId] = joinLobby(lobbies[lobbyId], socket.id);
        io.to(lobbyId).emit("lobby:update", lobbies[lobbyId]);
        
        socket.data.lobbyId = lobbyId;
        socket.join(lobbyId);
        socket.emit("lobby:join:success", lobbies[lobbyId]);
    };
    const handleLeaveLobby = () => {

        if (!validate(socket, { lobby: { exists: true }})) return;
    
        const { lobbyId } = socket.data;
        socket.leave(lobbyId);
        socket.data.lobbyId = undefined;
        socket.emit("lobby:leave:success");

        lobbies[lobbyId] = leaveLobby(lobbies[lobbyId], socket.id);
        io.to(lobbyId).emit("lobby:update", lobbies[lobbyId]);
    };
    const handleDisconnect = () => {
        const { lobbyId } = socket.data;
        if (lobbyId == null || lobbies[lobbyId] == null) return;

        // Update the lobby
        lobbies[lobbyId] = leaveLobby(lobbies[lobbyId], socket.id);
        io.to(lobbyId).emit("lobby:update", lobbies[lobbyId]);
        
        // If a game exists, delete the game because it's not valid anymore
        if (games[lobbyId] == null) return;
        delete games[lobbyId];
        // TODO: Broadcast that the game is destroyed
    };
    const handleStartGame = () => {
    
        if (!validate(socket, {
            lobby: { exists: true, isLeader: true, isFull: true },
            game: { doesNotExist: true }
        })) return;

        //console.log(`Lobby ${socket.data.lobbyId} validated to start game`);
    
        const { lobbyId } = socket.data;
        games[lobbyId] = createGame(lobbies[lobbyId]);
        // Broadcast the result : TODO
    };
    const handleMakeMove = (pit: number) => {

        if (!validate(socket, {
            lobby: { exists: true },
            game: { exists: true, playerTurn: true, pit }
        })) return;

        // Make the move
        const game = games[socket.data.lobbyId];
        game.board = Mancala.makeMove(game.board, pit);
        // Broadcast the result : TODO
    };
    const handleEndGame = () => {

    };
    const handleRestartGame = () => {

    };

    socket.on('lobby:create', handleCreateLobby);
    socket.on('lobby:join', handleJoinLobby);
    socket.on('lobby:leave', handleLeaveLobby);
    socket.on('disconnect', handleDisconnect);
    socket.on('startGame', handleStartGame);
}

function validate(socket: MySocket, flags: {
    lobby: { exists?: string | true, isNotAnyMember?: true, isLeader?: true, isFull?: true, isNotFull?: true },
    game?: { exists?: true, doesNotExist?: true, playerTurn?: true, pit?: number }
}): boolean
{
    const { lobbyId } = socket.data;
    if (flags.lobby.isNotAnyMember && lobbyId != null) return false;
    if (flags.lobby.exists == null) return true;
    const lobby = typeof flags.lobby.exists === 'string' ? lobbies[flags.lobby.exists] : lobbies[lobbyId];
    if (flags.lobby.exists != null && lobby == null) return false;
    if (flags.lobby.isLeader && lobby.leaderId !== socket.id) return false;
    if (flags.lobby.isFull && lobby.size !== lobby.capacity) return false;
    if (flags.lobby.isNotFull && lobby.size === lobby.capacity) return false;
    if (flags.game) {
        const game = games[lobbyId];
        if (flags.game.doesNotExist) return game == null;
        if (flags.game.exists && game == null) return false;
        if (flags.game.playerTurn && game.board.whoseTurn !== game.playerMap[socket.id]) return false;
        if (flags.game.pit != null && !Mancala.validateMove(game.board, flags.game.pit)) return false;
    }

    return true;
}