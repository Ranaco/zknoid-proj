import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from '@proto-kit/module';
import {
  Bool,
  Field,
  Provable,
  PublicKey,
  Struct,
  UInt64,
  CircuitString,
} from 'o1js';
import { Option, StateMap, assert } from '@proto-kit/protocol';
import { MatchMaker } from '../engine/MatchMaker';
import { Lobby } from '../engine/LobbyManager';
import { shuffle } from './utils';
import { UInt64 as ProtoUInt64 } from '@proto-kit/library';

interface GuessWhoConfig {}

const GW_CHAR_COUNT = 24;
const MAX_CYCLE_SIZE = 30;

// Creating a Trait type which can have any of the give traits which can be used as a list in CharacterInfo
export const Trait = [
  'necklace',
  'glasses',
  'earrings',
  'bald',
  'beard',
  'moustache',
  'blonde_hair',
  'black_hair',
  'brown_hair',
  'bandana',
  'band',
  'tie',
  'mouth_open',
  'bunny_ears',
  'male',
  'NaN',
];

export const questions: string[] = [
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
  traits: Provable.Array(UInt64, 6),
  pos: UInt64,
  isPicked: Bool,
  isCancelled: Bool,
}) {}

export const characters: CharacterInfo[] = [
  {
    id: UInt64.from(0),
    name: CircuitString.fromString('Chantal'),
    traits: [
      UInt64.from(1),
      UInt64.from(0),
      UInt64.from(2),
      UInt64.from(8),
      UInt64.from(12),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(1),
    name: CircuitString.fromString('Eric'),
    traits: [
      UInt64.from(3),
      UInt64.from(13),
      UInt64.from(4),
      UInt64.from(5),
      UInt64.from(14),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(2),
    name: CircuitString.fromString('Alex'),
    traits: [
      UInt64.from(11),
      UInt64.from(12),
      UInt64.from(6),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(3),
    name: CircuitString.fromString('Bob'),
    traits: [
      UInt64.from(13),
      UInt64.from(4),
      UInt64.from(6),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(4),
    name: CircuitString.fromString('Paul'),
    traits: [
      UInt64.from(9),
      UInt64.from(5),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(5),
    name: CircuitString.fromString('Frank'),
    traits: [
      UInt64.from(2),
      UInt64.from(10),
      UInt64.from(12),
      UInt64.from(5),
      UInt64.from(7),
      UInt64.from(14),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(6),
    name: CircuitString.fromString('Zoe'),
    traits: [
      UInt64.from(1),
      UInt64.from(0),
      UInt64.from(2),
      UInt64.from(8),
      UInt64.from(12),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(7),
    name: CircuitString.fromString('Joe'),
    traits: [
      UInt64.from(1),
      UInt64.from(3),
      UInt64.from(5),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(8),
    name: CircuitString.fromString('Buba'),
    traits: [
      UInt64.from(2),
      UInt64.from(10),
      UInt64.from(7),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(9),
    name: CircuitString.fromString('Rita'),
    traits: [
      UInt64.from(1),
      UInt64.from(2),
      UInt64.from(11),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(10),
    name: CircuitString.fromString('Rick'),
    traits: [
      UInt64.from(1),
      UInt64.from(11),
      UInt64.from(4),
      UInt64.from(5),
      UInt64.from(6),
      UInt64.from(14),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(11),
    name: CircuitString.fromString('Antoine'),
    traits: [
      UInt64.from(5),
      UInt64.from(8),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(12),
    name: CircuitString.fromString('John'),
    traits: [
      UInt64.from(1),
      UInt64.from(7),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(13),
    name: CircuitString.fromString('Chap'),
    traits: [
      UInt64.from(1),
      UInt64.from(2),
      UInt64.from(3),
      UInt64.from(4),
      UInt64.from(14),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(14),
    name: CircuitString.fromString('Evelyn'),
    traits: [
      UInt64.from(0),
      UInt64.from(2),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(15),
    name: CircuitString.fromString('Lady'),
    traits: [
      UInt64.from(1),
      UInt64.from(2),
      UInt64.from(8),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(16),
    name: CircuitString.fromString('Samantha'),
    traits: [
      UInt64.from(0),
      UInt64.from(2),
      UInt64.from(9),
      UInt64.from(6),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(17),
    name: CircuitString.fromString('Jenny'),
    traits: [
      UInt64.from(1),
      UInt64.from(2),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(18),
    name: CircuitString.fromString('Javier'),
    traits: [
      UInt64.from(0),
      UInt64.from(10),
      UInt64.from(5),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(19),
    name: CircuitString.fromString('Evan'),
    traits: [
      UInt64.from(5),
      UInt64.from(6),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(20),
    name: CircuitString.fromString('Mathias'),
    traits: [
      UInt64.from(1),
      UInt64.from(3),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(21),
    name: CircuitString.fromString('Michael'),
    traits: [
      UInt64.from(2),
      UInt64.from(11),
      UInt64.from(6),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(22),
    name: CircuitString.fromString('Hank'),
    traits: [
      UInt64.from(0),
      UInt64.from(11),
      UInt64.from(13),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
  {
    id: UInt64.from(23),
    name: CircuitString.fromString('Vito'),
    traits: [
      UInt64.from(1),
      UInt64.from(3),
      UInt64.from(4),
      UInt64.from(14),
      UInt64.from(15),
      UInt64.from(15),
    ],
    pos: UInt64.from(0),
    isPicked: Bool(false),
    isCancelled: Bool(false),
  },
];

// const tempChar = characters.map((val) => new CharacterInfo({ ...val }))
export class GameCycle extends Struct({
  question: UInt64,
  response: Bool,
  moves: Provable.Array(UInt64, GW_CHAR_COUNT), // Moves here represent the positions of characters crossed out for that cycle.
  phase: UInt64,
}) {}

export class Board extends Struct({
  value: Provable.Array(CharacterInfo, GW_CHAR_COUNT),
}) {
  // public static empty(): CharValue {
  //     const value = Array<UInt64>(GW_CHAR_COUNT).fill(UInt64.from(0));
  //     return new CharValue({ value });
  // }

  static from(value: CharacterInfo[]) {
    return new Board({
      value: value.map((val) => new CharacterInfo(val)),
    });
  }
}

export class GameInfo extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  currentMoveUser: PublicKey,
  lastMoveBlockHeight: UInt64,
  cycles: Provable.Array(GameCycle, MAX_CYCLE_SIZE),
  player1Board: Board,
  player2Board: Board,
  winner: PublicKey,
  someRandomValue: UInt64,
}) {
  // TODO: Implement check win
  // checkWin = () => {}
}

export class WinWitness extends Struct({}) {}

@runtimeModule()
export class GuessWhoGame extends MatchMaker {
  @state() public games = StateMap.from<UInt64, GameInfo>(UInt64, GameInfo);
  @state() public playerToCharacter = StateMap;

  public override async initGame(
    lobby: Lobby,
    shouldUpdate: Bool,
  ): Promise<UInt64> {
    const currGameId = lobby.id;

    const emptyCycle = new GameCycle({
      moves: Array(GW_CHAR_COUNT).fill(UInt64.from(100)),
      phase: UInt64.from(0),
      question: UInt64.from(0),
      response: Bool(false),
    });

    await this.games.set(
      Provable.if(shouldUpdate, currGameId, UInt64.from(0)),
      new GameInfo({
        player1: lobby.players[0],
        player2: lobby.players[1],
        currentMoveUser: lobby.players[0],
        lastMoveBlockHeight: this.network.block.height,
        cycles: Array(MAX_CYCLE_SIZE).fill(emptyCycle),
        player1Board: new Board({ value: characters }), //Randomize using zknoid randomizer
        player2Board: new Board({ value: characters }),
        winner: PublicKey.empty(),
        someRandomValue: UInt64.from(3381),
      }),
    );

    await this.gameFund.set(
      currGameId,
      ProtoUInt64.from(lobby.participationFee).mul(2),
    );

    return await super.initGame(lobby, shouldUpdate);
  }

  private updateCycle() {}

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
    const currPlayerId = Provable.if(
      Bool(sender.equals(game.value.player1)),
      UInt64.from(0),
      UInt64.from(1),
    );
    assert(game.isSome, 'Invalid game id');
    // Provable.asProver(() => {
    //     !noMoveCheck &&
    //         assert(game.value.currentMoveUser.equals(sender), `Not your move`);
    // })
    assert(game.value.winner.equals(PublicKey.empty()), `Game finished`);
    return { game, sender, currPlayerId };
  };

  // @runtimeMethod()
  // public async proveOpponentTimeout(gameId: UInt64): Promise<void> {
  //     await super.proveOpponentTimeout(gameId, true);
  // }

  @runtimeMethod()
  public async selectCharacter(gameId: UInt64, id: UInt64): Promise<void> {
    const { currPlayerId, game, sender } = await this.checkTxValidity(gameId);

    let selCharInd = 0;

    // const game = await this.games.get(gameId)

    // Fix this if possible;
    Provable.asProver(() => {
      if (sender.equals(game.value.player1)) {
        for (let i = 0; i < GW_CHAR_COUNT; i++) {
          const currentChar = game.value.player1Board.value[i];
          if (currentChar.id.equals(id).toBoolean()) {
            selCharInd = i;
          }
        }
      } else {
        for (let i = 0; i < GW_CHAR_COUNT; i++) {
          const currentChar = game.value.player2Board.value[i];
          if (currentChar.id.equals(id).toBoolean()) {
            selCharInd = i;
          }
        }
      }
      if (sender.equals(game.value.player1).toBoolean()) {
        game.value.player1Board.value[selCharInd] = {
          ...game.value.player1Board.value[selCharInd],
          isPicked: Bool(true),
        };
      } else {
        game.value.player2Board.value[selCharInd] = {
          ...game.value.player2Board.value[selCharInd],
          isPicked: Bool(true),
        };
      }
    });

    // Provable.asProver(() => {
    //     console.log("Following is the board value", game.value.player1Board.value[4].isPicked)
    // })

    game.value.lastMoveBlockHeight = this.network.block.height;
    game.value.currentMoveUser = Provable.if(
      game.value.currentMoveUser.equals(game.value.player1),
      game.value.player2,
      game.value.player1,
    );

    await this.games.set(gameId, game.value);
  }

  @runtimeMethod()
  public async askQuestion(gameId: UInt64, id: UInt64): Promise<void> {
    const { game } = await this.checkTxValidity(gameId);

    // let lastCycle = new GameCycle({
    //     moves: Array(0).fill(0),
    //     phase: UInt64.from(0),
    //     question: id,
    //     response: Bool(false)
    // })

    // Provable.asProver(() => {
    //     lastCycle.phase = Provable.if(
    //         Bool(game.value.cycles.length > 0),
    //         UInt64,
    //         game.value.cycles.at(game.value.cycles.length - 1),
    //         UInt64.from(0)
    //     );
    //     assert(
    //         lastCycle?.phase?.equals(UInt64.from(2)),
    //         'Previous cycle is ongoing',
    //     );
    // })

    const cycle = new GameCycle({
      moves: Array(GW_CHAR_COUNT).fill(UInt64.from(100)),
      phase: UInt64.from(1),
      question: id,
      response: Bool(false),
    });

    let firstEmptyCycleIndex = 100;

    // Create a new cycle for game
    Provable.asProver(() => {
      for (let i = 0; i < MAX_CYCLE_SIZE; i++) {
        if (game.value.cycles[i].phase.equals(UInt64.from(0)).toBoolean()) {
          firstEmptyCycleIndex = i;
          break;
        }
      }
      console.log('This is the first empty cycle index', firstEmptyCycleIndex);
    });
    game.value.cycles[firstEmptyCycleIndex] = cycle;
    game.value.lastMoveBlockHeight = this.network.block.height;
    game.value.currentMoveUser = Provable.if(
      game.value.currentMoveUser.equals(game.value.player1),
      game.value.player2,
      game.value.player1,
    );
    await this.games.set(gameId, game.value);
  }

  @runtimeMethod()
  public async respond(gameId: UInt64, response: Bool): Promise<void> {
    const { game, currPlayerId } = await this.checkTxValidity(gameId, true);

    // let isInvalid = Bool(false);
    // let cycle = new GameCycle({
    //   moves: Array(GW_CHAR_COUNT).fill(UInt64.from(0)),
    //   phase: UInt64.from(2),
    //   question: UInt64.from(0),
    //   response: Bool(false),
    // });
    let firstEmptyCycleIndex = 0;

    // Create a new cycle for game
    Provable.asProver(() => {
      for (let i = 0; i < MAX_CYCLE_SIZE; i++) {
        if (game.value.cycles[i].phase.equals(UInt64.from(1)).toBoolean()) {
          firstEmptyCycleIndex = i;
          break;
        }
      }
      console.log('This is the first empty cycle index', firstEmptyCycleIndex);
      //   questions.map((val) => {
      //     const words = val.split(' ');
      //     const currTrait = words[words.length - 1].replace('?', '');
      //     if (currPlayerId.equals(UInt64.from(0)).toBoolean()) {
      //       const pickedPlayer = game.value.player1Board.value.filter((val) =>
      //         val.isPicked.toBoolean(),
      //       )[0];
      //       if (
      //         !pickedPlayer.traits.includes(UInt64.from(Trait.indexOf(currTrait)))
      //       ) {
      //         isInvalid = Bool(true);
      //       }
      //     } else {
      //       const pickedPlayer = game.value.player2Board.value.filter((val) =>
      //         val.isPicked.toBoolean(),
      //       )[0];
      //       if (
      //         pickedPlayer.traits.includes(UInt64.from(Trait.indexOf(currTrait)))
      //       ) {
      //         isInvalid = Bool(true);
      //       }
      //     }
      //   });
    });

    // assert(Bool(isInvalid).not(), 'Invalid response');

    let cycle = game.value.cycles[firstEmptyCycleIndex];

    cycle.response = response;
    cycle.phase = UInt64.from(2);

    game.value.cycles[firstEmptyCycleIndex] = cycle;
    game.value.lastMoveBlockHeight = this.network.block.height;
    game.value.currentMoveUser = Provable.if(
      game.value.currentMoveUser.equals(game.value.player1),
      game.value.player2,
      game.value.player1,
    );
    await this.games.set(gameId, game.value);
  }

  // Push the move to cycle, cancel the character from current player's board, update cycle phase and game.
  // Maybe update the name for this function.
  @runtimeMethod()
  public async makeMove(gameId: UInt64, playerBoard: Board): Promise<void> {
    const { game, currPlayerId } = await this.checkTxValidity(gameId);
    const currBoard = Provable.if(
      Bool(currPlayerId.equals(UInt64.from(0))),
      Board,
      game.value.player1Board,
      game.value.player2Board,
    );

    var newMoves: UInt64[] = [];

    let firstEmptyCycleIndex = 0;

    Provable.asProver(() => {
      for (let i = 0; i < MAX_CYCLE_SIZE; i++) {
        if (game.value.cycles[i].phase.equals(UInt64.from(2)).toBoolean()) {
          firstEmptyCycleIndex = i;
          break;
        }
      }

      for (let i = 0; i < GW_CHAR_COUNT; i++) {
        const currCharInfo = currBoard.value[i];
        for (let j = 0; j < GW_CHAR_COUNT; j++) {
          let newCharInfo = playerBoard.value[j];
          if (newCharInfo.id.equals(currCharInfo.id).toBoolean()) {
            newCharInfo = currCharInfo;
            newCharInfo.isCancelled = Bool(true);
            newMoves.push(newCharInfo.id);
            playerBoard.value[j] = newCharInfo;
            if (currPlayerId.equals(UInt64.from(0)).toBoolean()) {
              game.value.player1Board.value[i] = playerBoard.value[j];
            } else {
              game.value.player2Board.value[i] = playerBoard.value[j];
            }
          }
          //   }
        }
      }
    });

    let lastCycle = game.value.cycles[firstEmptyCycleIndex];

    assert(
      lastCycle.phase.equals(UInt64.from(2)),
      'Opponent is yet to respond',
    );

    for (let j = 0; j < newMoves.length; j++) {
      lastCycle.moves[j] = newMoves[j];
    }

    lastCycle.phase = UInt64.from(3);

    game.value.cycles[firstEmptyCycleIndex] = lastCycle;

    // await this.games.set(gameId, game.value);
    await this.checkWin(gameId, game.value);
  }

  @runtimeMethod()
  private async checkWin(gameId: UInt64, game: GameInfo) {
    const { currPlayerId } = await this.checkTxValidity(gameId);

    let remainingCount = UInt64.from(0);

    Provable.asProver(() => {
      if (currPlayerId.equals(UInt64.from(0)).toBoolean()) {
        for (let i = 0; i < GW_CHAR_COUNT; i++) {
          if (
            game.player1Board.value[i].isCancelled
              .equals(Bool(false))
              .toBoolean()
          ) {
            remainingCount = remainingCount.add(UInt64.from(1));
          }
        }
      } else {
        for (let i = 0; i < GW_CHAR_COUNT; i++) {
          if (
            game.player2Board.value[i].isCancelled
              .equals(Bool(false))
              .toBoolean()
          ) {
            remainingCount = remainingCount.add(UInt64.from(1));
          }
        }
      }
    });

    const winProposed = Provable.if(
      remainingCount.equals(UInt64.from(1)),
      Bool(true),
      Bool(false),
    );

    game.winner = Provable.if(
      winProposed,
      game.currentMoveUser,
      PublicKey.empty(),
    );

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
      game.winner,
      PublicKey.empty(),
      winnerShare,
      ProtoUInt64.from(0),
      ProtoUInt64.from(1),
    );

    await this.activeGameId.set(
      Provable.if(winProposed, game.player2, PublicKey.empty()),
      UInt64.from(0),
    );
    await this.activeGameId.set(
      Provable.if(winProposed, game.player1, PublicKey.empty()),
      UInt64.from(0),
    );

    game.currentMoveUser = Provable.if(
      winProposed,
      game.currentMoveUser,
      Provable.if(
        game.currentMoveUser.equals(game.player1),
        game.player2,
        game.player1,
      ),
    );

    game.lastMoveBlockHeight = this.network.block.height;

    await this.games.set(gameId, game);

    await this._onLobbyEnd(gameId, winProposed);
  }
}
