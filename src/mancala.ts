export namespace Mancala {

    const NUM_PITS = 12;

    /*
            |       pits        |
    store 1 | 11 10  9  8  7  6 | store 0
            |  0  1  2  3  4  5 |
    */
    export interface Board {
        /** `stores[0]` is Player 1's store, `stores[1]` is Player 2's. */
        stores: number[],
        /** The first 6 entries represent the pits on Player 1's side.
         * The next 6 entries represent the pits on Player 2's side.
         */
        pits: number[],
        /** This number will be 0 or 1 */
        whoseTurn: number
    }

    export function createBoard(numStartingSeeds = 4): Board {
        return {
            stores: new Array(2).fill(0),
            pits: new Array(NUM_PITS).fill(numStartingSeeds),
            whoseTurn: 0
        }
    }

    export function makeMove(board: Board, startingPit: number): Board {
        const { stores, pits, whoseTurn } = board;

        const numSeeds = pits[startingPit];
        const newStoreValue = (oldValue: number, newPit: number): number => {
            // TODO
            return 0;
        };
        const newPitValue = (oldValue: number, newPit: number): number => {
            
            const baseValue = (newPit === startingPit) ? 0 : oldValue;
            const spacesAway = numSpacesAway(startingPit, newPit);
    
            return baseValue + Math.floor((numSeeds - spacesAway) / (NUM_PITS + 1)) + 1;
        };
        const mayTakeAnotherTurn = (): boolean => {
            // TODO
            return false;
        };
    
        return {
            stores: stores.map(newStoreValue),
            pits: pits.map(newPitValue),
            whoseTurn: mayTakeAnotherTurn() ? whoseTurn : (whoseTurn + 1) % 2
        };
    }

    export function isGameOver(board: Board): boolean {
        const { pits, whoseTurn } = board;
        // Determine the search range
        const [start, end] = whoseTurn === 0 ? [0, NUM_PITS / 2] : [NUM_PITS / 2, NUM_PITS];
        // Return true if all pits in the search range have 0 seeds, false otherwise
        return pits.slice(start, end).find(pit => pit !== 0) == null;
    }

    /** **Assuming that `board` is valid**, returns whether making a move at
     * `pit` would be valid.
     */
    export function validateMove(board: Board, pit: number): boolean {
        if (!Number.isInteger(pit)) return false;
        const { whoseTurn } = board;
        if (whoseTurn === 0) return pit < NUM_PITS / 2 && pit >= 0;
        else return pit < NUM_PITS && pit >= NUM_PITS / 2;
    }

    function numSpacesAway(pit1: number, pit2: number): number {
        const sameSide = side(pit1) === side(pit2);
        if (!sameSide) {
            if (pit2 > pit1)
                return pit2 - pit1 + 1;
            else
                return NUM_PITS + pit2 - pit1 + 1;
        } else if (pit2 > pit1) {
            return pit2 - pit1;
        } else {
            return NUM_PITS + 1 + pit2 - pit1;
        }
    }
    
    function side(pit: number) { return Math.floor(pit / (NUM_PITS / 2)); }
}

export {}