import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import md5 from "md5";
import type { MetaDataObj, RawKanji } from "nmemonica";

import { logger } from "./globalSlice";
import {
  deleteUserSettings,
  getSheetFromIndexDB,
  getUserProgress,
  updateUserProgress,
  updateUserSettings,
} from "./indexedDBSlice";
import {
  TermSortBy,
  deleteMetadata,
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
import { MEMORIZED_THRLD } from "../helper/sortHelper";
import type { RootState } from "../typings/slices";
import type { ValuesOf } from "../typings/utils";

const SLICE_NAME = "kanji";
const path = "/kanji/";
export interface KanjiInitSlice {
  value: RawKanji[];
  version: string;
  tagObj: string[];

  metadata: Record<string, MetaDataObj | undefined>;
  metadataID: number;

  setting: {
    ordered: ValuesOf<typeof TermSortBy>;
    difficultyThreshold: number;
    spaRepMaxReviewItem?: number;
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
    ordered: 0,
    difficultyThreshold: MEMORIZED_THRLD,
    spaRepMaxReviewItem: undefined,
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
 * Fetch kanji
 */
export const getKanji = createAsyncThunk(
  `${SLICE_NAME}/getKanji`,
  async (_, thunkAPI) => {
    return thunkAPI
      .dispatch(getSheetFromIndexDB(SLICE_NAME))
      .unwrap()
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
  (_arg, thunkAPI) => {
    return thunkAPI
      .dispatch(getUserProgress(SLICE_NAME))
      .unwrap()
      .then((data) => {
        return (data ?? {}) as Record<string, MetaDataObj>;
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

    return thunkAPI
      .dispatch(updateUserProgress({ path: SLICE_NAME, value: newValue }))
      .unwrap()
      .then(() => newValue);
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

    return thunkAPI
      .dispatch(updateUserProgress({ path: SLICE_NAME, value: newValue }))
      .unwrap()
      .then(() => newValue);
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

    return thunkAPI
      .dispatch(updateUserProgress({ path: SLICE_NAME, value: value.record }))
      .unwrap()
      .then(() => value);
  }
);

export const setSpaceRepetitionMetadata = createAsyncThunk(
  `${SLICE_NAME}/setSpaceRepetitionMetadata`,
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.metadata;
    const value = updateAction(uid, spaceRep);

    return thunkAPI
      .dispatch(updateUserProgress({ path: SLICE_NAME, value: value.newValue }))
      .unwrap()
      .then(() => value);
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
      return thunkAPI
        .dispatch(updateUserProgress({ path: SLICE_NAME, value: newValue }))
        .unwrap()
        .then(() => newValue);
    } else {
      return Promise.resolve(newValue);
    }
  }
);

export const batchRepetitionUpdate = createAsyncThunk(
  `${SLICE_NAME}/batchRepetitionUpdate`,
  (payload: Record<string, MetaDataObj | undefined>, thunkAPI) =>
    thunkAPI
      .dispatch(updateUserProgress({ path: SLICE_NAME, value: payload }))
      .unwrap()

      .then(() => payload)
);

export const deleteMetaKanji = createAsyncThunk(
  `${SLICE_NAME}/deleteMetaKanji`,
  (uidList: string[], thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];
    const spaceRep = state.metadata;

    const newValue = deleteMetadata(uidList, spaceRep);

    return thunkAPI
      .dispatch(
        updateUserProgress({ path: SLICE_NAME, value: newValue.record })
      )
      .unwrap()
      .then(() => newValue);
  }
);

/**
 * Toggle a Kanji's **Tag** in or out of the view criteria list
 * @param tagName tag to be selected/ignored
 */
export const toggleKanjiActiveTag = createAsyncThunk(
  `${SLICE_NAME}/toggleKanjiActiveTag`,
  (tagName: string, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { activeTags } = setting;

    let newValue;
    if (activeTags.includes(tagName)) {
      newValue = activeTags.filter((a) => a !== tagName);
    } else {
      newValue = [...activeTags, tagName];
    }

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { kanji: setting },
          path,
          attr: "activeTags",
          value: newValue,
        })
      )
      .unwrap();
  }
);

export const toggleKanjiOrdering = createAsyncThunk(
  `${SLICE_NAME}/toggleKanjiOrdering`,
  (override: ValuesOf<typeof TermSortBy>, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { ordered } = setting;

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

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { kanji: setting },
          path,
          attr: "ordered",
          value: newOrdered,
        })
      )
      .unwrap();
  }
);

export const setMemorizedThreshold = createAsyncThunk(
  `${SLICE_NAME}/setMemorizedThreshold`,
  (threshold: number, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { kanji: setting },
          path,
          attr: "difficultyThreshold",
          value: threshold,
        })
      )
      .unwrap();
  }
);

/**
 * Space Repetition maximum item review
 * per session
 */
export const setSpaRepMaxItemReview = createAsyncThunk(
  `${SLICE_NAME}/setSpaRepMaxItemReview`,
  (max: number | undefined, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    if (max === undefined) {
      return thunkAPI
        .dispatch(deleteUserSettings({ path, attr: "spaRepMaxReviewItem" }))
        .unwrap();
    } else {
      const maxItems = Math.max(SR_MIN_REV_ITEMS, max);

      return thunkAPI
        .dispatch(
          updateUserSettings({
            state: { kanji: setting },
            path,
            attr: "spaRepMaxReviewItem",
            value: maxItems,
          })
        )
        .unwrap();
    }
  }
);

export const setKanjiBtnN = createAsyncThunk(
  `${SLICE_NAME}/setKanjiBtnN`,
  (choice: number, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { kanji: setting },
          path,
          attr: "choiceN",
          value: choice,
        })
      )
      .unwrap();
  }
);

export const toggleKanjiFadeInAnswers = createAsyncThunk(
  `${SLICE_NAME}/toggleKanjiFadeInAnswers`,
  (override: boolean, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { kanji: setting },
          path,
          attr: "fadeInAnswers",
          value: override,
        })
      )
      .unwrap();
  }
);

export const toggleIncludeNew = createAsyncThunk(
  `${SLICE_NAME}/toggleIncludeNew`,
  (_arg, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings<boolean>({
          state: { kanji: setting },
          path,
          attr: "includeNew",
        })
      )
      .unwrap();
  }
);

export const toggleIncludeReviewed = createAsyncThunk(
  `${SLICE_NAME}/toggleIncludeReviewed`,
  (_arg, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings<boolean>({
          state: { kanji: setting },
          path,
          attr: "includeReviewed",
        })
      )
      .unwrap();
  }
);

export const setGoal = createAsyncThunk(
  `${SLICE_NAME}/setGoal`,
  (goal: number | undefined, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    if (goal !== undefined) {
      return thunkAPI
        .dispatch(
          updateUserSettings({
            state: { kanji: setting },
            path,
            attr: "viewGoal",
            value: goal,
          })
        )
        .unwrap();
    } else {
      return thunkAPI
        .dispatch(deleteUserSettings({ path, attr: "viewGoal" }))
        .unwrap();
    }
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
    builder.addCase(toggleKanjiActiveTag.fulfilled, (state, action) => {
      const tagName = action.payload;
      state.setting.activeTags = tagName;
    });
    builder.addCase(setMemorizedThreshold.fulfilled, (state, action) => {
      const difficultyThreshold = action.payload;
      state.setting.difficultyThreshold = difficultyThreshold;
    });

    builder.addCase(setSpaRepMaxItemReview.fulfilled, (state, action) => {
      const maxItems = action.payload;
      state.setting.spaRepMaxReviewItem = maxItems;
    });

    builder.addCase(toggleKanjiOrdering.fulfilled, (state, action) => {
      const ordered = action.payload;
      state.setting.ordered = ordered;
    });

    builder.addCase(toggleIncludeNew.fulfilled, (state, action) => {
      const includeNew = action.payload;
      state.setting.includeNew = includeNew;
    });

    builder.addCase(toggleIncludeReviewed.fulfilled, (state, action) => {
      const includeReviewed = action.payload;
      state.setting.includeReviewed = includeReviewed;
    });

    builder.addCase(setGoal.fulfilled, (state, action) => {
      const viewGoal = action.payload;
      state.setting.viewGoal = viewGoal;
    });

    builder.addCase(toggleKanjiFadeInAnswers.fulfilled, (state, action) => {
      const fade = action.payload;
      state.setting.fadeInAnswers = fade;
    });

    builder.addCase(setKanjiBtnN.fulfilled, (state, action) => {
      const number = action.payload;
      state.setting.choiceN = number;
    });
  },
});

export const { clearKanji } = kanjiSlice.actions;

export default kanjiSlice.reducer;
