import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { dataServiceEndpoint } from "../../environment.development";
import { swMessageSaveDataJSON } from "../helper/serviceWorkerHelper";

import { RootState } from ".";

export interface VersionInitSlice {
  vocabulary?: string;
  phrases?: string;
  kanji?: string;
  particles?: string;
  suffixes?: string;
}

const initialState: VersionInitSlice = {
  vocabulary: undefined,
  phrases: undefined,
  kanji: undefined,
  particles: undefined,
  suffixes: undefined,
};

/**
 * Get app data versions file
 */
export const getVersions = createAsyncThunk(
  "version/getVersions",
  async (_arg, _thunkAPI) => {
    return fetch(dataServiceEndpoint + "/cache.json", {
      credentials: "include",
    }).then((res) => res.json());
  }
);

/**
 * Update sw versions
 */
export const setSwVersions = createAsyncThunk(
  "version/setSwVersions",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const stateVersions = { ...state.version };

    const url = dataServiceEndpoint + "/cache.json";
    const hash = ""; // no hash since updating cache.json

    return swMessageSaveDataJSON(url, stateVersions, hash);
  }
);

const versionSlice = createSlice({
  name: "version",
  initialState,
  reducers: {
    clearVersions(state) {
      state.vocabulary = undefined;
      state.phrases = undefined;
      state.kanji = undefined;
      state.particles = undefined;
      state.suffixes = undefined;
    },
    setVersion(
      state,
      action: { payload: { name: keyof VersionInitSlice; hash: string } }
    ) {
      const { name, hash } = action.payload;

      state[name] = hash;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(
      getVersions.fulfilled,
      (state, action: { payload: VersionInitSlice }) => {
        const { vocabulary, kanji, phrases, particles, suffixes } =
          action.payload;
        state.kanji = kanji;
        state.vocabulary = vocabulary;
        state.phrases = phrases;
        state.particles = particles;
        state.suffixes = suffixes;
      }
    );
  },
});

export const { clearVersions, setVersion } = versionSlice.actions;
export default versionSlice.reducer;
