import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import { buildPhraseArray, getPhrase } from "./phraseSlice";
import type {
  ParticleChoice,
  ParticleGamePhrase,
} from "../components/Games/ParticlesGame";
import { JapaneseText } from "../helper/JapaneseText";
import { romajiParticle } from "../helper/kanaHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import type { RawPhrase } from "../typings/raw";

import type { RootState } from ".";

export interface ParticleInitSlice {
  particleGame: {
    phrases: ParticleGamePhrase[];
    particles: ParticleChoice[];
  };

  setting: {
    aRomaji: boolean;
    fadeInAnswers: boolean;
  };
}

export const ParticleInitState: ParticleInitSlice = {
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
      let game = undefined;
      if (needGame) {
        game = buildParticleGame(phrases);
      }
      return { game };
    } else {
      return thunkAPI.dispatch(getPhrase()).then((res) => {
        interface FetchObj {
          value: Record<string, RawPhrase>;
          version: string;
        }
        const rawObject = res.payload as FetchObj;
        const phraseObject = rawObject.value;
        const phraseArray = buildPhraseArray(phraseObject);
        return { phrase: phraseArray, game: buildParticleGame(phraseArray) };
      });
    }
  }
);

export const particleFromLocalStorage = createAsyncThunk(
  "particleGame/particleFromLocalStorage",
  async (arg: typeof ParticleInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

/**
 * Filters RawPhrase to be used by PhrasesGame
 */
export function buildParticleGame(rawPhrases: RawPhrase[]) {
  let particleList: ParticleChoice[] = [];
  let multipleMatch: Record<
    string,
    { japanese: string; particle: string; times: number }
  > = {};

  const wParticles = rawPhrases.reduce<ParticleGamePhrase[]>((acc, curr) => {
    if (curr.particles && curr.particles?.length > 0) {
      const phrase = JapaneseText.parse(curr);
      const spelling = phrase.getSpelling();

      curr.particles.forEach((p) => {
        if (spelling.split(p).length === 2) {
          const romaji = romajiParticle(p);
          const start = spelling.indexOf(p);
          const end = start + p.length;
          const particle = { japanese: p, romaji, html: p };
          const particleCopy = {
            japanese: p,
            romaji,
            start,
            end,
            html: p,
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
            ...multipleMatch,
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
  console.error(`More than one match ${Object.keys(multipleMatch).length}`);
  console.table(multipleMatch);

  return { phrases: wParticles, particles: particleList };
}

const particleSlice = createSlice({
  name: "particleGame",
  initialState: ParticleInitState,
  reducers: {
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
        ParticleInitState.setting,
        localStorageValue
      );

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });
  },
});

export const { setParticlesARomaji, toggleParticleFadeInAnswers } =
  particleSlice.actions;
export default particleSlice.reducer;
