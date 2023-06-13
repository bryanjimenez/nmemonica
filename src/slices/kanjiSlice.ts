import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { firebaseConfig } from "../../environment.development";
import { buildTagObject } from "../helper/reducerHelper";
import {
  TermFilterBy,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import type { RawKanji, SpaceRepetitionMap } from "../typings/raw";
import type { RootState } from ".";

export interface KanjiInitSlice {
  value: RawKanji[];
  version: string;
  tagObj: string[];

  setting: {
    choiceN: number;
    filter: (typeof TermFilterBy)[keyof typeof TermFilterBy];
    reinforce: boolean;
    repTID: number;
    repetition: SpaceRepetitionMap;
    activeGroup: string[];
    activeTags: string[];
  };
}

export const kanjiInitState: KanjiInitSlice = {
  value: [],
  version: "",
  tagObj: [],

  setting: {
    choiceN: 32,
    filter: 2,
    reinforce: false,
    repTID: -1,
    repetition: {},
    activeGroup: [],
    activeTags: [],
  },
};

/**
 * Fetch vocabulary
 */
export const getKanji = createAsyncThunk(
  "kanji/getKanji",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const version = state.version.kanji ?? "0";

    // if (version === "0") {
    //   console.error("fetching kanji: 0");
    // }
    return fetch(firebaseConfig.databaseURL + "/lambda/kanji.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json().then((value) => ({ value, version })));
  }
);

export const kanjiFromLocalStorage = createAsyncThunk(
  "kanji/kanjiFromLocalStorage",
  async (arg: typeof kanjiInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

const kanjiSlice = createSlice({
  name: "kanji",
  initialState: kanjiInitState,
  reducers: {
    toggleKanjiActiveTag(state, action: { payload: string }) {
      const tagName: string = action.payload;

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
    toggleKanjiActiveGrp: (state, action: { payload: string }) => {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue = grpParse(groups, activeGroup);

      state.setting.activeGroup = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "activeGroup",
        newValue
      );
    },

    addFrequencyKanji(state, action: { payload: string }) {
      const uid = action.payload;

      const { value: newValue } = updateSpaceRepTerm(
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
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );
    },

    removeFrequencyKanji(state, action: { payload: string }) {
      const uid = action.payload;

      const spaceRep = state.setting.repetition;

      if (spaceRep[uid]?.rein === true) {
        // null to delete
        const { value: newValue } = updateSpaceRepTerm(
          uid,
          spaceRep,
          { count: false, date: false },
          {
            set: { rein: null },
          }
        );

        localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );

        if (newValue) {
          state.setting.repTID = Date.now();
          state.setting.repetition = newValue;
        }
      }
    },
    setKanjiBtnN(state, action: { payload: number }) {
      const number = action.payload;

      state.setting.choiceN = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "choiceN",
        number
      );
    },

    toggleKanjiFilter(state, action: { payload?: number }) {
      const override = action.payload;
      const { filter, reinforce } = state.setting;

      const newFilter = toggleAFilter(
        filter + 1,
        [TermFilterBy.FREQUENCY, TermFilterBy.TAGS],
        override
      ) as (typeof TermFilterBy)[keyof typeof TermFilterBy];

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
    builder.addCase(
      getKanji.fulfilled,
      (
        state,
        action: {
          payload: {
            value: Record<string, RawKanji>;
            version: KanjiInitSlice["version"];
          };
        }
      ) => {
        const { value: v, version } = action.payload;
        const value = Object.keys(v).map((k) => ({
          ...v[k],
          uid: k,
          tag: v[k].tag === undefined ? [] : v[k].tag,
        }));

        state.tagObj = buildTagObject(v);
        state.value = value;
        state.version = version;
      }
    );

    builder.addCase(kanjiFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(kanjiInitState.setting, localStorageValue);

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
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
