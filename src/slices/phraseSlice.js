import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { firebaseConfig } from "../../environment.development";
import { buildGroupObject } from "../helper/reducerHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import {
  TermFilterBy,
  TermSortBy,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";

/**
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 */

/** @param {{[uid:string]: RawPhrase}} object */
export const buildPhraseArray = (object) =>
  Object.keys(object).map((k) => ({
    ...object[k],
    uid: k,
  }));

/**
 * Fetch phrases
 */
export const getPhrase = createAsyncThunk(
  "phrase/getPhrase",
  async (arg, thunkAPI) => {
    const state = /** @type {RootState} */ (
      /** @type {RootState} */ (thunkAPI.getState())
    );
    const version = state.version.phrases || "0";

    if (version === "0") {
      console.error("fetching phrase: 0");
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/phrases.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

export const phraseFromLocalStorage = createAsyncThunk(
  "phrase/phraseFromLocalStorage",
  /** @param {typeof initialState['setting']} arg */
  async (arg) => {
    const initValues = arg;

    return initValues;
  }
);

export const updateSpaceRepPhrase = createAsyncThunk(
  "phrase/updateSpaceRepPhrase",
  /** @param {{uid: string, shouldIncrement: boolean}} arg */
  async (arg, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = /** @type {RootState} */ (thunkAPI.getState()).phrases;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(uid, spaceRep, shouldIncrement);
  }
);

export const initialState = {
  value: /** @type {RawPhrase[]} */ ([]),
  grpObj: {},

  setting: {
    ordered: /** @satisfies {TermSortBy[keyof TermSortBy]} */ 0,
    practiceSide: false,
    romaji: false,
    reinforce: false,
    repetition: /** @type {import("../typings/raw").SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: /** @type {string[]} */ ([]),
    filter: /** @satisfies {TermFilterBy[keyof TermFilterBy]} */ 0,
  },
};

const phraseSlice = createSlice({
  name: "phrase",
  initialState,
  reducers: {
    togglePhrasesFilter(state, action) {
      /**
       * Toggle between group, frequency, and tags filtering
       * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
       */
      const override = action.payload;

      const allowed = /** @type {number[]} */ ([
        TermFilterBy.FREQUENCY,
        TermFilterBy.GROUP,
      ]);

      const { filter, reinforce } = state.setting;

      const newFilter = toggleAFilter(filter + 1, allowed, override);

      state.setting.filter = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "filter",
        newFilter
      );

      if (newFilter !== TermFilterBy.GROUP && reinforce) {
        state.setting.reinforce = false;
      }
    },
    togglePhraseActiveGrp(state, action) {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue = grpParse(groups, activeGroup);

      state.setting.activeGroup = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "activeGroup",
        newValue
      );
    },
    togglePhrasesReinforcement(state) {
      state.setting.reinforce = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "reinforce"
      );
    },

    addFrequencyPhrase(state, action) {
      const uid = action.payload;
      const { value: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        false,
        {
          set: { rein: true },
        }
      );

      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "repetition",
        newValue
      );

      let frequency = { uid, count: state.setting.frequency.count + 1 };
      state.setting.frequency = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "frequency",
        frequency
      );
    },

    removeFrequencyPhrase(state, action) {
      const uid = action.payload;

      const spaceRep = state.setting.repetition;
      if (spaceRep[uid]?.rein === true) {
        // null to delete
        const { value: newValue } = updateSpaceRepTerm(uid, spaceRep, false, {
          set: { rein: null },
        });

        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { phrases: state.setting },
          "/phrases/",
          "repetition",
          newValue
        );

        let frequency = { uid, count: state.setting.frequency.count - 1 };
        state.setting.frequency = localStoreAttrUpdate(
          new Date(),
          { phrases: state.setting },
          "/phrases/",
          "frequency",
          frequency
        );
      }
    },

    flipPhrasesPracticeSide(state) {
      state.setting.practiceSide = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "practiceSide"
      );
    },

    togglePhrasesRomaji(state) {
      state.setting.romaji = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "romaji"
      );
    },

    togglePhrasesOrdering(state) {
      const allowed = /** @type {number[]} */ ([
        TermSortBy.RANDOM,
        TermSortBy.VIEW_DATE,
      ]);

      const { ordered } = state.setting;

      let newOrdered = toggleAFilter(ordered + 1, allowed);

      state.setting.ordered = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "ordered",
        newOrdered
      );
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getPhrase.fulfilled, (state, action) => {
      state.grpObj = buildGroupObject(action.payload);
      state.value = buildPhraseArray(action.payload);
    });

    builder.addCase(phraseFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(initialState.setting, localStorageValue);

      const phraseReinforceList = Object.keys(mergedSettings.repetition).filter(
        (k) => mergedSettings.repetition[k]?.rein === true
      );
      mergedSettings.frequency = {
        uid: undefined,
        count: phraseReinforceList.length,
      };

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });
    builder.addCase(updateSpaceRepPhrase.fulfilled, (state, action) => {
      const { value: newValue } = action.payload;

      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "repetition",
        newValue
      );
    });
  },
});

export const {
  flipPhrasesPracticeSide,
  togglePhrasesRomaji,
  togglePhrasesFilter,
  togglePhraseActiveGrp,
  togglePhrasesReinforcement,
  addFrequencyPhrase,
  removeFrequencyPhrase,
  togglePhrasesOrdering,
} = phraseSlice.actions;
export default phraseSlice.reducer;
