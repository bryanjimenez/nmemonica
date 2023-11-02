import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { firebaseConfig } from "../../environment.development";

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
export const getVersions = createAsyncThunk("version/getVersions", async () =>
  fetch(firebaseConfig.databaseURL + "/lambda/cache.json").then((res) =>
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
        state = action.payload;
      }
    );
  },
});

export default versionSlice.reducer;
