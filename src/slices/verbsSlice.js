import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  verbForm: "dictionary",
};

const verbSlice = createSlice({
  name: "verbs",
  initialState,
  reducers: {
    verbFormChanged(state, action) {
      return {
        ...state,
        verbForm: action.payload,
      };
    },
  },
});

export const { verbFormChanged } = verbSlice.actions;
export default verbSlice.reducer;
