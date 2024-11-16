import GamePage from '@/components/framework/GamePage';
import RandzuCoverSVG from '@/games/randzu/assets/game-cover.svg';
import RandzuCoverMobileSVG from '@/games/randzu/assets/game-cover-mobile.svg';
import { useContext } from 'react';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { ClientAppChain } from 'zknoid-chain-dev';
import { useNetworkStore } from '@/lib/stores/network';
import LobbyPage from '@/components/framework/Lobby/LobbyPage';
import { Connect4Config } from '../config';

export default function Connect4Lobby({
  params,
}: {
  params: { lobbyId: string };
}) {
  const networkStore = useNetworkStore();

  const { client } = useContext(ZkNoidGameContext);

  if (!client) {
    throw Error('Context app chain client is not set');
  }

  const client_ = client as ClientAppChain<
    typeof Connect4Config.runtimeModules,
    any,
    any,
    any
  >;

  return (
    <GamePage
      gameConfig={Connect4Config}
      image={RandzuCoverSVG}
      mobileImage={RandzuCoverMobileSVG}
      defaultPage={'Lobby list'}
    >
      <LobbyPage
        lobbyId={params.lobbyId}
        query={
          networkStore.protokitClientStarted
            ? client_.query.runtime.Connect4
            : undefined
        }
        contractName={'Connect4'}
        config={Connect4Config}
      />
    </GamePage>
  );
}
