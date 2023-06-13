import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { firebaseConfig } from "../../environment.development";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import type { RootState } from ".";
import type { RawOpposite } from "../components/Games/OppositesGame";

export interface OppositeInitSlice {
  value: [RawOpposite, RawOpposite][];
  version: string;
  aRomaji: boolean;
  qRomaji: boolean;
}
const oppositeInitState: OppositeInitSlice = {
  value: [],
  version: "",
  aRomaji: false,
  qRomaji: false,
};

/**
 * Get app data versions file
 */
export const getOpposite = createAsyncThunk(
  "opposite/getOpposite",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const version = state.version.phrases ?? "0";

    // if (version === "0") {
    //   console.error("fetching opposite: 0");
    // }
    return fetch(firebaseConfig.databaseURL + "/lambda/opposites.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json().then((value) => ({ value, version })));
  }
);

export const oppositeFromLocalStorage = createAsyncThunk(
  "opposite/oppositeFromLocalStorage",
  async (arg: typeof oppositeInitState) => {
    const initValues = arg;

    return initValues;
  }
);

const oppositeSlice = createSlice({
  name: "opposite",
  initialState: oppositeInitState,

  reducers: {
    setOppositesARomaji(state) {
      const path = "/opposite/";
      const attr = "aRomaji";
      const time = new Date();

      const partState = {
        opposite: state,
      };
      state.aRomaji = localStoreAttrUpdate(time, partState, path, attr);
    },

    setOppositesQRomaji(state) {
      const path = "/opposite/";
      const attr = "qRomaji";
      const time = new Date();

      const partState = {
        opposite: state,
      };
      localStoreAttrUpdate(time, partState, path, attr, !state.qRomaji);
      state.qRomaji = !state.qRomaji;
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
