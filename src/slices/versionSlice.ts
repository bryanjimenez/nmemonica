import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { dataServicePath } from "../../environment.development";
import { rewriteUrl } from "../hooks/useRewriteUrl";

import { RootState } from ".";

export interface VersionInitSlice {
  vocabulary?: string;
  phrases?: string;
  kanji?: string;
  opposites?: string;
  particles?: string;
  suffixes?: string;
}

const initialState: VersionInitSlice = {
  vocabulary: undefined,
  phrases: undefined,
  kanji: undefined,
  opposites: undefined,
  particles: undefined,
  suffixes: undefined,
};

/**
 * Get app data versions file
 */
export const getVersions = createAsyncThunk(
  "version/getVersions",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;

    const baseUrl = rewriteUrl(state.global.localServiceURL, dataServicePath);

    return fetch(baseUrl + "/cache.json").then((res) => res.json());
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
      state.opposites = undefined;
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
        const { vocabulary, kanji, phrases, opposites, particles, suffixes } =
          action.payload;
        state.kanji = kanji;
        state.vocabulary = vocabulary;
        state.phrases = phrases;
        state.opposites = opposites;
        state.particles = particles;
        state.suffixes = suffixes;
      }
    );
  },
});

export const { clearVersions, setVersion } = versionSlice.actions;
export default versionSlice.reducer;
