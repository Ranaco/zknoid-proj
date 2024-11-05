import * as React from 'react';
import { useNetworkStore } from '@/lib/stores/network';
import {
  useCustomGameMatchQueueStore,
  useObserveCustomGameMatchQueue,
} from './stores/matchQueue';
import RandzuCoverSVG from '../randzu/assets/game-cover.png';
import RandzuCoverMobileSVG from '../randzu/assets/game-cover-mobile.svg';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { useProtokitChainStore } from '@/lib/stores/protokitChain';
import { Bool, CircuitString, UInt64 } from 'o1js';
import { ClientAppChain } from 'zknoid-chain-dev';
import { useGuessWhoMatchQueueStore } from '../guess_who/stores/matchQueue';
import { customGameConfig } from './config';
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

const CustomGame: React.FC = () => {
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
  const toasterStore = useToasterStore();
  const rateGameStore = useRateGameStore();
  const protokitChain = useProtokitChainStore();
  useObserveCustomGameMatchQueue();
  const matchQueue = useCustomGameMatchQueueStore();
  const progress = api.progress.setSolvedQuests.useMutation();
  const getRatingQuery = api.ratings.getGameRating.useQuery({
    gameId: 'connect-4',
  });

  const client_ = client as ClientAppChain<
    typeof customGameConfig.runtimeModules,
    any,
    any,
    any
  >;

  const query = networkStore.protokitClientStarted
    ? client_.query.runtime.CustomGame
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

  const makeMove = async () => {
    console.log('making move', matchQueue.gameInfo);

    const CustomGameGame = client.runtime.resolve('Connect4Game');

    const tx = await client.transaction(
      sessionPrivateKey.toPublicKey(),
      async () => {
        CustomGameGame.makeMove(UInt64.from(matchQueue.gameInfo!.gameId), 2);
      }
    );

    setLoading(true);

    tx.transaction = tx.transaction?.sign(sessionPrivateKey);
    await tx.send();

    setLoading(false);
  };

  return (
    <GamePage
      gameConfig={customGameConfig}
      image={RandzuCoverSVG}
      mobileImage={RandzuCoverMobileSVG}
      defaultPage={'Game'}
    >
      <button className="bg-blue-500" onClick={() => makeMove()}>
        Make move
      </button>
    </GamePage>
  );
};

export default CustomGame;
