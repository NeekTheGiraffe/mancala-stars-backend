import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, MySocket } from './socketTypes';
import { registerLobbyHandlers } from './registerLobbyHandlers';
import LobbyContainer from "./LobbyContainer";

const app = express();
const httpServer = createServer(app);
export const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
    (httpServer, { cors: { origin: "*" }});

const lobbies: LobbyContainer = {};

io.on("connection", socket => {
    console.log(`Connection established with ${socket.id}`);
    
    socket.on('requestId', () => socket.emit('yourId', socket.id));
    socket.on('sendMessage', handleMessage);
    socket.on('disconnect', () => console.log(`User ${socket.id} disconnected!`));
    registerLobbyHandlers(socket, io, lobbies);
});



function handleMessage(message: string) {
    const socket: MySocket = this;
    console.log(`${socket.id}: ${message}`);
    io.emit('sendMessage', message);
}

const port = process.env.PORT || 5000;
app.set('port', port);
httpServer.listen(app.get('port'), () => {
    console.log(`Running on port ${port}`);
});