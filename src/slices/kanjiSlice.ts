import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import md5 from "md5";
import type { MetaDataObj, RawKanji } from "nmemonica";

import {
  TermFilterBy,
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { type Kanji, sheetDataToJSON } from "../helper/jsonHelper";
import {
  localStoreAttrDelete,
  localStoreAttrUpdate,
} from "../helper/localStorageHelper";
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
import {
  getWorkbookFromIndexDB,
  workbookSheetNames,
} from "../helper/sheetHelper";
import { MEMORIZED_THRLD } from "../helper/sortHelper";
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
export const getKanji = createAsyncThunk("kanji/getKanji", async () => {
  return getWorkbookFromIndexDB().then((workbook) => {
    const sheet = workbook.find(
      (s) =>
        s.name.toLowerCase() ===
        workbookSheetNames.kanji.prettyName.toLowerCase()
    );
    if (sheet === undefined) {
      throw new Error("Expected to find Kanji sheet in workbook");
    }
    const { data: value, hash: version } = sheetDataToJSON(sheet) as {
      data: Record<string, Kanji>;
      hash: string;
    };

    return { value, version };
  });
});

export const kanjiFromLocalStorage = createAsyncThunk(
  "kanji/kanjiFromLocalStorage",
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
        const { record: newValue } = updateSpaceRepTerm(
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

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      }
    },

    setMemorizedThreshold(state, action: PayloadAction<number>) {
      const threshold = action.payload;

      state.setting.difficultyThreshold = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "difficultyThreshold",
        threshold
      );
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

        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );
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

        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );
      },
      prepare: (uid: string, value: number | null) => ({
        payload: { uid, value },
      }),
    },
    batchRepetitionUpdate(
      state,
      action: { payload: Record<string, MetaDataObj | undefined> }
    ) {
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        {},
        "/kanji/",
        "repetition",
        action.payload
      );
    },
    /**
     * Space Repetition maximum item review
     * per session
     */
    setSpaRepMaxItemReview(state, action: PayloadAction<number | undefined>) {
      const max = action.payload;

      if (max === undefined) {
        localStoreAttrDelete(new Date(), "/kanji/", "spaRepMaxReviewItem");
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        state.setting.spaRepMaxReviewItem = localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "spaRepMaxReviewItem",
          Math.max(SR_MIN_REV_ITEMS, max)
        );
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
      ) as ValuesOf<typeof TermFilterBy>;

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

    toggleKanjiReinforcement(state, action: { payload: boolean | undefined }) {
      const newValue = action.payload;

      state.setting.reinforce = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "reinforce",
        newValue
      );
    },
    toggleIncludeNew(state) {
      state.setting.includeNew = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "includeNew"
      );
    },
    toggleIncludeReviewed(state) {
      state.setting.includeReviewed = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "includeReviewed"
      );
    },
    setGoal(
      state,
      action: PayloadAction<KanjiInitSlice["setting"]["viewGoal"]>
    ) {
      const goal = action.payload;

      if (goal !== undefined) {
        state.setting.viewGoal = localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "viewGoal",
          goal
        );
      } else {
        state.setting.viewGoal = undefined;
        localStoreAttrDelete(new Date(), "/kanji/", "viewGoal");
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getKanji.fulfilled, (state, action) => {
      const { value: v, version } = action.payload;

      let allSimilars = new Map<string, Set<string>>();

      let kanjiArr: RawKanji[] = Object.keys(v).map((k) => {
        const iKanji = v[k];
        const { tags, radicalExample, phoneticKanji, similarKanji } =
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
          // Not used after parsing
          tag: undefined,

          // Derived from tag
          tags,

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

    builder.addCase(kanjiFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(kanjiInitState.setting, localStorageValue);

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });

    builder.addCase(updateSpaceRepKanji.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );
    });

    builder.addCase(setSpaceRepetitionMetadata.fulfilled, (state, action) => {
      const { newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { kanji: state.setting },
        "/kanji/",
        "repetition",
        newValue
      );
    });
    builder.addCase(removeFromSpaceRepetition.fulfilled, (state, action) => {
      const newValue = action.payload;

      if (newValue) {
        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { kanji: state.setting },
          "/kanji/",
          "repetition",
          newValue
        );
      }
    });
    builder.addCase(deleteMetaKanji.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

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
