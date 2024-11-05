import { Bool, UInt64 } from "o1js";
import { GameCycle, questions } from "./GuessWho";

export function shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array
}

// export const uIntToNumber = (num: UInt64) => Number(num.toBigInt())

export const updateCycle = async (cycle: GameCycle,
    { question, response, moves, phase }:
        Partial<{ question: UInt64 | null, response: Bool | null, moves: [] | null, phase: UInt64 | null }>) => {
    var cycle = new GameCycle({
        question: question ?? cycle.question,
        moves: moves ?? cycle.moves,
        response: response ?? cycle.response,
        phase: phase ?? cycle.phase
    })
}