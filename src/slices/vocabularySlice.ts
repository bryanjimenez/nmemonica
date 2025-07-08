import { type SheetData } from "@nmemonica/x-spreadsheet";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import type { GroupListMap, MetaDataObj, RawVocabulary } from "nmemonica";

import { logger } from "./globalSlice";
import {
  deleteUserSettings,
  getSheetFromIndexDB,
  getUserProgress,
  getWorkbookFromIndexDB,
  setWorkbookFromIndexDB,
  updateUserProgress,
  updateUserSettings,
} from "./indexedDBSlice";
import {
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { DebugLevel } from "../helper/consoleHelper";
import { getVerbFormsArray } from "../helper/JapaneseVerb";
import { type Vocabulary, sheetDataToJSON } from "../helper/jsonHelper";
import {
  SR_MIN_REV_ITEMS,
  removeAction,
  updateAction,
} from "../helper/recallHelper";
import {
  buildGroupObject,
  buildVocabularyArray,
} from "../helper/reducerHelper";
import {
  getTagsFromSheet,
  setTagsFromSheet,
  workbookSheetNames,
} from "../helper/sheetHelper";
import { MEMORIZED_THRLD } from "../helper/sortHelper";
import type { RootState } from "../typings/slices";
import type { ValuesOf } from "../typings/utils";

const SLICE_NAME = "vocabulary";
const path = "/vocabulary/";

export interface VocabularyInitSlice {
  value: RawVocabulary[];
  version: string;
  grpObj: GroupListMap;
  verbForm: string;

  metadata: Record<string, MetaDataObj | undefined>;
  metadataID: number;

  setting: {
    ordered: ValuesOf<typeof TermSortBy>;
    englishSideUp: boolean;
    spaRepMaxReviewItem?: number;
    activeGroup: string[];
    difficultyThreshold: number;
    includeNew: boolean;
    includeReviewed: boolean;
    bareKanji: boolean;
    hintEnabled: boolean;
    autoVerbView: boolean;
    verbColSplit: number;
    verbFormsOrder: string[];

    viewGoal?: number;
  };
}

export const vocabularyInitState: VocabularyInitSlice = {
  value: [],
  version: "",
  grpObj: {},
  verbForm: "dictionary",

  metadata: {},
  metadataID: -1,

  setting: {
    ordered: 0,
    englishSideUp: false,
    spaRepMaxReviewItem: undefined,
    activeGroup: [],
    difficultyThreshold: MEMORIZED_THRLD,
    includeNew: true,
    includeReviewed: true,

    viewGoal: undefined,

    bareKanji: false,
    hintEnabled: false,
    autoVerbView: false,
    verbColSplit: 0,
    verbFormsOrder: getVerbFormsArray().map((f) => f.name),
  },
};

/**
 * Fetch vocabulary
 */
export const getVocabulary = createAsyncThunk(
  `${SLICE_NAME}/getVocabulary`,
  async (_arg, thunkAPI) => {
    return thunkAPI
      .dispatch(getSheetFromIndexDB(SLICE_NAME))
      .unwrap()
      .then((sheet) => {
        const { data: value, hash: version } = sheetDataToJSON(sheet) as {
          data: Record<string, Vocabulary>;
          hash: string;
        };

        return { value, version };
      });
  }
);

/**
 * Pull Vocabulary metadata from indexedDB
 */
export const getVocabularyMeta = createAsyncThunk(
  `${SLICE_NAME}/getVocabularyMeta`,
  (_arg, thunkAPI) => {
    return thunkAPI
      .dispatch(getUserProgress(SLICE_NAME))
      .unwrap()
      .then((data) => {
        return (data ?? {}) as Record<string, MetaDataObj>;
      });
  }
);

export const vocabularySettingsFromAppStorage = createAsyncThunk(
  `${SLICE_NAME}/vocabularySettingsFromAppStorage`,
  (arg: typeof vocabularyInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

/**
 * Update the Vocab's tag metadata in the sheet
 */
export const toggleVocabularyTag = createAsyncThunk(
  `${SLICE_NAME}/toggleVocabularyTag`,
  (arg: { query: string; tag: string }, thunkAPI) => {
    const { query, tag } = arg;
    const sheetName = workbookSheetNames.vocabulary.prettyName;

    return thunkAPI
      .dispatch(getWorkbookFromIndexDB([SLICE_NAME]))
      .unwrap()
      .then((sheetArr: SheetData[]) => {
        // Get current tags for term
        const vIdx = sheetArr.findIndex(
          (s) => s.name.toLowerCase() === sheetName.toLowerCase()
        );

        const s = { ...sheetArr[vIdx] };

        const updatedSheet = setTagsFromSheet(s, query, tag);

        const wb = [
          ...sheetArr.filter(
            (s) => s.name.toLowerCase() !== sheetName.toLowerCase()
          ),
          updatedSheet,
        ];

        // Save to indexedDB
        return thunkAPI
          .dispatch(setWorkbookFromIndexDB(wb))
          .unwrap()
          .then(() => {
            // TODO: update json?
            // TODO: update state
          });
      });
  }
);

export const getVocabularyTags = createAsyncThunk(
  `${SLICE_NAME}/getVocabularyTags`,
  (arg: { query: string }, thunkAPI) => {
    const { query } = arg;
    const sheetName = workbookSheetNames.vocabulary.prettyName;

    return thunkAPI
      .dispatch(getWorkbookFromIndexDB([SLICE_NAME]))
      .unwrap()
      .then((sheetArr: SheetData[]) => {
        // Get current tags for term
        const vIdx = sheetArr.findIndex(
          (s) => s.name.toLowerCase() === sheetName.toLowerCase()
        );

        const s = { ...sheetArr[vIdx] };

        return getTagsFromSheet(s, query);
      })
      .catch((exception) => {
        if (exception instanceof Error) {
          thunkAPI.dispatch(logger(exception.message, DebugLevel.ERROR));
        }

        throw exception;
      });
  }
);

export const flipVocabularyPracticeSide = createAsyncThunk(
  `${SLICE_NAME}/flipVocabularyPracticeSide`,
  (_arg, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { [SLICE_NAME]: state.setting },
          path,
          attr: "englishSideUp",
        })
      )
      .unwrap();
  }
);

export const setWordAccuracy = createAsyncThunk(
  `${SLICE_NAME}/setWordAccuracy`,
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

export const setWordDifficulty = createAsyncThunk(
  `${SLICE_NAME}/setWordDifficulty`,
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

export const updateSpaceRepWord = createAsyncThunk(
  `${SLICE_NAME}/updateSpaceRepWord`,
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

export const deleteMetaVocab = createAsyncThunk(
  `${SLICE_NAME}/deleteMetaVocab`,
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
 * Toggle a Vocab's **group** in or out of the view criteria list
 * @param grpName group to be selected/ignored
 */
export const toggleVocabularyActiveGrp = createAsyncThunk(
  `${SLICE_NAME}/toggleVocabularyActiveGrp`,
  (grpName: string | string[], thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { activeGroup } = setting;

    const groups = Array.isArray(grpName) ? grpName : [grpName];
    const newValue = grpParse(groups, activeGroup);

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { [SLICE_NAME]: setting },
          path,
          attr: "activeGroup",
          value: newValue,
        })
      )
      .unwrap();
  }
);

export const toggleVocabularyOrdering = createAsyncThunk(
  `${SLICE_NAME}/toggleVocabularyOrdering`,
  (override: number, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];
    const { ordered } = setting;

    const allowed = [
      TermSortBy.ALPHABETIC,
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
          state: { [SLICE_NAME]: setting },
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
          state: { [SLICE_NAME]: setting },
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
        .dispatch(
          deleteUserSettings({
            path,
            attr: "spaRepMaxReviewItem",
          })
        )
        .unwrap();
    } else {
      const maxItems = Math.max(SR_MIN_REV_ITEMS, max);

      return thunkAPI
        .dispatch(
          updateUserSettings({
            state: { [SLICE_NAME]: setting },
            path,
            attr: "spaRepMaxReviewItem",
            value: maxItems,
          })
        )
        .unwrap();
    }
  }
);

export const toggleIncludeNew = createAsyncThunk(
  `${SLICE_NAME}/toggleIncludeNew`,
  (_arg, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings<boolean>({
          state: { [SLICE_NAME]: setting },
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
          state: { [SLICE_NAME]: setting },
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
            state: { [SLICE_NAME]: setting },
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

/**
 * Display or hide furigana on Vocab
 */
export const furiganaToggled = createAsyncThunk(
  `${SLICE_NAME}/furiganaToggled`,
  (uid: string, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { record: newValue } = updateSpaceRepTerm(
      uid,
      state.metadata,
      { count: false, date: false },
      {
        toggle: ["f"],
      }
    );

    return thunkAPI
      .dispatch(updateUserProgress({ path: SLICE_NAME, value: newValue }))
      .unwrap()
      .then(() => newValue);
  }
);

/**
 * Show pitch accent data information
 */
export const setPitchAccentData = createAsyncThunk(
  `${SLICE_NAME}/setPitchAccentData`,
  ({ uid, value }: { uid: string; value: true | null }, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { record: newValue } = updateSpaceRepTerm(
      uid,
      state.metadata,
      { count: false, date: false },
      {
        set: { pron: value },
      }
    );

    return thunkAPI
      .dispatch(updateUserProgress({ path: SLICE_NAME, value: newValue }))
      .unwrap()
      .then(() => newValue);
  }
);

/**
 * When English is shown also show Kanji (no furigana)
 */
export const toggleVocabularyBareKanji = createAsyncThunk(
  `${SLICE_NAME}/toggleVocabularyBareKanji`,
  (_arg, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings<boolean>({
          state: { [SLICE_NAME]: setting },
          path,
          attr: "bareKanji",
        })
      )
      .unwrap();
  }
);

/**
 * If available show a pronunciation hint
 */
export const toggleVocabularyHint = createAsyncThunk(
  `${SLICE_NAME}/toggleVocabularyHint`,
  (_arg, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings<boolean>({
          state: { [SLICE_NAME]: setting },
          path,
          attr: "hintEnabled",
        })
      )
      .unwrap();
  }
);

export const setVerbFormsOrder = createAsyncThunk(
  `${SLICE_NAME}/setVerbFormsOrder`,
  (order: string[], thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { [SLICE_NAME]: setting },
          path,
          attr: "verbFormsOrder",
          value: order,
        })
      )
      .unwrap();
  }
);

/**
 * If Vocab is a verb display available forms
 */
export const toggleAutoVerbView = createAsyncThunk(
  `${SLICE_NAME}/toggleAutoVerbView`,
  (order: boolean, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { [SLICE_NAME]: setting },
          path,
          attr: "autoVerbView",
          value: order,
        })
      )
      .unwrap();
  }
);

export const updateVerbColSplit = createAsyncThunk(
  `${SLICE_NAME}/updateVerbColSplit`,
  (split: number, thunkAPI) => {
    const { setting } = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return thunkAPI
      .dispatch(
        updateUserSettings({
          state: { [SLICE_NAME]: setting },
          path,
          attr: "verbColSplit",
          value: split,
        })
      )
      .unwrap();
  }
);

const vocabularySlice = createSlice({
  name: SLICE_NAME,
  initialState: vocabularyInitState,
  reducers: {
    clearVocabulary(state) {
      state.value = vocabularyInitState.value;
      state.version = vocabularyInitState.version;
      state.grpObj = vocabularyInitState.grpObj;
      state.verbForm = vocabularyInitState.verbForm;
    },
    verbFormChanged(state, action: { payload: string }) {
      return {
        ...state,
        verbForm: action.payload,
      };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(
      vocabularySettingsFromAppStorage.fulfilled,
      (state, action) => {
        const storedValue = action.payload;
        const mergedSettings = merge(vocabularyInitState.setting, storedValue);

        return {
          ...state,
          setting: { ...mergedSettings, repTID: Date.now() },
        };
      }
    );

    builder.addCase(getVocabulary.fulfilled, (state, action) => {
      const { value, version } = action.payload;
      state.grpObj = buildGroupObject(value);
      state.value = buildVocabularyArray(value);
      state.version = version;
    });

    builder.addCase(getVocabularyMeta.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(flipVocabularyPracticeSide.fulfilled, (state) => {
      state.setting.englishSideUp = !state.setting.englishSideUp;
    });

    builder.addCase(setWordAccuracy.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(setWordDifficulty.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(updateSpaceRepWord.fulfilled, (state, action) => {
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

    builder.addCase(deleteMetaVocab.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(toggleVocabularyActiveGrp.fulfilled, (state, action) => {
      const activeGroup = action.payload;
      state.setting.activeGroup = activeGroup;
    });

    builder.addCase(toggleVocabularyOrdering.fulfilled, (state, action) => {
      const ordered = action.payload;
      state.setting.ordered = ordered;
    });

    builder.addCase(setMemorizedThreshold.fulfilled, (state, action) => {
      const difficultyThreshold = action.payload;
      state.setting.difficultyThreshold = difficultyThreshold;
    });

    builder.addCase(setSpaRepMaxItemReview.fulfilled, (state, action) => {
      const maxItems = action.payload;
      state.setting.spaRepMaxReviewItem = maxItems;
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

    builder.addCase(setPitchAccentData.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(furiganaToggled.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(toggleVocabularyBareKanji.fulfilled, (state, action) => {
      const bareKanji = action.payload;
      state.setting.bareKanji = bareKanji;
    });

    builder.addCase(toggleVocabularyHint.fulfilled, (state, action) => {
      const hintEnabled = action.payload;
      state.setting.hintEnabled = hintEnabled;
    });

    builder.addCase(setVerbFormsOrder.fulfilled, (state, action) => {
      const verbFormsOrder = action.payload;
      state.setting.verbFormsOrder = verbFormsOrder;
    });

    builder.addCase(toggleAutoVerbView.fulfilled, (state, action) => {
      const autoVerbView = action.payload;
      state.setting.autoVerbView = autoVerbView;
    });

    builder.addCase(updateVerbColSplit.fulfilled, (state, action) => {
      const verbColSplit = action.payload;
      state.setting.verbColSplit = verbColSplit;
    });
  },
});

export const { clearVocabulary, verbFormChanged } = vocabularySlice.actions;
export default vocabularySlice.reducer;
