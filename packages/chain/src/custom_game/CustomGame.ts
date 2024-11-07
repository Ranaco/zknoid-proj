import { state, runtimeMethod, runtimeModule } from '@proto-kit/module';
import { StateMap, assert } from '@proto-kit/protocol';
import {
  PublicKey,
  Struct,
  UInt64,
  Provable,
  Bool,
  UInt32,
  Poseidon,
} from 'o1js';
import { MatchMaker } from '../engine/MatchMaker';
import { Lobby } from '../engine/LobbyManager';
import { UInt64 as ProtoUInt64 } from '@proto-kit/library';

const GAME_ROWS = 6;
const GAME_COLS = 6;
const CELLS_TO_WIN = 4;

export class CustomGameBoard extends Struct({
  value: Provable.Array(Provable.Array(UInt32, GAME_COLS), GAME_ROWS),
}) {
  static empty(): CustomGameBoard {
    const emptyGrid = Array.from({ length: GAME_ROWS }, () =>
      Array(GAME_COLS).fill(UInt32.zero),
    );
    return new CustomGameBoard({ value: emptyGrid });
  }

  /**
   * Drops a disc into the specified column for the current player.
   * @param currentPlayerId The ID of the current player (1 or 2).
   * @param col The column index where the disc is to be dropped.
   * @returns The row index where the disc landed.
   */
  dropDisc(currentPlayerId: UInt32, col: UInt32): UInt32 {
    assert(
      UInt32.from(col).lessThan(UInt32.from(GAME_COLS)),
      'Invalid column index',
    );

    let rowIndex = UInt32.zero;
    let placed = Bool(false);

    for (let i = 0; i < GAME_ROWS; i++) {
      const row = UInt32.from(GAME_ROWS - 1 - i);

      const cellValue = this.getCellValue(row, col);

      const isEmptyCell = cellValue.equals(UInt32.zero);
      const shouldPlace = isEmptyCell.and(placed.not());
      placed = placed.or(shouldPlace);

      this.setCellValue(
        row,
        col,
        Provable.if(shouldPlace, currentPlayerId, cellValue),
      );

      rowIndex = Provable.if(shouldPlace, row, rowIndex);
    }

    assert(placed, 'Column is full');
    return rowIndex;
  }

  /**
   * Retrieves the value of the cell at the given position.
   */
  getCellValue(row: UInt32, col: UInt32): UInt32 {
    let cellValue = UInt32.zero;
    for (let r = 0; r < GAME_ROWS; r++) {
      for (let c = 0; c < GAME_COLS; c++) {
        const match = row
          .equals(UInt32.from(r))
          .and(col.equals(UInt32.from(c)));
        cellValue = Provable.if(match, this.value[r][c], cellValue);
      }
    }
    return cellValue;
  }

  /**
   * Sets the value of the cell at the given position.
   */
  setCellValue(row: UInt32, col: UInt32, value: UInt32): void {
    for (let r = 0; r < GAME_ROWS; r++) {
      for (let c = 0; c < GAME_COLS; c++) {
        const match = row
          .equals(UInt32.from(r))
          .and(col.equals(UInt32.from(c)));
        this.value[r][c] = Provable.if(match, value, this.value[r][c]);
      }
    }
  }

  /**
   * Checks if the board is completely filled.
   */
  isFull(): Bool {
    let full = Bool.fromValue(true);
    for (let c = 0; c < GAME_COLS; c++) {
      const cellValue = this.value[0][c];
      full = full.and(cellValue.equals(UInt32.zero).not());
    }
    return full;
  }

  hash() {
    return Poseidon.hash(this.value.flat().map((x) => x.value));
  }
}

export class GameInfo extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  currentMoveUser: PublicKey,
  lastMoveBlockHeight: UInt64,
  board: CustomGameBoard,
  winner: PublicKey,
  gameEnded: UInt32,
}) {}

@runtimeModule()
export class CustomGame extends MatchMaker {
  @state() public games = StateMap.from<UInt64, GameInfo>(UInt64, GameInfo);

  public override async initGame(
    lobby: Lobby,
    shouldUpdate: Bool,
  ): Promise<UInt64> {
    const currentGameId = lobby.id;

    await this.games.set(
      Provable.if(shouldUpdate, currentGameId, UInt64.from(0)),
      new GameInfo({
        player1: lobby.players[0],
        player2: lobby.players[1],
        currentMoveUser: lobby.players[0],
        lastMoveBlockHeight: this.network.block.height,
        board: CustomGameBoard.empty(),
        winner: PublicKey.empty(),
        gameEnded: UInt32.zero,
      }),
    );

    await this.gameFund.set(
      currentGameId,
      ProtoUInt64.from(lobby.participationFee).mul(2),
    );

    return await super.initGame(lobby, shouldUpdate);
  }

  @runtimeMethod()
  public async getSomeData(gameId: UInt64): Promise<GameInfo> {
    return (await this.games.get(gameId)).value;
  }

  @runtimeMethod()
  public async makeMove(gameId: UInt64, col: UInt32): Promise<void> {
    const sessionSender = await this.sessions.get(
      this.transaction.sender.value,
    );
    const sender = Provable.if(
      sessionSender.isSome,
      sessionSender.value,
      this.transaction.sender.value,
    );

    const gameOption = await this.games.get(gameId);
    assert(gameOption.isSome, 'Invalid game ID');
    const game = gameOption.value;

    assert(game.currentMoveUser.equals(sender), 'Not your move');
    assert(game.winner.equals(PublicKey.empty()), 'Game has already ended');

    const currentPlayerId = Provable.if(
      game.currentMoveUser.equals(game.player1),
      UInt32.one,
      UInt32.from(2),
    );

    const rowIndex = game.board.dropDisc(currentPlayerId, col);

    const hasWon = this.checkWin(game.board, currentPlayerId, rowIndex, col);
    const isDraw = game.board.isFull().and(hasWon.not());

    game.winner = Provable.if(
      hasWon,
      game.currentMoveUser,
      Provable.if(isDraw, PublicKey.empty(), game.winner),
    );

    const gameEndedBool = hasWon.or(isDraw);
    game.gameEnded = Provable.if(gameEndedBool, UInt32.one, UInt32.zero);

    game.currentMoveUser = Provable.if(
      gameEndedBool,
      game.currentMoveUser,
      Provable.if(
        game.currentMoveUser.equals(game.player1),
        game.player2,
        game.player1,
      ),
    );

    game.lastMoveBlockHeight = this.network.block.height;
    // Retrieve the updated game state
    await this.games.set(gameId, game);
    const updatedGameOption = await this.games.get(gameId);
    assert(updatedGameOption.isSome, 'Game not found');
    const updatedGame = updatedGameOption.value;
    const gameEnded = updatedGame.gameEnded.equals(UInt32.one);

    // Check if the game has ended
    if (gameEnded) {
      const winnerIsEmpty = updatedGame.winner.equals(PublicKey.empty());
      const winnerShare = ProtoUInt64.from(winnerIsEmpty ? 0 : 1);

      await this.acquireFunds(
        gameId,
        updatedGame.winner,
        PublicKey.empty(),
        winnerShare,
        ProtoUInt64.zero,
        ProtoUInt64.from(1),
      );

      await this.activeGameId.set(updatedGame.player1, UInt64.zero);
      await this.activeGameId.set(updatedGame.player2, UInt64.zero);

      // Call any additional game end logic
      await this._onLobbyEnd(gameId, hasWon);
    }
  }

  /**
   * Checks if the current player has won after placing a disc at the given position.
   * @param board The current game board.
   * @param currentPlayerId The ID of the current player (1 or 2).
   * @param lastRow The row index where the disc was placed.
   * @param lastCol The column index where the disc was placed.
   */
  checkWin(
    board: CustomGameBoard,
    currentPlayerId: UInt32,
    lastRow: UInt32,
    lastCol: UInt32,
  ): Bool {
    let hasWon = Bool(false);

    // Directions represented as pairs of (dx, dy)
    const directions = [
      { dx: 0, dy: 1 }, // Vertical
      { dx: 1, dy: 0 }, // Horizontal
      { dx: 1, dy: 1 }, // Diagonal /
      { dx: 1, dy: -1 }, // Diagonal \
    ];

    for (let dirIndex = 0; dirIndex < directions.length; dirIndex++) {
      const dir = directions[dirIndex];
      let count = UInt32.one;

      // Check in the positive direction
      count = count.add(
        this.countInDirection(
          board,
          currentPlayerId,
          lastRow,
          lastCol,
          dir.dx,
          dir.dy,
        ),
      );

      // Check in the negative direction
      count = count.add(
        this.countInDirection(
          board,
          currentPlayerId,
          lastRow,
          lastCol,
          -dir.dx,
          -dir.dy,
        ),
      );

      // Subtract 1 because we counted the starting position twice
      count = count.sub(UInt32.one);

      hasWon = hasWon.or(count.greaterThanOrEqual(UInt32.from(CELLS_TO_WIN)));
    }

    return hasWon;
  }

  countInDirection(
    board: CustomGameBoard,
    currentPlayerId: UInt32,
    startRow: UInt32,
    startCol: UInt32,
    dx: number,
    dy: number,
  ): UInt32 {
    let count = UInt32.zero;
    let row = startRow;
    let col = startCol;

    for (let step = 1; step < CELLS_TO_WIN; step++) {
      // Calculate new row and column indices
      let newRow = row;
      let newCol = col;

      // Handle dx
      if (dx !== 0) {
        if (dx > 0) {
          newCol = col.add(UInt32.from(step));
        } else {
          const canSubtract = col.greaterThanOrEqual(UInt32.from(step));
          newCol = Provable.if(
            canSubtract,
            col.sub(UInt32.from(step)),
            UInt32.zero,
          );
        }
      }

      // Handle dy
      if (dy !== 0) {
        if (dy > 0) {
          newRow = row.add(UInt32.from(step));
        } else {
          const canSubtract = row.greaterThanOrEqual(UInt32.from(step));
          newRow = Provable.if(
            canSubtract,
            row.sub(UInt32.from(step)),
            UInt32.zero,
          );
        }
      }

      // Check if the new position is within bounds
      const inBounds = newRow
        .lessThan(UInt32.from(GAME_ROWS))
        .and(newCol.lessThan(UInt32.from(GAME_COLS)));

      // Get the cell value at the new position
      const cellValue = this.getCellValue(board, newRow, newCol);
      const samePlayer = cellValue.equals(currentPlayerId);

      const canContinue = inBounds.and(samePlayer);

      count = Provable.if(canContinue, count.add(UInt32.one), count);

      // If we can't continue, break out of the loop
      if (!canContinue) {
        break;
      }
    }

    return count;
  }

  safeSub(a: UInt32, b: UInt32): UInt32 {
    // If a >= b, return a - b; otherwise, return 0
    const underflow = a.lessThan(b);
    const result = a.sub(b);
    return Provable.if(underflow, UInt32.zero, result);
  }

  /**
   * Retrieves the value of the cell at the given position.
   */
  getCellValue(board: CustomGameBoard, row: UInt32, col: UInt32): UInt32 {
    let cellValue = UInt32.zero;
    for (let r = 0; r < GAME_ROWS; r++) {
      for (let c = 0; c < GAME_COLS; c++) {
        const match = row
          .equals(UInt32.from(r))
          .and(UInt32.from(col).equals(UInt32.from(c)));
        cellValue = Provable.if(match, board.value[r][c], cellValue);
      }
    }
    return cellValue;
  }

  @runtimeMethod()
  public async proveOpponentTimeout(gameId: UInt64): Promise<void> {
    await super.proveOpponentTimeout(gameId, true);
  }
}
