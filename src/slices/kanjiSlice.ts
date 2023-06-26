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
import { MEMORIZED_THRLD } from "../helper/gameHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import { buildTagObject } from "../helper/reducerHelper";
import type { RawKanji, SpaceRepetitionMap } from "../typings/raw";

import type { RootState } from ".";

export interface KanjiInitSlice {
  value: RawKanji[];
  version: string;
  tagObj: string[];

  setting: {
    filter: (typeof TermFilterBy)[keyof typeof TermFilterBy];
    ordered: (typeof TermSortBy)[keyof typeof TermSortBy];
    reinforce: boolean;
    memoThreshold: number;
    repTID: number;
    repetition: SpaceRepetitionMap;
    activeGroup: string[];
    activeTags: string[];

    // Game
    choiceN: number;
    fadeInAnswers: boolean;
  };
}

export const kanjiInitState: KanjiInitSlice = {
  value: [],
  version: "",
  tagObj: [],

  setting: {
    filter: 2,
    ordered: 0,
    reinforce: false,
    memoThreshold: MEMORIZED_THRLD,
    repTID: -1,
    repetition: {},
    activeGroup: [],
    activeTags: [],

    // Game
    choiceN: 32,
    fadeInAnswers: false,
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
    const value = (await fetch(
      firebaseConfig.databaseURL + "/lambda/kanji.json",
      {
        headers: { "Data-Version": version },
      }
    ).then((res) => res.json())) as Record<string, RawKanji>;

    return { value, version };
  }
);

export const kanjiFromLocalStorage = createAsyncThunk(
  "kanji/kanjiFromLocalStorage",
  (arg: typeof kanjiInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

export const updateSpaceRepKanji = createAsyncThunk(
  "kanji/updateSpaceRepKanji",
  (arg: { uid: string; shouldIncrement?: boolean }, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = (thunkAPI.getState() as RootState).kanji;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(uid, spaceRep, {
      count: shouldIncrement,
      date: true,
    });
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

    toggleKanjiOrdering(
      state,
      action: { payload: (typeof TermSortBy)[keyof typeof TermSortBy] }
    ) {
      const { ordered } = state.setting;
      const override = action.payload;

      const allowed = [
        // TermSortBy.ALPHABETIC,
        TermSortBy.DIFFICULTY,
        // TermSortBy.GAME,
        TermSortBy.RANDOM,
        TermSortBy.VIEW_DATE,
      ];
      const newOrdered = toggleAFilter(
        ordered + 1,
        allowed,
        override
      ) as (typeof TermSortBy)[keyof typeof TermSortBy];

      state.setting.ordered = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "ordered",
        newOrdered
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

    /**
     * Filter Kanji excluding terms with value above
     */
    setKanjiMemorizedThreshold(state, action: PayloadAction<number>) {
      const threshold = action.payload;

      state.setting.memoThreshold = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "memoThreshold",
        threshold
      );
    },

    setKanjiDifficulty: {
      reducer: (
        state: KanjiInitSlice,
        action: { payload: { uid: string; value: number } }
      ) => {
        const { uid, value } = action.payload;

        const { value: newValue } = updateSpaceRepTerm(
          uid,
          state.setting.repetition,
          { count: false, date: false },
          {
            set: { difficulty: value },
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
      prepare: (uid: string, value: number) => ({ payload: { uid, value } }),
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
    toggleKanjiFadeInAnswers(state, action: { payload?: boolean }) {
      const override = action.payload;

      state.setting.fadeInAnswers = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "fadeInAnswers",
        override
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
        const value = Object.keys(v).map((k) => {
          const isRadical =
            v[k].grp?.toLowerCase() === "radical" ||
            v[k].tag?.find((t) => t.toLowerCase() === "radical");

          return {
            ...v[k],
            uid: k,
            tag: v[k].tag === undefined ? [] : v[k].tag,
            radical: isRadical
              ? { example: v[k].radex?.split("") ?? [] }
              : undefined,
          };
        });

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

    builder.addCase(updateSpaceRepKanji.fulfilled, (state, action) => {
      const { value: newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );
    });
  },
});

export const {
  toggleKanjiActiveTag,
  toggleKanjiActiveGrp,
  toggleKanjiOrdering,
  addFrequencyKanji,
  removeFrequencyKanji,
  setKanjiMemorizedThreshold,
  setKanjiDifficulty,
  toggleKanjiFilter,
  toggleKanjiReinforcement,

  setKanjiBtnN,
  toggleKanjiFadeInAnswers,
} = kanjiSlice.actions;

export default kanjiSlice.reducer;
