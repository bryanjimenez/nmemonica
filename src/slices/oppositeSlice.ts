import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import md5 from "md5";
import type { SourceVocabulary } from "nmemonica";

import { getVocabulary } from "./vocabularySlice";
import { localStoreAttrUpdate } from "../helper/settingsStorageHelper";

export interface Opposite {
  english: string;
  japanese: string;
  romaji?: string;
}

export interface OppositeInitSlice {
  value: [Opposite, Opposite][];
  version: string;
  aRomaji: boolean;
  qRomaji: boolean;
  fadeInAnswers: boolean;
}
const oppositeInitState: OppositeInitSlice = {
  value: [],
  version: "",
  aRomaji: false,
  qRomaji: false,
  fadeInAnswers: false,
};

/**
 * Get app data versions file
 */
export const getOpposite = createAsyncThunk(
  "opposite/getOpposite",
  async (_arg, thunkAPI) => {
    // TODO: avoid fetch if vocabulary already in state
    const { value: vocabulary } = await thunkAPI
      .dispatch(getVocabulary())
      .unwrap();
    const { opposites, hash } = deriveOppositesFromVocabulary(vocabulary);
    return { value: opposites, version: hash };
  }
);

export function deriveOppositesFromVocabulary(
  data: Record<string, SourceVocabulary>
) {
  let opposites: [Opposite, Opposite][] = [];
  Object.keys(data).forEach((uid) => {
    const v = data[uid];
    if (Array.isArray(v.opposite)) {
      v.opposite.forEach((opp: string) => {
        const o: Opposite = data[opp];

        if (o) {
          const a = {
            english: v.english,
            japanese: v.japanese,
            romaji: v.romaji,
          };
          const b = {
            english: o.english,
            japanese: o.japanese,
            romaji: o.romaji,
          };

          opposites.push([a, b]);
        } else {
          console.error(`No uid?? uid:${uid} e:${v.english} Opposite:${opp}`);
        }
      });
    }
  });

  const hash = md5(JSON.stringify(opposites)).slice(0, 4);

  return { hash, opposites };
}

export const oppositeFromLocalStorage = createAsyncThunk(
  "opposite/oppositeFromLocalStorage",
  (arg: typeof oppositeInitState) => {
    const initValues = arg;

    return initValues;
  }
);

const oppositeSlice = createSlice({
  name: "opposite",
  initialState: oppositeInitState,

  reducers: {
    clearOpposites(state) {
      state.value = oppositeInitState.value;
      state.version = oppositeInitState.version;
    },
    setOppositesARomaji(state) {
      const path = "/opposite/";
      const attr = "aRomaji";
      const time = new Date();

      const partState = {
        opposite: state,
      };
      void localStoreAttrUpdate(time, partState, path, attr).then((aRomaji) => {
        state.aRomaji = aRomaji;
      });
    },

    setOppositesQRomaji(state) {
      const path = "/opposite/";
      const attr = "qRomaji";
      const time = new Date();

      const partState = {
        opposite: state,
      };
      void localStoreAttrUpdate(time, partState, path, attr, !state.qRomaji);
      state.qRomaji = !state.qRomaji;
    },

    toggleOppositeFadeInAnswers(state, action: { payload?: boolean }) {
      const override = action.payload ?? false;

      void localStoreAttrUpdate(
        new Date(),
        { opposite: state },
        "/opposite/",
        "fadeInAnswers",
        override
      ).then((fadeInAnswers) => {
        state.fadeInAnswers = fadeInAnswers;
      });
    },
  },

  extraReducers: (builder) => {
    builder.addCase(
      getOpposite.fulfilled,
      (
        state,
        action: {
          payload: {
            value: OppositeInitSlice["value"];
            version: OppositeInitSlice["version"];
          };
        }
      ) => {
        const { value, version } = action.payload;
        state.value = value;
        state.version = version;
      }
    );

    builder.addCase(oppositeFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      return {
        ...state,
        ...localStorageValue,
      };
    });
  },
});

export const {
  clearOpposites,
  setOppositesARomaji,
  setOppositesQRomaji,
  toggleOppositeFadeInAnswers,
} = oppositeSlice.actions;
export default oppositeSlice.reducer;
