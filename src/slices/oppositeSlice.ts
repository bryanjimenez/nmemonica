import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import md5 from "md5";
import type { SourceVocabulary } from "nmemonica";

import { getVocabulary } from "./vocabularySlice";
import { userSettingAttrUpdate } from "../helper/userSettingsHelper";

export interface Opposite {
  english: string;
  japanese: string;
}

export interface OppositeInitSlice {
  value: [Opposite, Opposite][];
  version: string;
  fadeInAnswers: boolean;
}
const oppositeInitState: OppositeInitSlice = {
  value: [],
  version: "",
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
        const o: Opposite | undefined = data[opp];

        if (o !== undefined) {
          const a = {
            english: v.english,
            japanese: v.japanese,
          };
          const b = {
            english: o.english,
            japanese: o.japanese,
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

export const oppositeSettingsFromAppStorage = createAsyncThunk(
  "opposite/oppositeSettingsFromAppStorage",
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

    toggleOppositeFadeInAnswers(state, action: { payload?: boolean }) {
      const override = action.payload ?? false;

      void userSettingAttrUpdate(
        new Date(),
        { opposite: state },
        "/opposite/",
        "fadeInAnswers",
        override
      );

      state.fadeInAnswers = override;
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

    builder.addCase(
      oppositeSettingsFromAppStorage.fulfilled,
      (state, action) => {
        const storedValue = action.payload;
        return {
          ...state,
          ...storedValue,
        };
      }
    );
  },
});

export const { clearOpposites, toggleOppositeFadeInAnswers } =
  oppositeSlice.actions;
export default oppositeSlice.reducer;
