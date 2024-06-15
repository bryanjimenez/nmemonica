import { createSlice } from "@reduxjs/toolkit";

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
});

export const { clearVersions, setVersion } = versionSlice.actions;
export default versionSlice.reducer;
