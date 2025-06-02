import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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

  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(serviceWorkerRegistered.fulfilled, (state) => {
      state.registered = true;
    });
    builder.addCase(serviceWorkerRegistered.rejected, (state, action) => {
      state.registered = false;
      throw action.error;
    });
  },
});

export const {} = serviceWorkerSlice.actions;
export default serviceWorkerSlice.reducer;
