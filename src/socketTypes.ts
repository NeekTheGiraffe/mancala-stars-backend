import Lobby from "./Lobby";
import { Server, Socket } from 'socket.io';

export interface ServerToClientEvents {
    "sendMessage": (m: string) => void;
    "createLobby:success": (lobby: Lobby) => void;
    "joinLobby:success": (lobby: Lobby) => void;
    "leaveLobby:success": () => void;
    "lobbyUpdate": (lobby: Lobby) => void;
    "yourId": (socketId: string) => void;
}
export interface ClientToServerEvents {
    "sendMessage": (m: string) => void;
    "createLobby": () => void;
    "joinLobby": (lobbyId: string) => void;
    "leaveLobby": () => void;
    "requestId": () => void;
    "startGame": () => void;
}
export interface InterServerEvents {}
export interface SocketData {
    lobbyId: string;
}
export type MyServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type MySocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;