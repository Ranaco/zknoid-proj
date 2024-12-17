import GamePage from '@/components/framework/GamePage';
import RandzuCoverMobileSVG from '@/games/randzu/assets/game-cover-mobile.svg';
import { useContext } from 'react';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { ClientAppChain } from 'zknoid-chain-dev';
import { useNetworkStore } from '@/lib/stores/network';
import LobbyPage from '@/components/framework/Lobby/LobbyPage';
import { connect4Config } from '../config';
import Connect4Cover from '../assets/Connect4Cover.png';

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
    typeof connect4Config.runtimeModules,
    any,
    any,
    any
  >;

  return (
    <GamePage
      gameConfig={connect4Config}
      image={Connect4Cover}
      mobileImage={Connect4Cover}
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
        config={connect4Config}
      />
    </GamePage>
  );
}
