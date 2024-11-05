import { createZkNoidGameConfig } from '@/lib/createConfig';
import { ZkNoidGameType } from '@/lib/platform/game_types';
import { ZkNoidGameFeature, ZkNoidGameGenre } from '@/lib/platform/game_tags';
import { CustomGame } from 'zknoid-chain-dev';
import { LogoMode } from '@/app/constants/games';
import CustomGameHome from './CustomGame';
import CustomGameLobby from './components/CustomGameLobby';

export const customGameConfig = createZkNoidGameConfig({
  id: 'custom_game',
  type: ZkNoidGameType.PVP,
  name: 'CustomGame',
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
    CustomGame,
  },
  page: CustomGameHome,
  lobby: CustomGameLobby,
});
