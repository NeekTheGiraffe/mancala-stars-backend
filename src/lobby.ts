import { v4 as uuidv4 } from 'uuid';

export default interface Lobby {
    /** The UUID of this lobby */
    id: string,
    /** The socket ID of the lobby leader */
    leaderId: string,
    /** The type of game that this lobby is for, e.g. "Mancala" */
    game: string,
    /** The number of players currently in this Lobby */
    size: number,
    /** The maximum number of players that this Lobby can hold */
    capacity: number,
    /** An object whose keys are the socket ID's of players in the lobby */
    players: {
        [playerId: string]: true
    }
}

// Pure functions

export function createLobby(leaderId: string): Lobby {
    const id = uuidv4();    
    return {
        id,
        leaderId,
        size: 1,
        capacity: 2,
        game: "Mancala",
        players: {
            [leaderId]: true
        }
    };
}

export function joinLobby(lobby: Lobby, socketId: string): Lobby {
    return {
        ...lobby,
        size: lobby.size + 1,
        players: {
            ...lobby.players,
            [socketId]: true
        }
    };
}

export function leaveLobby(lobby: Lobby, socketId: string): Lobby | undefined {
    const { size, players, leaderId } = lobby;
    if (size === 1) return undefined;

    const { [socketId]: ignored, ...newPlayers } = players;
    const newLeaderId = (socketId === leaderId) ? Object.keys(newPlayers)[0] : leaderId;
    return {
        ...lobby,
        size: size - 1,
        leaderId: newLeaderId,
        players: newPlayers
    };
}