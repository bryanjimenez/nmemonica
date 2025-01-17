import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import md5 from "md5";
import type { MetaDataObj, RawKanji } from "nmemonica";

import { logger } from "./globalSlice";
import {
  DebugLevel,
  TermFilterBy,
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { type Kanji, sheetDataToJSON } from "../helper/jsonHelper";
import {
  SR_MIN_REV_ITEMS,
  removeAction,
  updateAction,
} from "../helper/recallHelper";
import {
  buildSimilarityMap,
  buildTagObject,
  getPropsFromTags,
} from "../helper/reducerHelper";
import { getSheetFromIndexDB } from "../helper/sheetHelper";
import { MEMORIZED_THRLD } from "../helper/sortHelper";
import {
  userSettingAttrDelete,
  userSettingAttrUpdate,
} from "../helper/userSettingsHelper";
import type { ValuesOf } from "../typings/utils";

import type { RootState } from ".";

export interface KanjiInitSlice {
  value: RawKanji[];
  version: string;
  tagObj: string[];

  setting: {
    filter: ValuesOf<typeof TermFilterBy>;
    ordered: ValuesOf<typeof TermSortBy>;
    reinforce: boolean;
    difficultyThreshold: number;
    repTID: number;
    repetition: Record<string, MetaDataObj | undefined>;
    spaRepMaxReviewItem?: number;
    activeGroup: string[];
    activeTags: string[];
    includeNew: boolean;
    includeReviewed: boolean;

    viewGoal?: number;

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
    difficultyThreshold: MEMORIZED_THRLD,
    repTID: -1,
    repetition: {},
    spaRepMaxReviewItem: undefined,
    activeGroup: [],
    activeTags: [],
    includeNew: true,
    includeReviewed: true,

    viewGoal: undefined,

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
  async (_, thunkAPI) => {
    return getSheetFromIndexDB("kanji")
      .then((sheet) => {
        const { data: value, hash: version } = sheetDataToJSON(sheet) as {
          data: Record<string, Kanji>;
          hash: string;
        };

        return { value, version };
      })
      .catch((exception) => {
        if (exception instanceof Error) {
          thunkAPI.dispatch(logger(exception.message, DebugLevel.ERROR));
        }

        throw exception;
      });
  }
);

export const kanjiSettingsFromAppStorage = createAsyncThunk(
  "kanji/kanjiSettingsFromAppStorage",
  (arg: typeof kanjiInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

export const deleteMetaKanji = createAsyncThunk(
  "kanji/deleteMetaKanji",
  (uidList: string[], thunkAPI) => {
    const state = (thunkAPI.getState() as RootState).kanji;
    const spaceRep = state.setting.repetition;

    return deleteMetadata(uidList, spaceRep);
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

export const removeFromSpaceRepetition = createAsyncThunk(
  "kanji/removeFromSpaceRepetition",
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState).kanji;

    const spaceRep = state.setting.repetition;
    return removeAction(uid, spaceRep);
  }
);

export const setSpaceRepetitionMetadata = createAsyncThunk(
  "kanji/setSpaceRepetitionMetadata",
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState).kanji;

    const spaceRep = state.setting.repetition;
    return updateAction(uid, spaceRep);
  }
);

const kanjiSlice = createSlice({
  name: "kanji",
  initialState: kanjiInitState,
  reducers: {
    clearKanji(state) {
      state.value = kanjiInitState.value;
      state.version = kanjiInitState.version;
      state.tagObj = kanjiInitState.tagObj;
    },

    toggleKanjiActiveTag(state, action: { payload: string }) {
      const tagName: string = action.payload;

      const { activeTags } = state.setting;

      let newValue;
      if (activeTags.includes(tagName)) {
        newValue = activeTags.filter((a) => a !== tagName);
      } else {
        newValue = [...activeTags, tagName];
      }

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "activeTags",
        newValue
      );
      state.setting.activeTags = newValue;
    },
    toggleKanjiActiveGrp: (state, action: { payload: string }) => {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue = grpParse(groups, activeGroup);

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "activeGroup",
        newValue
      );

      state.setting.activeGroup = newValue;
    },

    toggleKanjiOrdering(
      state,
      action: { payload: ValuesOf<typeof TermSortBy> }
    ) {
      const { ordered } = state.setting;
      const override = action.payload;

      const allowed = [
        // TermSortBy.ALPHABETIC,
        TermSortBy.DIFFICULTY,
        TermSortBy.RANDOM,
        TermSortBy.VIEW_DATE,
        TermSortBy.RECALL,
      ];
      const newOrdered = toggleAFilter(
        ordered + 1,
        allowed,
        override
      ) as ValuesOf<typeof TermSortBy>;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "ordered",
        newOrdered
      );

      state.setting.ordered = newOrdered;
    },

    addFrequencyKanji(state, action: { payload: string }) {
      const uid = action.payload;

      const { record: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        { count: false, date: false },
        {
          set: { rein: true },
        }
      );

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    },

    removeFrequencyKanji(state, action: { payload: string }) {
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

        void userSettingAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      }
    },

    setMemorizedThreshold(state, action: PayloadAction<number>) {
      const threshold = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "difficultyThreshold",
        threshold
      );

      state.setting.difficultyThreshold = threshold;
    },

    setKanjiDifficulty: {
      reducer: (
        state: KanjiInitSlice,
        action: { payload: { uid: string; value: number | null } }
      ) => {
        const { uid, value } = action.payload;

        const { record: newValue } = updateSpaceRepTerm(
          uid,
          state.setting.repetition,
          { count: false, date: false },
          {
            set: { difficultyP: value },
          }
        );

        void userSettingAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      },
      prepare: (uid: string, value: number | null) => ({
        payload: { uid, value },
      }),
    },
    setKanjiAccuracy: {
      reducer: (
        state: KanjiInitSlice,
        action: { payload: { uid: string; value: number | null } }
      ) => {
        const { uid, value } = action.payload;

        const { record: newValue } = updateSpaceRepTerm(
          uid,
          state.setting.repetition,
          { count: false, date: false },
          {
            set: { accuracyP: value },
          }
        );

        void userSettingAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      },
      prepare: (uid: string, value: number | null) => ({
        payload: { uid, value },
      }),
    },
    batchRepetitionUpdate(
      state,
      action: { payload: Record<string, MetaDataObj | undefined> }
    ) {
      void userSettingAttrUpdate(
        new Date(),
        {},
        "/kanji/",
        "repetition",
        action.payload
      );

      state.setting.repetition = action.payload;
    },
    /**
     * Space Repetition maximum item review
     * per session
     */
    setSpaRepMaxItemReview(state, action: PayloadAction<number | undefined>) {
      const max = action.payload;

      if (max === undefined) {
        void userSettingAttrDelete(
          new Date(),
          "/kanji/",
          "spaRepMaxReviewItem"
        );
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        const maxItems = Math.max(SR_MIN_REV_ITEMS, max);
        void userSettingAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "spaRepMaxReviewItem",
          maxItems
        );

        state.setting.spaRepMaxReviewItem = maxItems;
      }
    },
    setKanjiBtnN(state, action: { payload: number }) {
      const number = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "choiceN",
        number
      );

      state.setting.choiceN = number;
    },
    toggleKanjiFadeInAnswers(state, action: { payload?: boolean }) {
      const override = action.payload ?? false;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "fadeInAnswers",
        override
      );

      state.setting.fadeInAnswers = override;
    },

    toggleKanjiFilter(state, action: { payload?: number }) {
      const override = action.payload;
      const { filter, reinforce } = state.setting;

      const newFilter = toggleAFilter(
        filter + 1,
        [TermFilterBy.FREQUENCY, TermFilterBy.TAGS],
        override
      ) as ValuesOf<typeof TermFilterBy>;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "filter",
        newFilter
      );

      state.setting.filter = newFilter;

      if (newFilter !== 0 && reinforce) {
        state.setting.reinforce = false;
      }
    },

    toggleKanjiReinforcement(state, action: { payload: boolean | undefined }) {
      const newValue = action.payload ?? false;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "reinforce",
        newValue
      );

      state.setting.reinforce = newValue;
    },
    toggleIncludeNew(state) {
      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "includeNew"
      );

      state.setting.includeNew = !state.setting.includeNew;
    },
    toggleIncludeReviewed(state) {
      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "includeReviewed"
      );

      state.setting.includeReviewed = !state.setting.includeReviewed;
    },
    setGoal(
      state,
      action: PayloadAction<KanjiInitSlice["setting"]["viewGoal"]>
    ) {
      const goal = action.payload;

      if (goal !== undefined) {
        void userSettingAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "viewGoal",
          goal
        );

        state.setting.viewGoal = goal;
      } else {
        state.setting.viewGoal = undefined;
        void userSettingAttrDelete(new Date(), "/kanji/", "viewGoal");
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getKanji.fulfilled, (state, action) => {
      const { value: v, version } = action.payload;

      let allSimilars = new Map<string, Set<string>>();

      let kanjiArr: RawKanji[] = Object.keys(v).map((k) => {
        const iKanji = v[k];
        const { tags, radicalExample, phoneticKanji, similarKanji, strokeN } =
          getPropsFromTags(iKanji.tag);

        const validSimilars = similarKanji.reduce<string[]>((acc, s) => {
          // ensure incoming kanji is in our list
          const similarUID = md5(s);
          if (v[similarUID] !== undefined) {
            acc = [...acc, similarUID];
          }
          return acc;
        }, []);

        allSimilars = buildSimilarityMap(allSimilars, k, validSimilars);

        return {
          ...iKanji,
          uid: k,

          // Keep raw metadata
          tag:
            iKanji.tag !== undefined
              ? (JSON.parse(iKanji.tag) as Record<string, string[]>)
              : undefined,

          // Derived from tag
          tags,
          strokeN,

          radical: radicalExample ? { example: radicalExample } : undefined,
          phoneticKanji,
          similarKanji: [], // set in second pass
        };
      });

      // second pass to set similars
      kanjiArr = kanjiArr.map((k) => {
        const s = allSimilars.get(k.uid);
        if (s !== undefined && s?.size > 0) {
          k.similarKanji = Array.from(s);
        }

        return k;
      });

      state.tagObj = buildTagObject(kanjiArr);
      state.value = kanjiArr;
      state.version = version;
    });

    builder.addCase(kanjiSettingsFromAppStorage.fulfilled, (state, action) => {
      const storedValue = action.payload;
      const mergedSettings = merge(kanjiInitState.setting, storedValue);

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });

    builder.addCase(updateSpaceRepKanji.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });

    builder.addCase(setSpaceRepetitionMetadata.fulfilled, (state, action) => {
      const { newValue } = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(removeFromSpaceRepetition.fulfilled, (state, action) => {
      const newValue = action.payload;

      if (newValue) {
        void userSettingAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      }
    });
    builder.addCase(deleteMetaKanji.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
  },
});

export const {
  clearKanji,
  toggleKanjiActiveTag,
  toggleKanjiActiveGrp,
  toggleKanjiOrdering,
  addFrequencyKanji,
  removeFrequencyKanji,
  setMemorizedThreshold,
  setKanjiDifficulty,
  setKanjiAccuracy,
  setSpaRepMaxItemReview,
  toggleKanjiFilter,
  toggleKanjiReinforcement,
  toggleIncludeNew,
  toggleIncludeReviewed,

  setKanjiBtnN,
  toggleKanjiFadeInAnswers,
  setGoal,
  batchRepetitionUpdate,
} = kanjiSlice.actions;

export default kanjiSlice.reducer;
