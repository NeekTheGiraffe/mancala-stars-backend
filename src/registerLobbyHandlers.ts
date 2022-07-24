import { MySocket, MyServer } from "./socketTypes";
import { v4 as uuidv4 } from 'uuid';
import LobbyContainer from "./LobbyContainer";

export function registerLobbyHandlers(socket: MySocket, io: MyServer, lobbies: LobbyContainer) {

    const handleCreateLobby = () => {
        if (socket.data.lobbyId != null) return;
        
        const uuid = uuidv4();
        socket.join(uuid); // Socket instance joins room
        socket.data.lobbyId = uuid; // Socket can only join one 'lobby' room
        lobbies[uuid] = {
            id: uuid,
            leaderId: socket.id,
            size: 1,
            capacity: 2,
            game: "Mancala",
            players: {
                [socket.id]: true
            }
        }; // Keep track of lobby data
    
        socket.emit("createLobby:success", lobbies[uuid]);
    }
    const handleJoinLobby = (lobbyId: string) => {
        if (socket.data.lobbyId != null) return; // Socket cannot join more than 1 lobby
        if (lobbies[lobbyId] == null) return; // Lobby doesn't exist
        if (lobbies[lobbyId].size >= lobbies[lobbyId].capacity) return; // Lobby is full
    
        socket.data.lobbyId = lobbyId;
        lobbies[lobbyId].size++;
        lobbies[lobbyId].players[socket.id] = true;
        io.to(lobbyId).emit("lobbyUpdate", lobbies[lobbyId]);
    
        socket.join(lobbyId);
        socket.emit("joinLobby:success", lobbies[lobbyId]);
    }
    const handleLeaveLobby = () => {
        const { lobbyId } = socket.data;
        if (lobbyId == null) return; // Socket isn't in a lobby
    
        socket.leave(lobbyId);
        socket.data.lobbyId = undefined;
        socket.emit("leaveLobby:success");

        handlePlayerLeftLobby(lobbyId, socket.id);
    }
    const handleDisconnect = () => {
        const { lobbyId } = socket.data;
        if (lobbyId != null) {
            handlePlayerLeftLobby(lobbyId, socket.id);
        }
    }
    const handlePlayerLeftLobby = (lobbyId: string, leaverId: string) => {
        const lobby = lobbies[lobbyId];
        lobby.size--;
        if (lobby.size === 0) {
            // Nobody is in the lobby. Delete it.
            lobbies[lobbyId] = undefined;
            return;
        }
        
        lobby.players[leaverId] = undefined;
        // If the person who left was the leader
        if (leaverId === lobby.leaderId) {
            // Replace the leader
            //console.log('Leader left the lobby');
            const playerIds = Object.keys(lobby.players);
            lobby.leaderId = playerIds.find(playerId => playerId !== leaverId);
        }
        // Tell the clients about the new lobby
        io.to(lobbyId).emit("lobbyUpdate", lobby);
    }
    const handleStartGame = () => {
    
        const { lobbyId } = socket.data;
        if (lobbyId == null) return; // Socket isn't in a lobby
        if (lobbies[lobbyId].leaderId !== socket.id) return; // Socket isn't the leader of a lobby
        if (lobbies[lobbyId].capacity !== lobbies[lobbyId].size) return; // Socket's lobby isn't full
    
        // TODO: Actually start the game and let the clients know a game has started
    }

    socket.on('createLobby', handleCreateLobby);
    socket.on('joinLobby', handleJoinLobby);
    socket.on('leaveLobby', handleLeaveLobby);
    socket.on('disconnect', handleDisconnect);
    socket.on('startGame', handleStartGame);
}