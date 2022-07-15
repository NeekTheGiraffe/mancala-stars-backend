import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" }});

io.on("connection", socket => {
    console.log(`Connection established with ${socket.id}`);

    socket.on('sendMessage', message => {
        console.log(`${socket.id}: ${message}`);
        io.emit('sendMessage', message);
    });
    socket.on('disconnect', () => console.log(`User ${socket.id} disconnected!`));
});

app.set('port', process.env.PORT || 5000);
httpServer.listen(app.get('port'), () => {
    console.log(`Running on port ${httpServer.address().port}`)
});