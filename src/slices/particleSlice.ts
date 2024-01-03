import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import type { RawPhrase } from "nmemonica";

import { logger } from "./globalSlice";
import { getPhrase } from "./phraseSlice";
import { DebugLevel } from "./settingHelper";
import type {
  ChoiceParticle,
  ParticleGamePhrase,
} from "../components/Games/ParticlesGame";
import { JapaneseText } from "../helper/JapaneseText";
import { romajiParticle } from "../helper/kanaHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";

import type { RootState } from ".";

export interface ParticleInitSlice {
  particleGame: {
    phrases: ParticleGamePhrase[];
    particles: ChoiceParticle[];
  };

  setting: {
    aRomaji: boolean;
    fadeInAnswers: boolean;
  };
}

export const particleInitState: ParticleInitSlice = {
  particleGame: {
    phrases: [],
    particles: [],
  },

  setting: {
    aRomaji: false,
    fadeInAnswers: false,
  },
};

export const getParticleGame = createAsyncThunk(
  "particle/getParticleGame",
  async (arg, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState).particle;
    const phrases = (thunkAPI.getState() as RootState).phrases.value;

    if (phrases.length > 0) {
      const needGame = state.particleGame.phrases.length === 0;
      let game: undefined | ReturnType<typeof buildParticleGame> = undefined;
      if (needGame) {
        game = buildParticleGame(phrases);

        const { errors } = game;
        if (errors) {
          Object.keys(errors).forEach((k) => {
            thunkAPI.dispatch(
              logger(`Multiple match ${errors[k].japanese}`, DebugLevel.WARN)
            );
            thunkAPI.dispatch(
              logger(
                `Particle ${errors[k].particle}: ${errors[k].times}`,
                DebugLevel.WARN
              )
            );
          });
        }
      }

      return { game };
    } else {
      return thunkAPI
        .dispatch(getPhrase())
        .unwrap()
        .then((res) => {
          const { values: phraseArray } = res;
          const game = buildParticleGame(phraseArray);

          const { errors } = game;
          if (errors) {
            Object.keys(errors).forEach((k) => {
              thunkAPI.dispatch(
                logger(`Multiple match ${errors[k].japanese}`, DebugLevel.WARN)
              );
              thunkAPI.dispatch(
                logger(
                  `Particle ${errors[k].particle}: ${errors[k].times}`,
                  DebugLevel.WARN
                )
              );
            });
          }

          return { phrase: phraseArray, game };
        });
    }
  }
);

export const particleFromLocalStorage = createAsyncThunk(
  "particleGame/particleFromLocalStorage",
  (arg: typeof particleInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

/**
 * Filters RawPhrase to be used by PhrasesGame
 */
export function buildParticleGame(rawPhrases: RawPhrase[]) {
  let particleList: ChoiceParticle[] = [];
  let multipleMatch:
    | undefined
    | Record<string, { japanese: string; particle: string; times: number }>;

  const wParticles = rawPhrases.reduce<ParticleGamePhrase[]>((acc, curr) => {
    if (curr.particles && curr.particles?.length > 0) {
      const phrase = JapaneseText.parse(curr);
      // remove workaround space for calculations
      const spelling = phrase.getSpelling();

      curr.particles.forEach((p) => {
        if (spelling.split(p).length === 2) {
          const romaji = romajiParticle(p);
          const start = spelling.indexOf(p);
          const end = start + p.length;
          const particle = { japanese: p, romaji };
          const particleCopy = {
            japanese: p,
            romaji,
            start,
            end,
          };

          particleList = [...particleList, particle];
          acc = [
            ...acc,
            {
              answer: particleCopy,
              question: curr,
              english: curr.english,
              literal: curr.lit,
            },
          ];
        } else {
          // FIXME: more than one match
          // de vs desu 17612a51a05ef2e9fcc9e67f99f4836f
          // 3c87cb186cc3d94c47d901318fb74252
          // deaab959582cef2051b908d4d6421e00

          // toka, toka 88de5ed206433c2acc88cf61d900ce52
          // mo f919e262650b21a4c7c52be575554f59

          // haha deaab959582cef2051b908d4d6421e00
          multipleMatch = {
            ...(multipleMatch ?? {}),
            [curr.english]: {
              japanese: spelling,
              particle: p,
              times: spelling.split(p).length,
            },
          };
        }
      });
    }

    return acc;
  }, []);

  return {
    phrases: wParticles,
    particles: particleList,
    errors: multipleMatch,
  };
}

const particleSlice = createSlice({
  name: "particleGame",
  initialState: particleInitState,
  reducers: {
    clearParticleGame(state) {
      state.particleGame.particles = particleInitState.particleGame.particles;
      state.particleGame.phrases = particleInitState.particleGame.phrases;
    },
    setParticlesARomaji(state) {
      state.setting.aRomaji = localStoreAttrUpdate(
        new Date(),
        { particle: state.setting },
        "/particle/",
        "aRomaji"
      );
    },

    toggleParticleFadeInAnswers(state, action: { payload?: boolean }) {
      const override = action.payload;

      state.setting.fadeInAnswers = localStoreAttrUpdate(
        new Date(),
        { particle: state.setting },
        "/particle/",
        "fadeInAnswers",
        override
      );
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getParticleGame.fulfilled, (state, action) => {
      const { game } = action.payload;

      if (game) {
        state.particleGame = game;
      }
    });

    builder.addCase(particleFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(
        particleInitState.setting,
        localStorageValue
      );

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });
  },
});

export const {
  clearParticleGame,
  setParticlesARomaji,
  toggleParticleFadeInAnswers,
} = particleSlice.actions;
export default particleSlice.reducer;
