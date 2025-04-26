import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import md5 from "md5";
import type { MetaDataObj, RawKanji } from "nmemonica";

import { logger } from "./globalSlice";
import {
  TermFilterBy,
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { DebugLevel } from "../helper/consoleHelper";
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
  userStudyProgressAttrUpdate,
} from "../helper/userSettingsHelper";
import { getIndexDBStudyProgress } from "../helper/userSettingsIndexDBHelper";
import type { ValuesOf } from "../typings/utils";

import type { RootState } from ".";

const SLICE_NAME = "kanji";
export interface KanjiInitSlice {
  value: RawKanji[];
  version: string;
  tagObj: string[];

  metadata: Record<string, MetaDataObj | undefined>;
  metadataID: number;

  setting: {
    filter: ValuesOf<typeof TermFilterBy>;
    ordered: ValuesOf<typeof TermSortBy>;
    difficultyThreshold: number;
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

  metadata: {},
  metadataID: -1,

  setting: {
    filter: 2,
    ordered: 0,
    difficultyThreshold: MEMORIZED_THRLD,
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
  `${SLICE_NAME}/getKanji`,
  async (_, thunkAPI) => {
    return getSheetFromIndexDB(SLICE_NAME)
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

/**
 * Pull Kanji metadata from indexedDB
 */
export const getKanjiMeta = createAsyncThunk(
  `${SLICE_NAME}/getKanjiMeta`,
  async () => {
    return getIndexDBStudyProgress(SLICE_NAME).then((data) => {
      return data ?? {};
    });
  }
);

export const kanjiSettingsFromAppStorage = createAsyncThunk(
  `${SLICE_NAME}/kanjiSettingsFromAppStorage`,
  (arg: typeof kanjiInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

export const setKanjiAccuracy = createAsyncThunk(
  `${SLICE_NAME}/setKanjiAccuracy`,
  ({ uid, accuracy }: { uid: string; accuracy: number | null }, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { record: newValue } = updateSpaceRepTerm(
      uid,
      state.metadata,
      { count: false, date: false },
      {
        set: { accuracyP: accuracy },
      }
    );

    return userStudyProgressAttrUpdate(SLICE_NAME, newValue).then(
      () => newValue
    );
  }
);

export const setKanjiDifficulty = createAsyncThunk(
  `${SLICE_NAME}/setKanjiDifficulty`,
  (
    { uid, difficulty }: { uid: string; difficulty: number | null },
    thunkAPI
  ) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { record: newValue } = updateSpaceRepTerm(
      uid,
      state.metadata,
      { count: false, date: false },
      {
        set: { difficultyP: difficulty },
      }
    );

    return userStudyProgressAttrUpdate(SLICE_NAME, newValue).then(
      () => newValue
    );
  }
);

export const updateSpaceRepKanji = createAsyncThunk(
  `${SLICE_NAME}/updateSpaceRepKanji`,
  (arg: { uid: string; shouldIncrement?: boolean }, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.metadata;

    const value = updateSpaceRepTerm(uid, spaceRep, {
      count: shouldIncrement,
      date: true,
    });

    return userStudyProgressAttrUpdate(SLICE_NAME, value.record).then(
      () => value
    );
  }
);

export const setSpaceRepetitionMetadata = createAsyncThunk(
  `${SLICE_NAME}/setSpaceRepetitionMetadata`,
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.metadata;
    const value = updateAction(uid, spaceRep);

    return userStudyProgressAttrUpdate(SLICE_NAME, value.newValue).then(
      () => value
    );
  }
);

export const removeFromSpaceRepetition = createAsyncThunk(
  `${SLICE_NAME}/removeFromSpaceRepetition`,
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.metadata;
    const newValue = removeAction(uid, spaceRep);

    if (newValue) {
      return userStudyProgressAttrUpdate(SLICE_NAME, newValue).then(
        () => newValue
      );
    } else {
      return Promise.resolve(newValue);
    }
  }
);

export const batchRepetitionUpdate = createAsyncThunk(
  `${SLICE_NAME}/batchRepetitionUpdate`,
  (payload: Record<string, MetaDataObj | undefined>, _thunkAPI) =>
    userStudyProgressAttrUpdate(SLICE_NAME, payload).then(() => payload)
);

export const deleteMetaKanji = createAsyncThunk(
  `${SLICE_NAME}/deleteMetaKanji`,
  (uidList: string[], thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];
    const spaceRep = state.metadata;

    const newValue = deleteMetadata(uidList, spaceRep);

    return userStudyProgressAttrUpdate(SLICE_NAME, newValue.record).then(
      () => newValue
    );
  }
);

const kanjiSlice = createSlice({
  name: SLICE_NAME,
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
        { kanji: state.setting },
        "/kanji/",
        "ordered",
        newOrdered
      );

      state.setting.ordered = newOrdered;
    },

    setMemorizedThreshold(state, action: PayloadAction<number>) {
      const threshold = action.payload;

      void userSettingAttrUpdate(
        { kanji: state.setting },
        "/kanji/",
        "difficultyThreshold",
        threshold
      );

      state.setting.difficultyThreshold = threshold;
    },
    /**
     * Space Repetition maximum item review
     * per session
     */
    setSpaRepMaxItemReview(state, action: PayloadAction<number | undefined>) {
      const max = action.payload;

      if (max === undefined) {
        void userSettingAttrDelete("/kanji/", "spaRepMaxReviewItem");
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        const maxItems = Math.max(SR_MIN_REV_ITEMS, max);
        void userSettingAttrUpdate(
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
        { kanji: state.setting },
        "/kanji/",
        "fadeInAnswers",
        override
      );

      state.setting.fadeInAnswers = override;
    },

    toggleKanjiFilter(state, action: { payload?: number }) {
      const override = action.payload;
      const { filter } = state.setting;

      const newFilter = toggleAFilter(
        filter + 1,
        [TermFilterBy.TAGS],
        override
      ) as ValuesOf<typeof TermFilterBy>;

      void userSettingAttrUpdate(
        { kanji: state.setting },
        "/kanji/",
        "filter",
        newFilter
      );

      state.setting.filter = newFilter;
    },

    toggleIncludeNew(state) {
      void userSettingAttrUpdate(
        { kanji: state.setting },
        "/kanji/",
        "includeNew"
      );

      state.setting.includeNew = !state.setting.includeNew;
    },
    toggleIncludeReviewed(state) {
      void userSettingAttrUpdate(
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
          { kanji: state.setting },
          "/kanji/",
          "viewGoal",
          goal
        );

        state.setting.viewGoal = goal;
      } else {
        state.setting.viewGoal = undefined;
        void userSettingAttrDelete("/kanji/", "viewGoal");
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

    builder.addCase(getKanjiMeta.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(kanjiSettingsFromAppStorage.fulfilled, (state, action) => {
      const storedValue = action.payload;
      const mergedSettings = merge(kanjiInitState.setting, storedValue);

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });

    builder.addCase(setKanjiAccuracy.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
    builder.addCase(setKanjiDifficulty.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
    builder.addCase(updateSpaceRepKanji.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
    builder.addCase(setSpaceRepetitionMetadata.fulfilled, (state, action) => {
      const { newValue } = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
    builder.addCase(removeFromSpaceRepetition.fulfilled, (state, action) => {
      const newValue = action.payload;

      if (newValue) {
        state.metadataID = Date.now();
        state.metadata = newValue;
      }
    });
    builder.addCase(batchRepetitionUpdate.fulfilled, (state, action) => {
      const newValue = action.payload;

      // state.metadataID = Date.now();
      state.metadata = newValue;
    });
    builder.addCase(deleteMetaKanji.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
  },
});

export const {
  clearKanji,
  toggleKanjiActiveTag,
  toggleKanjiActiveGrp,
  toggleKanjiOrdering,
  setMemorizedThreshold,

  setSpaRepMaxItemReview,
  toggleKanjiFilter,
  toggleIncludeNew,
  toggleIncludeReviewed,

  setKanjiBtnN,
  toggleKanjiFadeInAnswers,
  setGoal,
} = kanjiSlice.actions;

export default kanjiSlice.reducer;
