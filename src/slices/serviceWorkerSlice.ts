import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// import {
//   ADD_FREQUENCY_PHRASE,
//   ADD_FREQUENCY_WORD,
// } from "../constants/actionNames";

const serviceWorkerInitState = {
  registered: false,
};

export const serviceWorkerRegistered = createAsyncThunk(
  "serviceWorker/serviceWorkerRegistered",
  async () => {
    if ("serviceWorker" in navigator) {
      return navigator.serviceWorker
        .register("sw.js")
        .then((info) => info.active?.state);
    } else {
      throw new Error("No Service Worker Available");
    }
  }
);

const serviceWorkerSlice = createSlice({
  name: "serviceWorker",
  initialState: serviceWorkerInitState,

  reducers: {
    serviceWorkerNewTermsAdded(
      state,
      action: {
        payload: {
          newestWords: Record<string, { freq: string[]; dic: unknown }>;
        };
      }
    ) {
      // const getState = () => ({ settings: state });
      const { newestWords } = action.payload;
      for (let termType in newestWords) {
        const { freq: uidArr /*, dic: termObj*/ } = newestWords[termType];

        // if (termType === "vocabulary")
        // let actType = ADD_FREQUENCY_WORD;
        // let type = "GET_VOCABULARY";

        // if (termType === "phrases") {
        // actType = ADD_FREQUENCY_PHRASE;
        // type = "GET_PHRASES";
        // }

        console.warn("serviceWorkerNewTermsAdded Disabled");
        console.warn(`${uidArr.length} new ${termType}`);
        // addFrequencyTerm(actType, uidArr)(getState).then(()=>{
        //trigger getVocab or getPhrases
        // })
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(serviceWorkerRegistered.fulfilled, (state) => {
      state.registered = true;
    });
    builder.addCase(serviceWorkerRegistered.rejected, (state, action) => {
      state.registered = false;
      throw action.error
    });
  },
});

export const { serviceWorkerNewTermsAdded } = serviceWorkerSlice.actions;
export default serviceWorkerSlice.reducer;
