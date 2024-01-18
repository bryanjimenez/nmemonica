import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";

import {
  TermFilterBy,
  TermSortBy,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { firebaseConfig } from "../../environment.development";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import { buildGroupObject } from "../helper/reducerHelper";
import type {
  GroupListMap,
  MetaDataObj,
  RawPhrase,
  ValuesOf,
} from "../typings/raw";

import type { RootState } from ".";

export interface PhraseInitSlice {
  value: RawPhrase[];
  version: string;
  grpObj: GroupListMap;

  setting: {
    ordered: ValuesOf<typeof TermSortBy>;
    englishSideUp: boolean;
    romaji: boolean;
    reinforce: boolean;
    repTID: number;
    repetition: Record<string, MetaDataObj | undefined>;
    frequency: { uid?: string; count: number };
    activeGroup: string[];
    filter: ValuesOf<typeof TermFilterBy>;
  };
}

export const phraseInitState: PhraseInitSlice = {
  value: [],
  version: "",
  grpObj: {},

  setting: {
    ordered: 0,
    englishSideUp: false,
    romaji: false,
    reinforce: false,
    repTID: -1,
    repetition: {},
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    filter: 0,
  },
};

export const buildPhraseArray = (object: Record<string, RawPhrase>) =>
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
    const state = thunkAPI.getState() as RootState;
    // TODO: rename state.phrases -> state.phrase
    const version = state.version.phrases ?? "0";

    // if (version === "0") {
    //   console.error("fetching phrase: 0");
    // }
    const value = (await fetch(
      firebaseConfig.databaseURL + "/lambda/phrases.json",
      {
        headers: { "Data-Version": version },
      }
    ).then((res) => res.json())) as Record<string, RawPhrase>;

    return { value, version };
  }
);

export const phraseFromLocalStorage = createAsyncThunk(
  "phrase/phraseFromLocalStorage",
  (arg: typeof phraseInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

export const updateSpaceRepPhrase = createAsyncThunk(
  "phrase/updateSpaceRepPhrase",
  (arg: { uid: string; shouldIncrement: boolean }, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = (thunkAPI.getState() as RootState).phrases;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(uid, spaceRep, {
      count: shouldIncrement,
      date: true,
    });
  }
);

const phraseSlice = createSlice({
  name: "phrase",
  initialState: phraseInitState,
  reducers: {
    /**
     * Toggle between group, frequency, and tags filtering
     */
    togglePhrasesFilter(
      state,
      action: { payload?: ValuesOf<typeof TermFilterBy> }
    ) {
      const override = action.payload;

      const allowed = [TermFilterBy.FREQUENCY, TermFilterBy.GROUP];

      const { filter, reinforce } = state.setting;

      const newFilter = toggleAFilter(
        filter + 1,
        allowed,
        override
      ) as ValuesOf<typeof TermFilterBy>;

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

    togglePhraseActiveGrp(state, action: { payload: string }) {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue: string[] = grpParse(groups, activeGroup);

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

    addFrequencyPhrase(state, action: PayloadAction<string>) {
      const uid = action.payload;
      const { record: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        { count: false, date: false },
        {
          set: { rein: true },
        }
      );

      state.setting.repTID = Date.now();
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

    removeFrequencyPhrase(state, action: { payload: string }) {
      const uid = action.payload;

      const spaceRep = state.setting.repetition;
      if (spaceRep[uid]?.rein === true) {
        // null to delete
        const { record: newValue } = updateSpaceRepTerm(
          uid,
          spaceRep,
          { count: false, date: false },
          {
            set: { rein: null },
          }
        );

        state.setting.repTID = Date.now();
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
      state.setting.englishSideUp = localStoreAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "englishSideUp"
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
      const allowed = [TermSortBy.RANDOM, TermSortBy.VIEW_DATE];

      const { ordered } = state.setting;

      let newOrdered = toggleAFilter(ordered + 1, allowed) as ValuesOf<
        typeof TermSortBy
      >;

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
      const { value, version } = action.payload;
      state.grpObj = buildGroupObject(value);
      state.value = buildPhraseArray(value);
      state.version = version;
    });

    builder.addCase(phraseFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(phraseInitState.setting, localStorageValue);

      const phraseReinforceList = Object.keys(mergedSettings.repetition).filter(
        (k) => mergedSettings.repetition[k]?.rein === true
      );
      mergedSettings.frequency = {
        uid: undefined,
        count: phraseReinforceList.length,
      };

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });
    builder.addCase(updateSpaceRepPhrase.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.setting.repTID = Date.now();
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
