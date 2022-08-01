import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, MySocket } from './types/socketTypes';
import { registerLobbyHandlers } from './registerLobbyHandlers';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
    (httpServer, { cors: { origin: "*" }});

io.on("connection", socket => {
    console.log(`Connection established with ${socket.id}`);
    
    socket.on('requestId', handleRequestId);
    socket.on('sendMessage', handleMessage);
    socket.on('disconnect', handleDisconnect);
    registerLobbyHandlers(socket, io);
});

function handleRequestId() {
    const socket: MySocket = this;
    socket.emit('yourId', socket.id);
}

function handleMessage(message: string) {
    const socket: MySocket = this;
    console.log(`${socket.id}: ${message}`);
    io.emit('sendMessage', message);
}

function handleDisconnect() {
    const socket: MySocket = this;
    console.log(`User ${socket.id} disconnected!`);
}

const port = process.env.PORT || 5000;
app.set('port', port);
httpServer.listen(app.get('port'), () => {
    console.log(`Running on port ${port}`);
});