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
const GAME_COLS = 7;
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
    assert(col.lessThan(UInt32.from(GAME_COLS)), 'Invalid column index');

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
    let full = Bool(true);
    for (let c = 0; c < GAME_COLS; c++) {
      const cellValue = this.value[0][c];
      full = full.and(!cellValue.equals(UInt32.zero));
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
    await this.games.set(gameId, game);
    // // Retrieve the updated game state
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

    const directions = [
      { dx: UInt32.zero, dy: UInt32.one }, // Vertical
      { dx: UInt32.one, dy: UInt32.zero }, // Horizontal
      { dx: UInt32.one, dy: UInt32.one }, // Diagonal /
      { dx: UInt32.one, dy: UInt32.from(GAME_ROWS - 1) }, // Diagonal \
    ];

    for (let dirIndex = 0; dirIndex < directions.length; dirIndex++) {
      const dir = directions[dirIndex];
      let count = UInt32.one;

      // Positive direction
      for (let step = 1; step < CELLS_TO_WIN; step++) {
        const stepUInt = UInt32.from(step);
        const row = UInt32.from(lastRow).add(dir.dy.mul(stepUInt));
        const col = UInt32.from(lastCol).add(dir.dx.mul(stepUInt));

        const inBounds = row
          .lessThan(UInt32.from(GAME_ROWS))
          .and(UInt32.from(col).lessThan(UInt32.from(GAME_COLS)));

        const cellValue = this.getCellValue(board, row, col);
        const samePlayer = cellValue.equals(currentPlayerId);

        const canContinue = inBounds.and(samePlayer);
        count = Provable.if(canContinue, count.add(1), count);
      }

      // Negative direction (simulate by subtracting steps)
      for (let step = 1; step < CELLS_TO_WIN; step++) {
        const stepUInt = UInt32.from(step);
        const rowStep = dir.dy.mul(stepUInt);
        const colStep = dir.dx.mul(stepUInt);

        // Check if lastRow >= dir.dy * stepUInt
        const rowValid = UInt32.from(lastRow)
          .greaterThan(rowStep)
          .or(lastRow.equals(rowStep));
        // Check if lastCol >= dir.dx * stepUInt
        const colValid = UInt32.from(lastCol)
          .greaterThan(colStep)
          .or(UInt32.from(lastCol).equals(colStep));

        const row = Provable.if(rowValid, lastRow.sub(rowStep), UInt32.zero);
        const col = Provable.if(colValid, lastCol.sub(colStep), UInt32.zero);

        const inBounds = rowValid
          .and(colValid)
          .and(row.lessThan(UInt32.from(GAME_ROWS)))
          .and(col.lessThan(UInt32.from(GAME_COLS)));

        const cellValue = this.getCellValue(board, row, col);
        const samePlayer = cellValue.equals(currentPlayerId);

        const canContinue = inBounds.and(samePlayer);
        count = Provable.if(canContinue, count.add(1), count);
      }
      hasWon = hasWon.or(
        UInt32.from(count).greaterThanOrEqual(UInt32.from(CELLS_TO_WIN)),
      );
    }

    return hasWon;
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
