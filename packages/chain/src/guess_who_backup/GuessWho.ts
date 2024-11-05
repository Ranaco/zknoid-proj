import { RuntimeModule, runtimeModule, state, runtimeMethod } from '@proto-kit/module';
import {
  Bool,
  Field,
  Poseidon,
  Provable,
  PublicKey,
  Struct,
  MerkleMap,
  UInt64,
  CircuitString,
  Option,
} from 'o1js';
import { State, StateMap, assert } from '@proto-kit/protocol';
import { MatchMaker } from 'src/engine';
import { Lobby } from 'src/engine';
import { ProtoUInt64 } from 'src';
import { shuffle, uIntToNumber, updateCycle } from './utils';

interface GuessWhoConfig { }

const GW_CHAR_COUNT = 24;
const MAX_CYCLE_SIZE = 50;

// Creating a Trait type which can have any of the give traits which can be used as a list in CharacterInfo
export const Trait = [
  "necklace",
  "glasses",
  "earrings",
  "bald",
  "beard",
  "moustache",
  "blonde_hair",
  "black_hair",
  "brown_hair",
  "bandana",
  "band",
  "tie",
  "mouth_open",
  "bunny_ears",
  "male",
];

export type CharName = ['', ''];

export const questions: String[] = [
  'Is your character a male?',
  'Is your character wearing glasses?',
  'Is your character have a moustache?',
  'Is your character wearing bunny_ears?',
  'Is your character bald?',
  'Does your character have blonde_hair?',
  'Does your character have black_hair?',
  'Does your character have brown_hair?',
  'Does your character have a beard?',
  'Is your character wearing a bandana?',
  'Is your character wearing a band?',
  'is your character wearing earrings?',
  'Is your character wearing a tie?',
  'Is your character wearing a necklace?',
  'Does your character have mouth_open?',
];

// There are two ways of introducing character to the chain, either we can create a regular list of characters, that is reintialized and randomized at the start of every game, or
// we can create a proper CharacterInfo Struct for each character in a list and the can create a randomizing the pre built list each time a new game is created.
// export type CharacterInfo = {
//   name: String,
//   traits: Array<Trait>,
//   pos: UInt64,
//   isPicked: Bool,
//   isCancelled: Bool
// }
// const characters: CharacterInfo[] = []

// As for the board, instead of creating a 2d array or a grid, we can create a 1d array for less complication, and there are no drawbacks for it as of now.
export class CharacterInfo extends Struct({
  id: UInt64,
  name: CircuitString,
  traits: Provable.Array(UInt64, 4),
  pos: UInt64,
  isPicked: Bool,
  isCancelled: Bool,
}) {

}

var characters: CharacterInfo[] = [
  {
    id: UInt64.from(0),
    name: CircuitString.fromString("Chantal"),
    traits: [UInt64.from(1), UInt64.from(0), UInt64.from(2), UInt64.from(8), UInt64.from(12)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(1),
    name: CircuitString.fromString("Eric"),
    traits: [UInt64.from(3), UInt64.from(13), UInt64.from(4), UInt64.from(5), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(2),
    name: CircuitString.fromString("Alex"),
    traits: [UInt64.from(11), UInt64.from(12), UInt64.from(6), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(3),
    name: CircuitString.fromString("Bob"),
    traits: [UInt64.from(13), UInt64.from(4), UInt64.from(6), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(4),
    name: CircuitString.fromString("Paul"),
    traits: [UInt64.from(9), UInt64.from(5), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(5),
    name: CircuitString.fromString("Frank"),
    traits: [UInt64.from(2), UInt64.from(10), UInt64.from(12), UInt64.from(5), UInt64.from(7), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(6),
    name: CircuitString.fromString("Zoe"),
    traits: [UInt64.from(1), UInt64.from(0), UInt64.from(2), UInt64.from(8), UInt64.from(12)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(7),
    name: CircuitString.fromString("Joe"),
    traits: [UInt64.from(1), UInt64.from(3), UInt64.from(5), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(8),
    name: CircuitString.fromString("Buba"),
    traits: [UInt64.from(2), UInt64.from(10), UInt64.from(7)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(9),
    name: CircuitString.fromString("Rita"),
    traits: [UInt64.from(1), UInt64.from(2), UInt64.from(11)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(10),
    name: CircuitString.fromString("Rick"),
    traits: [UInt64.from(1), UInt64.from(11), UInt64.from(4), UInt64.from(5), UInt64.from(6), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(11),
    name: CircuitString.fromString("Antoine"),
    traits: [UInt64.from(5), UInt64.from(8), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(12),
    name: CircuitString.fromString("John"),
    traits: [UInt64.from(1), UInt64.from(7), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(13),
    name: CircuitString.fromString("Chap"),
    traits: [UInt64.from(1), UInt64.from(2), UInt64.from(3), UInt64.from(4), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(14),
    name: CircuitString.fromString("Evelyn"),
    traits: [UInt64.from(0), UInt64.from(2)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(15),
    name: CircuitString.fromString("Lady"),
    traits: [UInt64.from(1), UInt64.from(2), UInt64.from(8)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(16),
    name: CircuitString.fromString("Samantha"),
    traits: [UInt64.from(0), UInt64.from(2), UInt64.from(9), UInt64.from(6)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(17),
    name: CircuitString.fromString("Jenny"),
    traits: [UInt64.from(1), UInt64.from(2)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(18),
    name: CircuitString.fromString("Javier"),
    traits: [UInt64.from(0), UInt64.from(10), UInt64.from(5), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(19),
    name: CircuitString.fromString("Evan"),
    traits: [UInt64.from(5), UInt64.from(6), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(20),
    name: CircuitString.fromString("Mathias"),
    traits: [UInt64.from(1), UInt64.from(3), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(21),
    name: CircuitString.fromString("Michael"),
    traits: [UInt64.from(2), UInt64.from(11), UInt64.from(6), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(22),
    name: CircuitString.fromString("Hank"),
    traits: [UInt64.from(0), UInt64.from(11), UInt64.from(13), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
  {
    id: UInt64.from(23),
    name: CircuitString.fromString("Vito"),
    traits: [UInt64.from(1), UInt64.from(3), UInt64.from(4), UInt64.from(14)],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false)
  },
];

export class GameCycle extends Struct({
  question: UInt64,
  response: Bool,
  moves: Provable.Array(UInt64, GW_CHAR_COUNT), // Moves here represent the positions of characters crossed out for that cycle.
  phase: UInt64,
}) { }

export class GameInfo extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  currentMoveUser: PublicKey,
  lastMoveBlockHeight: UInt64,
  cycles: Provable.Array(GameCycle, MAX_CYCLE_SIZE),
  player1Board: Provable.Array(CharacterInfo, GW_CHAR_COUNT),
  player2Board: Provable.Array(CharacterInfo, GW_CHAR_COUNT),
  winner: PublicKey,
  cycleCount: UInt64,
}) {
  // TODO: Implement check win
  // checkWin = () => {}
}

export class WinWitness extends Struct({}) { }

// export class GuessWhoField extends Struct({
//   value: Provable.Array(UInt64, GW_CHAR_COUNT)
// }) {
//   static from = (value: number[]) => {
//     return new GuessWhoField({
//       value: value.map((val) => UInt64.from(val))
//     })
//   }

//   checkWin = () => {

//   }

//   hash() {
//     return Poseidon.hash(this.value.flat().map((x) => x.value));
//   }
//  }

@runtimeModule()
export class GuessWhoGame extends MatchMaker {
  @state() public games = StateMap.from<UInt64, GameInfo>(UInt64, GameInfo);
  @state() public playerToCharacter = StateMap;

  public override async initGame(
    lobby: Lobby,
    shouldUpdate: Bool,
  ): Promise<UInt64> {
    var returnVal: UInt64 = UInt64.from(0);
    const currGameId = lobby.id;

    await this.games.set(currGameId, {
      player1: lobby.players[0],
      player2: lobby.players[1],
      currentMoveUser: lobby.players[0],
      lastMoveBlockHeight: this.network.block.height,
      cycles: [],
      player1Board: shuffle(characters),  //Randomize using zknoid randomizer
      player2Board: shuffle(characters),
      winner: PublicKey.empty(),
      cycleCount: UInt64.from(0),
    });

    await this.gameFund.set(
      currGameId,
      ProtoUInt64.from(lobby.participationFee).mul(2),
    );

    return await super.initGame(lobby, shouldUpdate);
  }

  private updateCycle() { }

  private checkTxValidity = async (gameId: UInt64, noMoveCheck?: boolean) => {
    const game = await this.games.get(gameId);
    const sessionSender = await this.sessions.get(
      this.transaction.sender.value,
    );
    const sender = Provable.if(
      sessionSender.isSome,
      sessionSender.value,
      this.transaction.sender.value,
    );
    const currPlayerId = sender == game.value.player1 ? 0 : 1;
    assert(game.isSome, 'Invalid game id');
    !noMoveCheck &&
      assert(game.value.currentMoveUser.equals(sender), `Not your move`);
    assert(game.value.winner.equals(PublicKey.empty()), `Game finished`);
    return { game, sender, currPlayerId };
  };

  @runtimeMethod()
  public async proveOpponentTimeout(gameId: UInt64): Promise<void> {
    await super.proveOpponentTimeout(gameId, true);
  }

  @runtimeMethod()
  public async selectCharacter(gameId: UInt64, id: UInt64): Promise<void> {
    const { currPlayerId, game, sender } = await this.checkTxValidity(gameId);

    // Fix this if possible;
    if (!currPlayerId) {
      game.value.player1Board[Number(id.toBigInt())].isPicked = Bool(true);
    } else {
      game.value.player2Board[Number(id.toBigInt())].isPicked = Bool(true);
    }

    await this.games.set(gameId, game.value);
  }

  @runtimeMethod()
  public async askQuestion(gameId: UInt64, id: UInt64): Promise<void> {

    const { game } = await this.checkTxValidity(gameId);

    const lastCycle = game.value.cycles.at(game.value.cycles.length - 1);

    assert(
      lastCycle?.phase.equals(UInt64.from(2)) ?? Bool(false),
      'Previous cycle is ongoing',
    );

    const cycle = new GameCycle({
      question: id,
      moves: [],
      response: Bool(false),
      phase: UInt64.from(1),
    });

    // Create a new cycle for game
    game.value.cycles.push(cycle);
    await this.games.set(gameId, game.value);
  }

  @runtimeMethod()
  public async respond(gameId: UInt64, response: Bool): Promise<void> {
    const { game, currPlayerId } = await this.checkTxValidity(gameId, true);

    // Check for a valid move.
    questions.map((val) => {
      const words = val.split(" ")
      const currTrait = words[words.length - 1].replace("?", "")
      if (!currPlayerId) {
        const pickedPlayer = game.value.player1Board.filter((val) => val.isPicked)[0]
        assert(Bool(pickedPlayer.traits.includes(UInt64.from(Trait.indexOf(currTrait)))), "Invalid response")
      } else {
        const pickedPlayer = game.value.player2Board.filter((val) => val.isPicked)[0]
        assert(Bool(pickedPlayer.traits.includes(UInt64.from(Trait.indexOf(currTrait)))), "Invalid response")
      }
    })

    assert(Bool(game.value.cycles.length > 0), 'No cycles');
    var cycle = game.value.cycles.at(uIntToNumber(game.value.cycleCount) - 1);
    assert(cycle?.phase.equals(UInt64.from(1)) ?? Bool(false), 'Invalid phase');

    if (cycle) {
      cycle.response = response;
      cycle.phase = UInt64.from(2);
      game.value.cycles[game.value.cycles.length - 1] = cycle
      await this.games.set(gameId, game.value);
    }
  }

  // Push the move to cycle, cancel the character from current player's board, update cycle phase and game.
  // Maybe update the name for this function.
  @runtimeMethod()
  public async makeMove(gameId: UInt64, charIds: UInt64[]): Promise<void> {
    const { game, currPlayerId } = await this.checkTxValidity(gameId);

    const checkedCharIds = new Set(charIds);
    const lastCycleIndex = uIntToNumber(game.value.cycleCount) - 1;
    const lastCycle = game.value.cycles[lastCycleIndex];

    assert(lastCycle.phase.equals(UInt64.from(2)), 'Opponent is yet to respond');

    const newMoves: UInt64[] = [];

    for (const id of checkedCharIds) {
      const charIndex = uIntToNumber(id);
      if (currPlayerId === 0) {
        if (!game.value.player1Board[charIndex].isCancelled) {
          game.value.player1Board[charIndex].isCancelled = Bool(true);
          newMoves.push(id);
        }
      } else {
        if (!game.value.player2Board[charIndex].isCancelled) {
          game.value.player2Board[charIndex].isCancelled = Bool(true);
          newMoves.push(id);
        }
      }
    }

    lastCycle.moves = Provable.Array(UInt64, GW_CHAR_COUNT).fromValue([...lastCycle.moves, ...newMoves]);

    game.value.cycles[lastCycleIndex] = lastCycle;

    game.value.currentMoveUser = Provable.if(
      game.value.currentMoveUser.equals(game.value.player1),
      game.value.player2,
      game.value.player1,
    );

    game.value.lastMoveBlockHeight = this.network.block.height;

    await this.games.set(gameId, game.value);
    this.checkWin(gameId);

  }

  private async checkWin(gameId: UInt64) {
    const { game } = await this.checkTxValidity(gameId);

    const player1Remaining = game.value.player1Board.filter(val => !val.isCancelled);
    const player1Picked = game.value.player1Board.find((val) => val.isPicked)
    const player2Remaining = game.value.player2Board.filter(val => !val.isCancelled);
    const player2Picked = game.value.player2Board.find((val) => val.isPicked)

    const winProposed = Bool.or(
      player1Remaining.length == 1,
      player2Remaining.length == 1
    )

    if (player1Remaining.length == 1) {

      game.value.winner = Provable.if(
        player1Remaining[0].id.equals(player2Picked!.id),
        game.value.player1,
        game.value.player2
      )

      // if (player1Remaining[0].id == player2Picked!.id) {
      //   game.value.winner = game.value.player1;
      // } else {
      //   game.value.winner = game.value.player2;
      // }
    } else if (player2Remaining.length == 1) {
      game.value.winner = Provable.if(
        player2Remaining[0].id.equals(player1Picked!.id),
        game.value.player2,
        game.value.player1
      )

      // if (player2Remaining[0].id == player1Picked!.id) {
      //   game.value.winner = game.value.player2;
      // } else {
      //   game.value.winner = game.value.player1;
      // }
    }

    const winnerShare = ProtoUInt64.from(
      Provable.if<ProtoUInt64>(
        winProposed,
        ProtoUInt64,
        ProtoUInt64.from(1),
        ProtoUInt64.from(0),
      ),
    );

    await this.acquireFunds(
      gameId,
      game.value.winner,
      PublicKey.empty(),
      winnerShare,
      ProtoUInt64.from(0),
      ProtoUInt64.from(1),
    );

    await this.activeGameId.set(
      Provable.if(winProposed, game.value.player2, PublicKey.empty()),
      UInt64.from(0),
    );
    await this.activeGameId.set(
      Provable.if(winProposed, game.value.player1, PublicKey.empty()),
      UInt64.from(0),
    );

    await this.games.set(gameId, game.value);

    await this._onLobbyEnd(gameId, winProposed);
  }

}
