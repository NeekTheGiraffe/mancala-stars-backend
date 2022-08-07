import Lobby from 'lobby';
import { Mancala } from './mancala';

export default interface Game {
    playerMap: { [playerId: string]: number };
    board: Mancala.Board;
}

export function createGame(lobby: Lobby): Game {
    return {
        // playerMap will look something like: { id1: 0, id2: 1 }
        // essentially mapping the player IDs to an index value
        playerMap: Object.keys(lobby.players)
            .reduce((playerMap, playerId, i) => ({ ...playerMap, [playerId]: i }), {}),
        board: Mancala.createBoard()
    };
}