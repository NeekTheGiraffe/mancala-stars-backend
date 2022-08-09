import Lobby from "lobby";
import Game from "game";
import { Server, Socket } from 'socket.io';
import { Mancala } from "mancala";

export interface ServerToClientEvents {
    "sendMessage": (m: string) => void;

    "lobby:create:success": (lobby: Lobby) => void;
    "lobby:join:success": (lobby: Lobby) => void;
    "lobby:leave:success": () => void;
    "lobby:update": (lobby: Lobby) => void;

    "game:start": (game: Game) => void;
    "game:update": (game: Game, isGameOver: boolean) => void;
    "game:end": () => void;

    "game:solo:start": (board: Mancala.Board) => void;
    "game:solo:update": (board: Mancala.Board, isGameOver: boolean) => void;

    "yourId": (socketId: string) => void;
}
export interface ClientToServerEvents {
    "sendMessage": (m: string) => void;

    "lobby:create": () => void;
    "lobby:join": (lobbyId: string) => void;
    "lobby:leave": () => void;

    "game:start": () => void;
    "game:makeMove": (pit: number) => void;

    "game:solo:start": () => void;
    "game:solo:makeMove": (pit: number) => void;

    "requestId": () => void;
}
export interface InterServerEvents {}
export interface SocketData {
    lobbyId: string;
    soloGame?: Mancala.Board;
}
export type MyServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type MySocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;