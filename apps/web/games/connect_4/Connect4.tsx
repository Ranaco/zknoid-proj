import React, { useState } from 'react';
import { useNetworkStore } from '@/lib/stores/network';
import {
  useConnect4MatchQueueStore,
  useObserveConnect4MatchQueue,
} from './stores/matchQueue';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { useProtokitChainStore } from '@/lib/stores/protokitChain';
import { UInt32, UInt64 } from 'o1js';
import { ClientAppChain } from 'zknoid-chain-dev';
import { connect4Config } from './config';
import {
  useLobbiesStore,
  useObserveLobbiesStore,
} from '@/lib/stores/lobbiesStore';
import { useStore } from 'zustand';
import { useSessionKeyStore } from '@/lib/stores/sessionKeyStorage';
import { useStartGame } from './features/startGame';
import { DEFAULT_PARTICIPATION_FEE } from 'zknoid-chain-dev/dist/src/engine/LobbyManager';
import GamePage from '@/components/framework/GamePage';
import { useToasterStore } from '@/lib/stores/toasterStore';
import { useRateGameStore } from '@/lib/stores/rateGameStore';
import { api } from '@/trpc/react';
import styles from './Game.module.css';
import { GameWrap } from '@/components/framework/GamePage/GameWrap';
import { Win } from '@/components/framework/GameWidget/ui/popups/Win';
import { Lost } from '@/components/framework/GameWidget/ui/popups/Lost';
import WaitingPopup from './components/popup/waiting';
import Connect4Cover from './assets/Connect4Cover.png';

type Player = 1 | 2 | 'Draw' | null;

const rows = 6;
const cols = 6;

enum GameState {
  NotStarted,
  MatchRegistration,
  Matchmaking,
  Active,
  Won,
  Lost,
  Waiting,
}

const competition = {
  id: 'global',
  name: 'Global competition',
  enteringPrice: BigInt(+DEFAULT_PARTICIPATION_FEE.toString()),
  prizeFund: 0n,
};

const Connect4Game: React.FC = () => {
  const [gameState, setGameState] = React.useState<GameState>(
    GameState.NotStarted
  );
  const [finalState, setFinalState] = React.useState<GameState>(
    GameState.Active
  );
  const [loading, setLoading] = React.useState(false);

  const startGame = useStartGame(competition.id, setGameState);

  const { client } = React.useContext(ZkNoidGameContext);

  if (!client) {
    throw Error('Context app chain client is not set');
  }
  const networkStore = useNetworkStore();
  useObserveConnect4MatchQueue();
  const matchQueue = useConnect4MatchQueueStore();

  const client_ = client as ClientAppChain<
    typeof connect4Config.runtimeModules,
    any,
    any,
    any
  >;

  const query = networkStore.protokitClientStarted
    ? client_.query.runtime.Connect4
    : undefined;

  useObserveLobbiesStore(query);
  const lobbiesStore = useLobbiesStore();

  console.log('Active lobby', lobbiesStore.activeLobby);

  React.useEffect(() => {
    // if (matchQueue.gameInfo?.parsed.currentCycle) {
    //     setGameState(GameState.Waiting)
    // }

    console.log('Match Queue: ', matchQueue);

    if (matchQueue.inQueue && !matchQueue.activeGameId) {
      setGameState(GameState.Matchmaking);
    } else if (
      matchQueue.activeGameId &&
      Number(matchQueue.activeGameId) !== 0
    ) {
      setGameState(GameState.Active);
    } else {
      if (matchQueue.lastGameState == 'win') {
        setGameState(GameState.Won);
        setFinalState(GameState.Won);
      }

      if (matchQueue.lastGameState == 'lost') {
        console.log('LastGameState', matchQueue.lastGameState);
        setGameState(GameState.Lost);
        setFinalState(GameState.Lost);
      }
    }
  }, [matchQueue.activeGameId, matchQueue.inQueue, matchQueue.lastGameState]);

  const restart = () => {
    matchQueue.resetLastGameState();
    setGameState(GameState.NotStarted);
  };

  const sessionPrivateKey = useStore(useSessionKeyStore, (state) =>
    state.getSessionKey()
  );

  const makeMove = async (col: number = 2) => {
    if (!matchQueue.gameInfo?.parsed.isCurrentUserMove) return;
    console.log('making move', matchQueue.gameInfo);

    const Connect4 = client.runtime.resolve('Connect4');

    const tx = await client.transaction(
      sessionPrivateKey.toPublicKey(),
      async () => {
        Connect4.makeMove(
          UInt64.from(matchQueue.gameInfo!.gameId),
          UInt32.from(col)
        );
      }
    );

    setLoading(true);

    tx.transaction = tx.transaction?.sign(sessionPrivateKey);
    await tx.send();

    setLoading(false);
  };

  React.useEffect(() => {
    if (matchQueue.gameInfo) {
      console.log('BoardEffect', matchQueue.gameInfo?.parsed.board);
      if (matchQueue.gameInfo.parsed.winner) {
        if (matchQueue.gameInfo.parsed.winner == networkStore.address) {
          console.log('WinnerIs', matchQueue.gameInfo.parsed.winner);
          setGameState(GameState.Won);
        } else {
          console.log('LoserIs', matchQueue.gameInfo.parsed.winner);
          setGameState(GameState.Lost);
        }
      }

      console.log('CurrentMove', matchQueue.gameInfo.parsed.currentMoveUser);

      setGameState(
        matchQueue.gameInfo.parsed.isCurrentUserMove
          ? GameState.Active
          : GameState.Waiting
      );
    }

    setBoard(matchQueue.gameInfo?.parsed.board);
  }, [matchQueue.gameInfo]);

  const [board, setBoard] = useState<Player[][]>(
    Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null))
  );
  const [winner, setWinner] = useState<Player>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  return (
    <GamePage
      gameConfig={connect4Config}
      image={Connect4Cover}
      mobileImage={Connect4Cover}
      defaultPage={'Game'}
    >
      {finalState === GameState.Won && (
        <GameWrap>
          <Win
            onBtnClick={restart}
            title={'You won! Congratulations!'}
            btnText={'Find new game'}
          />
        </GameWrap>
      )}
      {finalState === GameState.Lost && (
        <GameWrap>
          <Lost startGame={restart} />
        </GameWrap>
      )}
      {finalState == GameState.Active && (
        <div className={styles.container}>
          <div className={styles.sidebar}>
            <span className={'text-2xl font-bold uppercase text-[#D4F829]'}>
              GAME STATUS: {GameState[gameState]}
            </span>
            <span className={'mt-2 flex flex-row items-center text-2xl'}>
              <span className="uppercase text-[#D4F829]">
                Your opponent:&nbsp;
              </span>
              <span className="inline-block max-w-[350px] overflow-hidden text-ellipsis py-2">
                <span>
                  {networkStore.address ===
                  matchQueue.gameInfo?.parsed.currentMoveUser
                    ? `${networkStore.address}`
                    : `${networkStore.address}`}
                </span>
              </span>
            </span>
          </div>
          <div className="flex h-full flex-1 flex-col items-center justify-center">
            <div className={styles.board}>
              {board?.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`${styles.cell} ${hoverCol === colIndex ? styles.hoverCell : ''}`}
                      onClick={() => makeMove(colIndex)}
                      onMouseEnter={() => setHoverCol(colIndex)}
                      onMouseLeave={() => setHoverCol(null)}
                    >
                      <div
                        className={`${styles.disc} ${cell === 1 ? styles.redDisc : cell === 2 ? styles.yellowDisc : ''}`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.game_footer}>
              <h1 className={styles.title}>Connect 4 - 6x6 Grid</h1>
              <h1 className={styles.title}>
                <span className="uppercase text-[#D4F829]">Author:&nbsp;</span>
                <span className="font-bold">CodeDecoders</span>
              </h1>
            </div>
          </div>
          {gameState === GameState.Waiting && <WaitingPopup />}
          <div className={styles.sidebar}>
            <span className={'text-4xl text-[#D4F829]'}>Competition</span>
            <div>
              <span className={'text-2xl text-[#D4F829]'}>
                LOBBY NAME:&nbsp;
                <span className="text-white">
                  {lobbiesStore.activeLobby?.name}
                </span>
              </span>
            </div>

            <div>
              <span className={'text-2xl text-[#D4F829]'}>
                FUNDS:&nbsp;
                <span className="text-white">
                  {lobbiesStore.activeLobby?.reward}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </GamePage>
  );
};

export default Connect4Game;
