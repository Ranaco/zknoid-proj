import { PublicKey, UInt32, UInt64 } from 'o1js';
import { useContext, useEffect } from 'react';
import { useProtokitChainStore } from '@/lib/stores/protokitChain';
import { useNetworkStore } from '@/lib/stores/network';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { Connect4Config } from '../config';
import { type ClientAppChain } from '@proto-kit/sdk';
import { create } from 'zustand';

import { immer } from 'zustand/middleware/immer';
import { Connect4Board, RoundIdxUser } from 'zknoid-chain-dev';
import { MatchMaker, PENDING_BLOCKS_NUM_CONST } from 'zknoid-chain-dev';
import { type ModuleQuery } from '@proto-kit/sequencer';

export interface IGameInfo {
  player1: PublicKey;
  player2: PublicKey;
  currentMoveUser: PublicKey;
  lastMoveBlockHeight: bigint;
  isCurrentUserMove: boolean;
  board: Connect4Board;
  winner: PublicKey;
  gameEnded: bigint;
  gameId: bigint;
  parsed: any;
}

export interface MatchQueueState {
  loading: boolean;
  queueLength: number;
  inQueue: boolean;
  activeGameId: bigint;
  gameInfo: IGameInfo | undefined;
  lastGameState: 'win' | 'lost' | undefined;
  pendingBalance: bigint;
  getQueueLength: () => number;
  loadMatchQueue(
    query: ModuleQuery<MatchMaker>,
    blockHeight: number
  ): Promise<void>;
  loadActiveGame: (
    query: ModuleQuery<MatchMaker>,
    blockHeight: number,
    address: PublicKey
  ) => Promise<void>;
  resetLastGameState: () => void;
}

const PENDING_BLOCKS_NUM = UInt64.from(PENDING_BLOCKS_NUM_CONST);

export const matchQueueInitializer = immer<MatchQueueState>((set) => ({
  loading: Boolean(false),
  queueLength: 0,
  activeGameId: BigInt(0),
  inQueue: Boolean(false),
  gameInfo: undefined as IGameInfo | undefined,
  lastGameState: undefined as 'win' | 'lost' | undefined,
  pendingBalance: 0n,
  resetLastGameState() {
    set((state) => {
      state.lastGameState = undefined;
      state.gameInfo = undefined;
    });
  },
  getQueueLength() {
    return this.queueLength;
  },
  async loadMatchQueue(query: ModuleQuery<MatchMaker>, blockHeight: number) {
    set((state) => {
      state.loading = true;
    });

    console.log(
      'Frontend round',
      UInt64.from(blockHeight).div(PENDING_BLOCKS_NUM).toBigInt()
    );

    const queueLength = await query?.queueLength.get(
      UInt64.from(blockHeight).div(PENDING_BLOCKS_NUM)
    );

    set((state) => {
      // @ts-ignore
      state.queueLength = Number(queueLength?.toBigInt() || 0);
      state.loading = false;
    });
  },
  async loadActiveGame(
    query: ModuleQuery<MatchMaker>,
    blockHeight: number,
    address: PublicKey
  ) {
    set((state) => {
      state.loading = true;
    });

    const activeGameId = await query?.activeGameId.get(address);
    console.log(
      'Active game idd',
      Number(UInt64.from(activeGameId!).toBigInt())
    );
    const inQueue = await query?.queueRegisteredRoundUsers.get(
      //@ts-ignore
      new RoundIdxUser({
        roundId: UInt64.from(blockHeight).div(PENDING_BLOCKS_NUM),
        userAddress: address,
      })
    );

    console.log('Active game idd', activeGameId?.toBigInt());
    console.log('In queue', inQueue?.toBoolean());
    console.log('Following is  the game info', this.gameInfo);

    if (
      activeGameId?.equals(UInt64.from(0)).toBoolean() &&
      this.gameInfo?.gameId
    ) {
      console.log('Setting last game state', this.gameInfo?.gameId);
      const gameInfo = (await query?.games.get(
        UInt64.from(this.gameInfo.gameId)
      ))!;
      console.log(
        'Fetched last game info',
        gameInfo.board.value.map((row: UInt32[]) =>
          row.map((col: UInt32) => Number(col.value.toBigInt()))
        ) ?? 'HEll'
      );
      console.log('Game winner', gameInfo.winner.toBase58());

      set((state) => {
        state.lastGameState = gameInfo.winner.equals(address).toBoolean()
          ? 'win'
          : 'lost';
      });
    }

    if (activeGameId?.greaterThan(UInt64.from(0)).toBoolean()) {
      console.log('from loop', Number(UInt64.from(activeGameId!).toBigInt()));
      const gameInfo = (await query?.games.get(activeGameId))!;

      const currentUserIndex = address
        .equals(gameInfo.player1 as PublicKey)
        .toBoolean()
        ? 0
        : 1;
      const player1 = gameInfo.player1 as PublicKey;
      const player2 = gameInfo.player2 as PublicKey;

      const lastMoveBlockHeight = gameInfo.lastMoveBlockHeight;
      console.log('BH', lastMoveBlockHeight);
      console.log(
        'ValueOfGameEndID',
        gameInfo.board.value.map((row: UInt32[]) =>
          row.map((col: UInt32) => Number(col.value.toBigInt()))
        )
      );
      set((state) => {
        const parsedGameInfo = {
          player1: gameInfo.player1.toBase58(),
          player2: gameInfo.player2.toBase58(),
          currentMoveUser: gameInfo.currentMoveUser.toBase58(),
          lastMoveBlockHeight: lastMoveBlockHeight?.toBigInt(),
          isCurrentUserMove: (gameInfo.currentMoveUser as PublicKey)
            .equals(address)
            .toBoolean(),
          board: gameInfo.board.value.map((row: UInt32[]) =>
            row.map((col: UInt32) => Number(col.value.toBigInt()))
          ),
          winner: gameInfo.winner.equals(PublicKey.empty()).not().toBoolean()
            ? gameInfo.winner.toBase58()
            : undefined,
          gameEnded: UInt32.from(gameInfo.gameEnded).toBigint(),
          gameId: activeGameId.toBigInt(),
        };

        // @ts-ignore
        state.gameInfo = {
          player1,
          player2,
          currentMoveUser: gameInfo.currentMoveUser as PublicKey,
          gameId: activeGameId.toBigInt(),
          lastMoveBlockHeight: lastMoveBlockHeight?.toBigInt(),
          winner: gameInfo.winner.equals(PublicKey.empty()).not().toBoolean()
            ? gameInfo.winner
            : undefined,
          board: gameInfo.board.value.map((row: UInt32[]) =>
            row.map((col: UInt32) => Number(col.value.toBigInt()))
          ),
          gameEnded: gameInfo.gameEnded.value.toBigInt(),
          parsed: parsedGameInfo,
        };
        console.log('Parsed game info', parsedGameInfo);
      });
    }

    const pendingBalance = (
      await query.pendingBalances.get(address)
    )?.toBigInt();

    console.log('Pending balance', pendingBalance);

    set((state) => {
      // @ts-ignore
      state.activeGameId = activeGameId?.toBigInt() || 0n;
      state.inQueue = inQueue?.toBoolean();
      state.loading = false;
      state.pendingBalance = pendingBalance || 0n;
    });
  },
}));

export const useConnect4MatchQueueStore = create<
  MatchQueueState,
  [['zustand/immer', never]]
>(matchQueueInitializer);

export const useObserveConnect4MatchQueue = () => {
  const chain = useProtokitChainStore();
  const network = useNetworkStore();
  const matchQueue = useConnect4MatchQueueStore();
  const { client } = useContext(ZkNoidGameContext);

  const client_ = client as ClientAppChain<
    typeof Connect4Config.runtimeModules,
    any,
    any,
    any
  >;

  useEffect(() => {
    if (
      !network.walletConnected ||
      !network.address ||
      !chain.block?.height ||
      !network.protokitClientStarted
    ) {
      return;
    }

    console.log('This is the client', client);
    console.log('This is the client runtime', client_.query);

    if (!client) {
      throw Error('Context app chain client is not set');
    }

    console.log(
      'Following is the network address | user address',
      network.address
    );

    matchQueue.loadMatchQueue(
      client_.query.runtime.Connect4,
      chain.block?.height
    );
    console.log("LoadingActive")
    matchQueue.loadActiveGame(
      client_.query.runtime.Connect4,
      chain.block?.height,
      PublicKey.fromBase58(network.address!)
    );
  }, [
    chain.block?.height,
    network.walletConnected,
    network.address,
    network.protokitClientStarted,
  ]);
};
