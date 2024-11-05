import { UInt64 } from '@proto-kit/library';
import { ArkanoidGameHub } from './arkanoid/ArkanoidGameHub';
import { RandzuLogic } from './randzu/RandzuLogic';
import { ThimblerigLogic } from './thimblerig/ThimblerigLogic';
import { Balances } from './framework';
import { ModulesConfig } from '@proto-kit/common';
import { CheckersLogic } from './checkers';
import { GuessGame } from './number_guessing';
import { GuessWhoGame } from './guess_who';
import { CustomGame } from './custom_game';

const modules = {
  // GuessWhoGame,
  Balances,
  CustomGame: CustomGame,
  // ArkanoidGameHub,
  // ThimblerigLogic,
  // RandzuLogic,
  // CheckersLogic,
  // GuessGame
};

const config: ModulesConfig<typeof modules> = {
  // GuessWhoGame: {},
  Balances: {
    totalSupply: UInt64.from(10000),
  },
  CustomGame: {},
  // ArkanoidGameHub: {},
  // ThimblerigLogic: {},
  // RandzuLogic: {},
  // CheckersLogic: {},
  // GuessGame: {}
};

export default {
  modules,
  config,
};
