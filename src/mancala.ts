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

        // TODO: All seeds get collected if the game is over
        const numSeeds = pits[startingPit];
        const startPos = startingPit % (NUM_PITS / 2); // 0-5 relative to the player
        const endDistance = startPos + numSeeds;
        const endingPit = getEndingPit(endDistance);
        
        const stealFrom = NUM_PITS - 1 - endingPit;
        const steal = endingPit !== -1 && sideOf(endingPit) === whoseTurn &&
            (pits[endingPit] === 0 || startingPit === endingPit) &&
            pits[stealFrom] !== 0;
        const mayTakeAnotherTurn = endingPit === -1;

        //console.log({ endingPit, steal, stealFrom });
        
        const pitValueBeforeStealing = (oldValue: number, newPit: number): number => {
            const baseValue = (newPit === startingPit) ? 0 : oldValue;
            const spacesAway = numSpacesAway(startingPit, newPit);
    
            return baseValue + Math.floor((numSeeds - spacesAway) / (NUM_PITS + 1)) + 1;
        };
        const newStoreValue = (oldValue: number, store: number): number => {
            if (store !== whoseTurn)
                return oldValue;
            const fromStealing = steal ?
                pitValueBeforeStealing(pits[endingPit], endingPit) + pitValueBeforeStealing(pits[stealFrom], stealFrom) :
                0;
            const fromPassing = Math.floor((endDistance - (NUM_PITS / 2)) / (NUM_PITS + 1)) + 1
            return oldValue + fromStealing + fromPassing;
        };
        const newPitValue = (oldValue: number, newPit: number): number => {
            if (steal && (newPit === endingPit || newPit === stealFrom)) return 0;
            return pitValueBeforeStealing(oldValue, newPit);
        }
        
        const newBoard = {
            stores: stores.map(newStoreValue),
            pits: pits.map(newPitValue),
            whoseTurn: mayTakeAnotherTurn ? whoseTurn : (whoseTurn + 1) % 2
        };
        if (!isGameOver(newBoard)) return newBoard;
        
        // Game is over. Must pool all remaining seeds in the pits and
        // place them into the stores.
        const sum = (acc: number, cur: number) => acc + cur;
        return {
            stores: [newBoard.stores[0] + newBoard.pits.slice(0, NUM_PITS / 2).reduce(sum, 0),
                newBoard.stores[1] + newBoard.pits.slice(NUM_PITS / 2).reduce(sum, 0)],
            pits: Array(NUM_PITS).fill(0),
            whoseTurn: newBoard.whoseTurn
        };

        /** Returns the pit index where we landed. If we landed on the player's
         * store, return -1.
         */
        function getEndingPit(endDistance: number) {
            const endPos = endDistance % (NUM_PITS + 1);
            if (endPos === NUM_PITS / 2)
                return -1;
            const adjusted = (endPos > NUM_PITS / 2) ? endPos - 1 : endPos;
            return (sideOf(startingPit) === 1) ? (adjusted + NUM_PITS / 2) % NUM_PITS : adjusted;
        }
    }

    export function makeRandomMove(board: Board): Board {
        const { pits, whoseTurn } = board;
        const nonEmptyPitIndices = pits.reduce((arr, pitValue, pitIndex) => {
            if (pitValue !== 0) return [...arr, pitIndex];
            return arr;
        }, []);
        const validPitIndices = whoseTurn === 0 ?
            nonEmptyPitIndices.filter(val => val < NUM_PITS / 2) :
            nonEmptyPitIndices.filter(val => val >= NUM_PITS / 2);
        const chosenPitIndex = validPitIndices[Math.floor(validPitIndices.length * Math.random())];
        //console.log(`AI makes move at pit ${chosenPitIndex}`);
        return makeMove(board, chosenPitIndex);
    }
    
    export function isGameOver(board: Board): boolean {
        const { pits } = board;
        return pits.slice(0, NUM_PITS / 2).find(pit => pit !== 0) == null ||
            pits.slice(NUM_PITS / 2).find(pit => pit !== 0) == null;
    }

    /** **Assuming that `board` is valid**, returns whether making a move at
     * `pit` would be valid.
     */
    export function validateMove(board: Board, pit: number): boolean {
        if (isGameOver(board)) return false;
        if (!Number.isInteger(pit)) return false;
        const { whoseTurn, pits } = board;
        if (pits[pit] === 0) return false;
        if (whoseTurn === 0) return pit < NUM_PITS / 2 && pit >= 0;
        return pit < NUM_PITS && pit >= NUM_PITS / 2;
    }

    function numSpacesAway(pit1: number, pit2: number): number {
        const sameSide = sideOf(pit1) === sideOf(pit2);
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
    
    function sideOf(pit: number) { return Math.floor(pit / (NUM_PITS / 2)); }
}

export {}