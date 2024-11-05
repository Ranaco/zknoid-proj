import { Bool, PublicKey, UInt64 } from 'o1js';
import { useContext, useEffect } from 'react';
import { useProtokitChainStore } from '@/lib/stores/protokitChain';
import { useNetworkStore } from '@/lib/stores/network';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { guessWhoConfig } from '../config';
import { type ClientAppChain } from '@proto-kit/sdk';
import { create } from 'zustand';

import { immer } from 'zustand/middleware/immer';
import { RoundIdxUser } from 'zknoid-chain-dev';
import { MatchMaker, PENDING_BLOCKS_NUM_CONST } from 'zknoid-chain-dev';
import { type ModuleQuery } from '@proto-kit/sequencer';
import { Board, GameCycle } from 'zknoid-chain-dev/dist/src/guess_who/GuessWho';
import { CharacterInfo } from '../lib/types';

export interface IGameInfo<I> {
  player1: PublicKey;
  player2: PublicKey;
  player1Board: Board;
  player2Board: Board;
  currentMoveUser: PublicKey;
  winner: PublicKey;
  cycles: I[];
  currentUserIndex: 0 | 1;
  isCurrentUserMove: boolean;
  opponent: PublicKey;
  gameId: bigint;
  lastMoveBlockHeight: bigint;
  parsed: any;
}

export interface MatchQueueState {
  loading: boolean;
  queueLength: number;
  inQueue: boolean;
  activeGameId: bigint;
  gameInfo: IGameInfo<GameCycle> | undefined;
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
  gameInfo: undefined as IGameInfo<GameCycle> | undefined,
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

    console.log('Queue length from loadMatchQueue', queueLength);

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
        UInt64.from(this.gameInfo?.gameId!)
      ))!;
      console.log('Fetched last game info', gameInfo);
      console.log('Game winner', gameInfo.winner.toBase58());

      set((state) => {
        state.lastGameState = gameInfo.winner.equals(address).toBoolean()
          ? 'win'
          : 'lost';
        state.gameInfo!.cycles = gameInfo.cycles;
        state.gameInfo!.isCurrentUserMove = false;
      });
    }

    if (activeGameId?.greaterThan(UInt64.from(0)).toBoolean()) {
      console.log('from loop', Number(UInt64.from(activeGameId!).toBigInt()));
      const gameInfo = (await query?.games.get(activeGameId))!;
      console.log('Raw game info', gameInfo);

      const currentUserIndex = address
        .equals(gameInfo.player1 as PublicKey)
        .toBoolean()
        ? 0
        : 1;
      const player1 = gameInfo.player1 as PublicKey;
      const player2 = gameInfo.player2 as PublicKey;

      const lastMoveBlockHeight = gameInfo.lastMoveBlockHeight;
      console.log('BH', lastMoveBlockHeight);
      set((state) => {
        const parsedGameInfo = {
          currentCycle: null,
          player1: gameInfo.player1.toBase58(),
          player2: gameInfo.player2.toBase58(),
          currentMoveUser: gameInfo.currentMoveUser.toBase58(),
          cycles: gameInfo.cycles.map((cycle: GameCycle) => {
            return {
              question: Number(cycle.question.toBigInt()),
              response: cycle.response.toBoolean(),
              moves: cycle.moves.map((move: UInt64) => Number(move.toBigInt())),
              phase: Number(cycle.phase.toBigInt()),
            };
          }),
          currentUserIndex,
          isCurrentUserMove: (gameInfo.currentMoveUser as PublicKey)
            .equals(address)
            .toBoolean(),
          opponent:
            currentUserIndex == 1
              ? gameInfo.player1.toBase58()
              : gameInfo.player2.toBase58(),
          gameId: activeGameId.toBigInt(),
          lastMoveBlockHeight: lastMoveBlockHeight?.toBigInt(),
          winner: gameInfo.winner.equals(PublicKey.empty()).not().toBoolean()
            ? gameInfo.winner.toBase58()
            : undefined,
          someRandomValue: gameInfo.someRandomValue.toBigInt(),
          player1Board: gameInfo.player1Board.value.map(
            (character: CharacterInfo) => {
              return {
                id: Number(character.id.toBigInt()),
                name: character.name.toString(),
                traits: character.traits.map((trait: UInt64) =>
                  Number(trait.toBigInt())
                ),
                pos: character.pos.toBigInt(),
                isPicked: character.isPicked.toBoolean(),
                isCancelled: character.isCancelled.toBoolean(),
              };
            }
          ),
          player2Board: gameInfo.player2Board.value.map(
            (character: CharacterInfo) => {
              return {
                id: Number(character.id.toBigInt()),
                name: character.name.toString(),
                traits: character.traits.map((trait: UInt64) =>
                  Number(trait.toBigInt())
                ),
                pos: character.pos.toBigInt(),
                isPicked: character.isPicked.toBoolean(),
                isCancelled: character.isCancelled.toBoolean(),
              };
            }
          ),
        };

        parsedGameInfo.currentCycle =
          parsedGameInfo.cycles.filter(
            (cycle: any) => cycle.phase !== 0 && cycle.phase !== 3
          ).length > 0
            ? parsedGameInfo.cycles
                .filter((cycle: any) => cycle.phase !== 3)
                .sort((a: any, b: any) => b.phase - a.phase)[0]
            : parsedGameInfo.cycles.find((cycle: any) => cycle.phase === 0);
        // @ts-ignore
        state.gameInfo = {
          player1,
          player2,
          currentMoveUser: gameInfo.currentMoveUser as PublicKey,
          cycles: gameInfo.cycles, // @todo temporal workaround for proto-kit bug https://github.com/ZkNoid/proto-kit,
          currentUserIndex,
          isCurrentUserMove: (gameInfo.currentMoveUser as PublicKey)
            .equals(address)
            .toBoolean(),
          opponent: currentUserIndex == 1 ? gameInfo.player1 : gameInfo.player2,
          gameId: activeGameId.toBigInt(),
          lastMoveBlockHeight: lastMoveBlockHeight?.toBigInt(),
          winner: gameInfo.winner.equals(PublicKey.empty()).not().toBoolean()
            ? gameInfo.winner
            : undefined,
          player1Board: gameInfo.player1Board,
          player2Board: gameInfo.player2Board,
          parsed: parsedGameInfo,
        };
        console.log('Parsed game info', parsedGameInfo);
      });
    }

    console.log('This is the query', query);

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

export const useGuessWhoMatchQueueStore = create<
  MatchQueueState,
  [['zustand/immer', never]]
>(matchQueueInitializer);

export const useObserveGuessWhoMatchQueue = () => {
  const chain = useProtokitChainStore();
  const network = useNetworkStore();
  const matchQueue = useGuessWhoMatchQueueStore();
  const { client } = useContext(ZkNoidGameContext);

  const client_ = client as ClientAppChain<
    typeof guessWhoConfig.runtimeModules,
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
      client_.query.runtime.GuessWhoGame,
      chain.block?.height
    );
    matchQueue.loadActiveGame(
      client_.query.runtime.GuessWhoGame,
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
