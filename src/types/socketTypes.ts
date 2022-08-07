import Lobby from "lobby";
import { Server, Socket } from 'socket.io';

export interface ServerToClientEvents {
    "sendMessage": (m: string) => void;

    "lobby:create:success": (lobby: Lobby) => void;
    "lobby:join:success": (lobby: Lobby) => void;
    "lobby:leave:success": () => void;
    "lobby:update": (lobby: Lobby) => void;

    "yourId": (socketId: string) => void;
}
export interface ClientToServerEvents {
    "sendMessage": (m: string) => void;

    "lobby:create": () => void;
    "lobby:join": (lobbyId: string) => void;
    "lobby:leave": () => void;

    "requestId": () => void;
    "startGame": () => void;
}
export interface InterServerEvents {}
export interface SocketData {
    lobbyId: string;
}
export type MyServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type MySocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;