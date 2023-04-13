import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";

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
  initialState: {
    vocabulary: undefined,
    phrases: undefined,
    kanji: undefined,
    opposites: undefined,
    particles: undefined,
    suffixes: undefined,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(
      getVersions.fulfilled,
      (state, action) => (state = action.payload)
    );
  },
});

export default versionSlice.reducer;
