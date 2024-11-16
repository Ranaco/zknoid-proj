import { createZkNoidGameConfig } from '@/lib/createConfig';
import { ZkNoidGameType } from '@/lib/platform/game_types';
import { ZkNoidGameFeature, ZkNoidGameGenre } from '@/lib/platform/game_tags';
import { Connect4 } from 'zknoid-chain-dev';
import { LogoMode } from '@/app/constants/games';
import Connect4Home from './Connect4';
import Connect4Lobby from './components/Connect4Lobby';

export const Connect4Config = createZkNoidGameConfig({
  id: 'Connect4',
  type: ZkNoidGameType.PVP,
  name: 'Connect4',
  description:
    'Guess who is a game where a player hides a character and gives the PC to another player. Other player tries to guess the character',
  image: '/image/games/soon.svg',
  logoMode: LogoMode.CENTER,
  genre: ZkNoidGameGenre.BoardGames,
  features: [ZkNoidGameFeature.Multiplayer],
  isReleased: true,
  releaseDate: new Date(2024, 0, 1),
  popularity: 50,
  author: 'CodeDecoders',
  rules:
    'Guess who is a game where a player hides a character and gives the PC to another player. Other player tries to guess the character',
  runtimeModules: {
    Connect4,
  },
  page: Connect4Home,
  lobby: Connect4Lobby,
});
