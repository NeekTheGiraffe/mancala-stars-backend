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

        console.log(`${socket.id}: wants to join a Lobby`);
        
        if (typeof lobbyId !== 'string') return;
        if (!validate(socket, { lobby: { isNotAnyMember: true, exists: lobbyId, isNotFull: true }})) return;

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

        if (games[lobbyId] == null) return;
        delete games[lobbyId];

        io.to(lobbyId).emit('game:end');
    };
    const handleDisconnect = () => {
        delete socket.data.soloGame;
        const { lobbyId } = socket.data;
        if (lobbyId == null || lobbies[lobbyId] == null) return;

        // Update the lobby
        lobbies[lobbyId] = leaveLobby(lobbies[lobbyId], socket.id);
        io.to(lobbyId).emit("lobby:update", lobbies[lobbyId]);
        
        // If a game exists, delete the game because it's not valid anymore
        if (games[lobbyId] == null) return;
        delete games[lobbyId];

        // Broadcast that the game is destroyed
        io.to(lobbyId).emit('game:end');
    };
    const handleStartGame = () => {
    
        if (!validate(socket, {
            lobby: { exists: true, isLeader: true, isFull: true },
            game: { isNotActive: true }
        })) return;
    
        const { lobbyId } = socket.data;
        games[lobbyId] = createGame(lobbies[lobbyId]);

        // Broadcast the result
        io.to(lobbyId).emit('game:start', games[lobbyId]);
    };
    const handleMakeMove = (pit: number) => {

        if (typeof pit !== 'number') return;
        if (!validate(socket, {
            lobby: { exists: true },
            game: { exists: true, playerTurn: true, pit }
        })) return;

        // Make the move
        const { lobbyId } = socket.data;
        const game = games[lobbyId];
        game.board = Mancala.makeMove(game.board, pit);

        //console.log(game.board);

        // Broadcast the result
        io.to(lobbyId).emit('game:update', game, Mancala.isGameOver(game.board));
    };

    const handleSoloStart = () => {
        const board = Mancala.createBoard();
        socket.data.soloGame = board;
        socket.emit('game:solo:start', board);
    };
    const handleSoloMove = (pit: number) => {
        if (typeof pit !== 'number') return;

        const { soloGame: board } = socket.data;

        if (!Mancala.validateMove(board, pit)) {console.log('shit move'); return; }
        const afterPlayerMove = Mancala.makeMove(board, pit);
        
        socket.data.soloGame = afterPlayerMove;
        const isGameOver = Mancala.isGameOver(afterPlayerMove);
        socket.emit('game:solo:update', afterPlayerMove, isGameOver);

        if (afterPlayerMove.whoseTurn === 0 || isGameOver) return;

        const DELAY = 1500;
        const doAiMove = () => {
            const { soloGame } = socket.data;
            if (soloGame == null) { console.log('User disconnected before AI could move'); return; }
            const newBoard = Mancala.makeRandomMove(soloGame);

            socket.data.soloGame = newBoard;
            const gmOver = Mancala.isGameOver(newBoard);
            socket.emit('game:solo:update', newBoard, gmOver);
            if (newBoard.whoseTurn === 1 && !gmOver) setTimeout(() => doAiMove(), DELAY);
        };
        setTimeout(() => doAiMove(), DELAY);
    };
    const handleSoloQuit = () => {
        delete socket.data.soloGame;
    };

    socket.on('lobby:create', handleCreateLobby);
    socket.on('lobby:join', handleJoinLobby);
    socket.on('lobby:leave', handleLeaveLobby);
    
    socket.on('game:start', handleStartGame);
    socket.on('game:makeMove', handleMakeMove);
    
    socket.on('game:solo:start', handleSoloStart);
    socket.on('game:solo:makeMove', handleSoloMove);
    socket.on('game:solo:quit', handleSoloQuit);

    socket.on('disconnect', handleDisconnect);
}

function validate(socket: MySocket, flags: {
    lobby: { exists?: string | true, isNotAnyMember?: true, isLeader?: true, isFull?: true, isNotFull?: true },
    game?: { exists?: true, isNotActive?: true, playerTurn?: true, pit?: number }
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
        if (flags.game.isNotActive) return game == null || Mancala.isGameOver(game.board);
        if (flags.game.exists && game == null) return false;
        if (flags.game.playerTurn && game.board.whoseTurn !== game.playerMap[socket.id]) return false;
        if (flags.game.pit != null && !Mancala.validateMove(game.board, flags.game.pit)) return false;
    }

    return true;
}