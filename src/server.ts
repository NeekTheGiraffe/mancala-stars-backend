import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from 'uuid';

interface ServerToClientEvents {
    "sendMessage": (m: string) => void;
    "createLobby:success": (lobby: Lobby) => void;
    "joinLobby:success": (lobby: Lobby) => void;
    "leaveLobby:success": () => void;
    "lobbyUpdate": (lobby: Lobby) => void;
    "yourId": (socketId: string) => void;
}
interface ClientToServerEvents {
    "sendMessage": (m: string) => void;
    "createLobby": () => void;
    "joinLobby": (lobbyId: string) => void;
    "leaveLobby": () => void;
    "requestId": () => void;
    "startGame": () => void;
}
interface InterServerEvents {}
interface SocketData {
    lobbyId: string;

}
interface Lobby {
    id: string,
    leaderId: string,
    game: string,
    size: number,
    capacity: number,
    players: {
        [playerId: string]: true
    }
}
interface LobbyContainer {
    [lobbyId: string]: Lobby
}

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
    (httpServer, { cors: { origin: "*" }});
type MySocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const lobbies: LobbyContainer = {};

io.on("connection", socket => {
    console.log(`Connection established with ${socket.id}`);
    
    socket.on('requestId', () => socket.emit('yourId', socket.id));
    socket.on('sendMessage', handleMessage);
    socket.on('createLobby', handleCreateLobby);
    socket.on('joinLobby', handleJoinLobby);
    socket.on('leaveLobby', handleLeaveLobby);
    socket.on('disconnect', handleDisconnect);
    socket.on('startGame', handleStartGame);
});

function handleMessage(message: string) {
    const socket: MySocket = this;
    console.log(`${socket.id}: ${message}`);
    io.emit('sendMessage', message);
}

function handleCreateLobby() {
    const socket: MySocket = this;
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

function handleJoinLobby(lobbyId: string) {
    const socket: MySocket = this;
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

function handleStartGame() {
    const socket: MySocket = this;

    const { lobbyId } = socket.data;
    if (lobbyId == null) return; // Socket isn't in a lobby
    if (lobbies[lobbyId].leaderId !== socket.id) return; // Socket isn't the leader of a lobby
    if (lobbies[lobbyId].capacity !== lobbies[lobbyId].size) return; // Socket's lobby isn't full

    // TODO: Actually start the game and let the clients know a game has started
}

function handleLeaveLobby() {
    const socket: MySocket = this;

    const { lobbyId } = socket.data;
    if (lobbyId == null) return; // Socket isn't in a lobby
    
    socket.leave(lobbyId);
    socket.data.lobbyId = undefined;
    socket.emit("leaveLobby:success");

    handlePlayerLeftLobby(lobbyId, socket.id);
}

function handleDisconnect() {
    const socket: MySocket = this;

    console.log(`User ${socket.id} disconnected!`);
    //console.log(socket.data.lobbyId);
    const { lobbyId } = socket.data;
    if (lobbyId != null) {
        handlePlayerLeftLobby(lobbyId, socket.id);
    }
}

function handlePlayerLeftLobby(lobbyId: string, leaverId: string) {
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




const port = process.env.PORT || 5000;
app.set('port', port);
httpServer.listen(app.get('port'), () => {
    console.log(`Running on port ${port}`);
});