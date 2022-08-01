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