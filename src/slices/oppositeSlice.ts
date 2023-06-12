import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";

/**
 * Get app data versions file
 */
export const getOpposite = createAsyncThunk(
  "opposite/getOpposite",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const version = state.version.phrases || "0";

    if (version === "0") {
      console.error("fetching opposite: 0");
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/opposites.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json().then((value) => ({ value, version })));
  }
);

export const oppositeFromLocalStorage = createAsyncThunk(
  "opposite/oppositeFromLocalStorage",
  async (arg:typeof initialState) => {
    const initValues = arg;

    return initValues;
  }
);

const initialState = {
  value: [],
  version: "",
  aRomaji: false,
  qRomaji: false,
};

const oppositeSlice = createSlice({
  name: "opposite",
  initialState,

  reducers: {
    setOppositesARomaji(state) {
      const path = "/opposite/";
      const attr = "aRomaji";
      const time = new Date();

      const partState:Partial<SettingState> ={
        opposite: state,
    }
      state.aRomaji = localStoreAttrUpdate(time, partState, path, attr);
    },

    setOppositesQRomaji(state) {
      const path = "/opposite/";
      const attr = "qRomaji";
      const time = new Date();

      const partState:Partial<SettingState> ={
        opposite: state,
    }
      localStoreAttrUpdate(time, partState, path, attr, !state.qRomaji);
      state.qRomaji = !state.qRomaji;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getOpposite.fulfilled, (state, action) => {
      const { value, version } = action.payload;
      state.value = value;
      state.version = version;
    });

    builder.addCase(oppositeFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      return {
        ...state,
        ...localStorageValue,
      };
    });
  },
});

export const { setOppositesARomaji, setOppositesQRomaji } =
  oppositeSlice.actions;
export default oppositeSlice.reducer;
