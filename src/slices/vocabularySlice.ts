import { SheetData } from "@nmemonica/x-spreadsheet";
import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import type { GroupListMap, MetaDataObj, RawVocabulary } from "nmemonica";

import { logger } from "./globalSlice";
import {
  TermFilterBy,
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { IDBStores, openIDB, putIDBItem } from "../../pwa/helper/idbHelper";
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
  getSheetFromIndexDB,
  getTagsFromSheet,
  getWorkbookFromIndexDB,
  setTagsFromSheet,
  workbookSheetNames,
} from "../helper/sheetHelper";
import { MEMORIZED_THRLD } from "../helper/sortHelper";
import {
  userSettingAttrDelete,
  userSettingAttrUpdate,
  userStudyStateAttrUpdate,
} from "../helper/userSettingsHelper";
import type { ValuesOf } from "../typings/utils";

import type { RootState } from ".";

const SLICE_NAME = "vocabulary";
export interface VocabularyInitSlice {
  value: RawVocabulary[];
  version: string;
  grpObj: GroupListMap;
  verbForm: string;

  setting: {
    ordered: ValuesOf<typeof TermSortBy>;
    englishSideUp: boolean;
    bareKanji: boolean;
    hintEnabled: boolean;
    filter: ValuesOf<typeof TermFilterBy>;
    difficultyThreshold: number;
    repTID: number;
    repetition: Record<string, MetaDataObj | undefined>;
    spaRepMaxReviewItem?: number;
    activeGroup: string[];
    autoVerbView: boolean;
    verbColSplit: number;
    verbFormsOrder: string[];
    includeNew: boolean;
    includeReviewed: boolean;

    viewGoal?: number;
  };
}
export const vocabularyInitState: VocabularyInitSlice = {
  value: [],
  version: "",
  grpObj: {},
  verbForm: "dictionary",

  setting: {
    ordered: 0,
    englishSideUp: false,
    bareKanji: false,
    hintEnabled: false,
    filter: 0,
    difficultyThreshold: MEMORIZED_THRLD,
    repTID: -1,
    repetition: {},
    spaRepMaxReviewItem: undefined,
    activeGroup: [],
    autoVerbView: false,
    verbColSplit: 0,
    verbFormsOrder: getVerbFormsArray().map((f) => f.name),
    includeNew: true,
    includeReviewed: true,

    viewGoal: undefined,
  },
};

/**
 * Fetch vocabulary
 */
export const getVocabulary = createAsyncThunk(
  `${SLICE_NAME}/getVocabulary`,
  async () => {
    return getSheetFromIndexDB(SLICE_NAME).then((sheet) => {
      const { data: value, hash: version } = sheetDataToJSON(sheet) as {
        data: Record<string, Vocabulary>;
        hash: string;
      };

      return { value, version };
    });
  }
);

export const vocabularySettingsFromAppStorage = createAsyncThunk(
  `${SLICE_NAME}/vocabularySettingsFromAppStorage`,
  (arg: (typeof vocabularyInitState)["setting"]) => {
    const initValues = arg;

    return initValues;
  }
);

export const toggleVocabularyTag = createAsyncThunk(
  `${SLICE_NAME}/toggleVocabularyTag`,
  (arg: { query: string; tag: string }) => {
    const { query, tag } = arg;
    const sheetName = workbookSheetNames.vocabulary.prettyName;

    return getWorkbookFromIndexDB(["vocabulary"]).then(
      (sheetArr: SheetData[]) => {
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
        return openIDB()
          .then((db) =>
            putIDBItem(
              { db, store: IDBStores.WORKBOOK },
              { key: "0", workbook: wb }
            )
          )
          .then(() => {
            // TODO: update json?
            // TODO: update state
          });
      }
    );
  }
);

export const getVocabularyTags = createAsyncThunk(
  `${SLICE_NAME}/getVocabularyTags`,
  (arg: { query: string }, thunkAPI) => {
    const { query } = arg;
    const sheetName = workbookSheetNames.vocabulary.prettyName;

    return getWorkbookFromIndexDB(["vocabulary"])
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

    return userSettingAttrUpdate(
      { vocabulary: state.setting },
      "/vocabulary/",
      "englishSideUp"
    );
  }
);

export const setWordAccuracy = createAsyncThunk(
  `${SLICE_NAME}/setWordAccuracy`,
  ({ uid, accuracy }: { uid: string; accuracy: number | null }, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { record: newValue } = updateSpaceRepTerm(
      uid,
      state.setting.repetition,
      { count: false, date: false },
      {
        set: { accuracyP: accuracy },
      }
    );

    return userStudyStateAttrUpdate(SLICE_NAME, newValue).then(() => newValue);
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
      state.setting.repetition,
      { count: false, date: false },
      {
        set: { difficultyP: difficulty },
      }
    );

    return userStudyStateAttrUpdate(SLICE_NAME, newValue).then(() => newValue);
  }
);

export const furiganaToggled = createAsyncThunk(
  `${SLICE_NAME}/furiganaToggled`,
  (uid: string, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { record: newValue } = updateSpaceRepTerm(
      uid,
      state.setting.repetition,
      { count: false, date: false },
      {
        toggle: ["f"],
      }
    );

    return userStudyStateAttrUpdate(SLICE_NAME, newValue).then(() => newValue);
  }
);

export const setPitchAccentData = createAsyncThunk(
  `${SLICE_NAME}/setPitchAccentData`,
  ({ uid, value }: { uid: string; value: true | null }, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const { record: newValue } = updateSpaceRepTerm(
      uid,
      state.setting.repetition,
      { count: false, date: false },
      {
        set: { pron: value },
      }
    );

    return userStudyStateAttrUpdate(SLICE_NAME, newValue).then(() => newValue);
  }
);

export const updateSpaceRepWord = createAsyncThunk(
  `${SLICE_NAME}/updateSpaceRepWord`,
  (arg: { uid: string; shouldIncrement?: boolean }, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.setting.repetition;

    const value = updateSpaceRepTerm(uid, spaceRep, {
      count: shouldIncrement,
      date: true,
    });

    return userStudyStateAttrUpdate(SLICE_NAME, value.record).then(() => value);
  }
);

export const setSpaceRepetitionMetadata = createAsyncThunk(
  `${SLICE_NAME}/setSpaceRepetitionMetadata`,
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.setting.repetition;
    const value = updateAction(uid, spaceRep);

    return userStudyStateAttrUpdate(SLICE_NAME, value.newValue).then(
      () => value
    );
  }
);

export const removeFromSpaceRepetition = createAsyncThunk(
  `${SLICE_NAME}/removeFromSpaceRepetition`,
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.setting.repetition;
    const newValue = removeAction(uid, spaceRep);

    if (newValue) {
      return userStudyStateAttrUpdate(SLICE_NAME, newValue).then(
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
    userStudyStateAttrUpdate(SLICE_NAME, payload).then(() => payload)
);

export const deleteMetaVocab = createAsyncThunk(
  `${SLICE_NAME}/deleteMetaVocab`,
  (uidList: string[], thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];
    const spaceRep = state.setting.repetition;

    const newValue = deleteMetadata(uidList, spaceRep);

    return userStudyStateAttrUpdate(SLICE_NAME, newValue.record).then(
      () => newValue
    );
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

    toggleVocabularyActiveGrp: (
      state,
      action: { payload: string[] | string }
    ) => {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue = grpParse(groups, activeGroup);

      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "activeGroup",
        newValue
      );

      state.setting.activeGroup = newValue;
    },

    toggleVocabularyOrdering(
      state,
      action: { payload: ValuesOf<typeof TermSortBy> }
    ) {
      const { ordered } = state.setting;
      const override = action.payload;

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

      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "ordered",
        newOrdered
      );

      state.setting.ordered = newOrdered;
    },

    toggleVocabularyBareKanji(state) {
      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "bareKanji"
      );

      state.setting.bareKanji = !state.setting.bareKanji;
    },

    toggleVocabularyHint(state) {
      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "hintEnabled"
      );

      state.setting.hintEnabled = !state.setting.hintEnabled;
    },

    setVerbFormsOrder(state, action: { payload: string[] }) {
      const order = action.payload;
      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbFormsOrder",
        order
      );

      state.setting.verbFormsOrder = order;
    },

    toggleAutoVerbView(state) {
      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "autoVerbView"
      );

      state.setting.autoVerbView = !state.setting.autoVerbView;
    },

    updateVerbColSplit(state, action: { payload: number }) {
      const split = action.payload;
      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbColSplit",
        split
      );

      state.setting.verbColSplit = split;
    },

    setMemorizedThreshold(state, action: { payload: number }) {
      const threshold = action.payload;

      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
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
        void userSettingAttrDelete("/vocabulary/", "spaRepMaxReviewItem");
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        const maxItems = Math.max(SR_MIN_REV_ITEMS, max);
        void userSettingAttrUpdate(
          { vocabulary: state.setting },
          "/vocabulary/",
          "spaRepMaxReviewItem",
          maxItems
        );

        state.setting.spaRepMaxReviewItem = maxItems;
      }
    },
    toggleIncludeNew(state) {
      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "includeNew"
      );

      state.setting.includeNew = !state.setting.includeNew;
    },
    toggleIncludeReviewed(state) {
      void userSettingAttrUpdate(
        { vocabulary: state.setting },
        "/vocabulary/",
        "includeReviewed"
      );

      state.setting.includeReviewed = !state.setting.includeReviewed;
    },
    setGoal(
      state,
      action: PayloadAction<VocabularyInitSlice["setting"]["viewGoal"]>
    ) {
      const goal = action.payload;

      if (goal !== undefined) {
        void userSettingAttrUpdate(
          { vocabulary: state.setting },
          "/vocabulary/",
          "viewGoal",
          goal
        );

        state.setting.viewGoal = goal;
      } else {
        state.setting.viewGoal = undefined;
        void userSettingAttrDelete("/vocabulary/", "viewGoal");
      }
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
    builder.addCase(flipVocabularyPracticeSide.fulfilled, (state) => {
      state.setting.englishSideUp = !state.setting.englishSideUp;
    });

    builder.addCase(setWordAccuracy.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(setWordDifficulty.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(furiganaToggled.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(setPitchAccentData.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(updateSpaceRepWord.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(setSpaceRepetitionMetadata.fulfilled, (state, action) => {
      const { newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(removeFromSpaceRepetition.fulfilled, (state, action) => {
      const newValue = action.payload;

      if (newValue) {
        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      }
    });
    builder.addCase(batchRepetitionUpdate.fulfilled, (state, action) => {
      const newValue = action.payload;

      // state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
    builder.addCase(deleteMetaVocab.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });
  },
});

export const {
  clearVocabulary,
  verbFormChanged,
  setVerbFormsOrder,
  toggleVocabularyOrdering,
  toggleVocabularyActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyHint,
  toggleIncludeNew,
  toggleIncludeReviewed,
  updateVerbColSplit,
  toggleVocabularyBareKanji,

  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  setGoal,
} = vocabularySlice.actions;
export default vocabularySlice.reducer;
