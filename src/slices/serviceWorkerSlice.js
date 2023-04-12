import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
export const ADD_FREQUENCY_WORD = "add_frequency_word";
export const REMOVE_FREQUENCY_WORD = "remove_frequency_word";
export const ADD_FREQUENCY_PHRASE = "add_frequency_phrase";
export const REMOVE_FREQUENCY_PHRASE = "remove_frequency_phrase";
export const ADD_FREQUENCY_KANJI = "add_frequency_kanji";
export const REMOVE_FREQUENCY_KANJI = "remove_frequency_kanji";

export const SERVICE_WORKER_LOGGER_MSG = "service_worker_logger_msg";
export const SERVICE_WORKER_NEW_TERMS_ADDED = "service_worker_new_terms";

export const serviceWorkerRegistered = createAsyncThunk(
  "serviceWorker/serviceWorkerRegistered",
  async () => {
    if ("serviceWorker" in navigator) {
      return navigator.serviceWorker.register("sw.js").then((info)=>info.active?.state);
    } else {
      return Promise.reject("No Service Worker");
    }
  }
);

const initialState = {
  registered: false,
};

const serviceWorkerSlice = createSlice({
  name: "serviceWorker",
  initialState,

  reducers: {
    serviceWorkerNewTermsAdded(state, action) {
      // const getState = () => ({ settings: state });
      const { newestWords } = action.payload;
      for (let termType in newestWords) {
        const { freq: uidArr, dic: termObj } = newestWords[termType];

        // if (termType === "vocabulary")
        let actType = ADD_FREQUENCY_WORD;
        let type = "GET_VOCABULARY";

        if (termType === "phrases") {
          actType = ADD_FREQUENCY_PHRASE;
          type = "GET_PHRASES";
        }

        console.warn("serviceWorkerNewTermsAdded Disabled");
        console.warn(uidArr.length + " new " + termType);
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
  },
});

export const { serviceWorkerNewTermsAdded } = serviceWorkerSlice.actions;
export default serviceWorkerSlice.reducer;
