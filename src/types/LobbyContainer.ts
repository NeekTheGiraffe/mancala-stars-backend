import Lobby from "./Lobby";
export default interface LobbyContainer {
    [lobbyId: string]: Lobby
}