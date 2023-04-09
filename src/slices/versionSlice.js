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
  initialState: {},

  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(getVersions.fulfilled, (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    });
  },
});

export default versionSlice.reducer;
