import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { dataServiceEndpoint } from "../../environment.development";

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
  async (overrideUrl: string | undefined) =>
    fetch((overrideUrl ?? dataServiceEndpoint) + "/cache.json").then((res) =>
      res.json()
    )
);

const versionSlice = createSlice({
  name: "version",
  initialState,
  reducers: {},

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

export default versionSlice.reducer;
