import { createConfig } from '@/lib/createConfig';
import { arkanoidConfig, arkanoidRedirectConfig } from './arkanoid/config';
import { randzuConfig, randzuRedirectConfig } from './randzu/config';
import { checkersConfig, checkersRedirectConfig } from './checkers/config';
import {
  thimblerigConfig,
  thimblerigRedirectConfig,
} from './thimblerig/config';
import { pokerConfig } from '@/games/poker/config';
import { tileVilleConfig } from '@/games/tileville/config';
import { lotteryConfig } from '@/games/lottery/config';
import { numberGuessingConfig } from './number_guessing/config';
import { guessWhoConfig } from './guess_who/config';
import { connect4Config } from './connect_4/config';

export const zkNoidConfig = createConfig({
  games: [
    // lotteryConfig,
    // tileVilleConfig,
    // randzuConfig,
    // checkersConfig,
    // thimblerigConfig,
    // pokerConfig,
    // arkanoidConfig,
    // numberGuessingConfig,
    guessWhoConfig,
    connect4Config,
  ],
});
