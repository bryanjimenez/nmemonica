import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import { localStoreAttrUpdate } from "./localStorageHelper";

/**
 * Get app data versions file
 */
export const getOpposite = createAsyncThunk(
  "opposite/getOpposite",
  async (v, thunkAPI) => {
    const state = thunkAPI.getState();
    const version = state.version.phrases || 0;

    if(version===0){
      console.error('fetching opposite: 0')
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/opposites.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

const oppositeSlice = createSlice({
  name: "opposite",
  initialState: { value: [], aRomaji: false, qRomaji: false },

  reducers: {
    setOppositesARomaji(state) {
      const getState = () => ({ settings: state });
      const path = "/opposite/";
      const attr = "aRomaji";
      const time = new Date();
      localStoreAttrUpdate(time, getState, path, attr, !state.aRomaji);
      state.aRomaji = !state.aRomaji;
    },

    setOppositesQRomaji(state) {
      const getState = () => ({ settings: state });
      const path = "/opposite/";
      const attr = "qRomaji";
      const time = new Date();
      localStoreAttrUpdate(time, getState, path, attr, !state.qRomaji);
      state.qRomaji = !state.qRomaji;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getOpposite.fulfilled, (state, action) => {
      state.value = action.payload;
    });
  },
});

export const { setOppositesARomaji, setOppositesQRomaji } =
  oppositeSlice.actions;
export default oppositeSlice.reducer;
