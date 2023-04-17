import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { firebaseConfig } from "../../environment.development";
import { buildTagObject } from "../helper/reducerHelper";
import { TermFilterBy, grpParse, updateSpaceRepTerm } from "./settingHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";

/**
 * @typedef {import("../typings/raw").RawKanji} RawKanji
 */

/**
 * Fetch vocabulary
 */
export const getKanji = createAsyncThunk(
  "kanji/getKanji",
  async (arg, thunkAPI) => {
    const state = /** @type {RootState} */ (thunkAPI.getState());
    const version = state.version.kanji || "0";

    if (version === "0") {
      console.error("fetching kanji: 0");
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/kanji.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json());
  }
);

export const kanjiFromLocalStorage = createAsyncThunk(
  "kanji/kanjiFromLocalStorage",
  /** @param {typeof initialState['setting']} arg */
  async (arg) => {
    const initValues = arg;

    return initValues;
  }
);

export const initialState = {
  value: /** @type {RawKanji[]} */ ([]),
  tagObj: /** @type {string[]} */ ([]),

  setting: {
    choiceN: 32,
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (2),
    reinforce: false,
    repetition: /** @type {SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    activeTags: [],
  },
};

const kanjiSlice = createSlice({
  name: "kanji",
  initialState,
  reducers: {
    toggleKanjiActiveTag(state, action) {
      const tagName = action.payload;

      const { activeTags } = state.setting;

      let newValue;
      if (activeTags.includes(tagName)) {
        newValue = activeTags.filter((a) => a !== tagName);
      } else {
        newValue = [...activeTags, tagName];
      }

      state.setting.activeTags = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "activeTags",
        newValue
      );
    },
    toggleKanjiActiveGrp: (state, action) => {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue = grpParse(groups, activeGroup);

      state.setting.activeGroup = localStoreAttrUpdate(
        new Date(),
        { kaji: state.setting },
        "/kanji/",
        "activeGroup",
        newValue
      );
    },

    addFrequencyKanji(state, action) {
      const uid = action.payload;

      const { value: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        false,
        {
          set: { rein: true },
        }
      );

      localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );
      state.setting.repetition = newValue;

      let frequency = { uid, count: state.setting.frequency.count + 1 };
      localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "frequency",
        frequency
      );
      state.setting.frequency = frequency;
    },
    removeFrequencyKanji(state, action) {
      const uid = action.payload;

      const spaceRep = state.setting.repetition;

      if (spaceRep[uid]?.rein === true) {
        // null to delete
        const { value: newValue } = updateSpaceRepTerm(uid, spaceRep, false, {
          set: { rein: null },
        });

        localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );

        if (newValue) {
          state.setting.repetition = newValue;
        }

        let frequency = { uid, count: state.setting.frequency.count - 1 };
        localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "frequency",
          frequency
        );
        state.setting.frequency = frequency;
      }
    },
    setKanjiBtnN(state, action) {
      const number = action.payload;

      state.setting.choiceN = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "choiceN",
        number
      );
    },

    toggleKanjiFilter(state, action) {
      const override = action.payload;
      const { filter, reinforce } = state.setting;

      let newFilter;
      if (override !== undefined) {
        newFilter = override;
      } else {
        newFilter = Object.values(TermFilterBy).includes(filter + 1)
          ? filter + 1
          : /*skip TermFilterBy.GROUP*/ TermFilterBy.FREQUENCY;
      }

      state.setting.filter = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "filter",
        newFilter
      );

      if (newFilter !== 0 && reinforce) {
        state.setting.reinforce = false;
      }
    },

    toggleKanjiReinforcement(state) {
      state.setting.reinforce = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "reinforce"
      );
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getKanji.fulfilled, (state, action) => {
      const value = Object.keys(action.payload).map((k) => ({
        ...action.payload[k],
        uid: k,
        tag: action.payload[k].tag === undefined ? [] : action.payload[k].tag,
      }));

      state.tagObj = buildTagObject(action.payload);
      state.value = value;
    });

    builder.addCase(kanjiFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(initialState.setting, localStorageValue);

      const kanjiReinforceList = Object.keys(mergedSettings.repetition).filter(
        (k) => mergedSettings.repetition[k]?.rein === true
      );
      mergedSettings.frequency = {
        uid: undefined,
        count: kanjiReinforceList.length,
      };

      return {
        ...state,
        setting: { ...mergedSettings },
      };
    });
  },
});

export const {
  toggleKanjiActiveTag,
  toggleKanjiActiveGrp,
  addFrequencyKanji,
  removeFrequencyKanji,
  setKanjiBtnN,
  toggleKanjiFilter,
  toggleKanjiReinforcement,
} = kanjiSlice.actions;

export default kanjiSlice.reducer;
