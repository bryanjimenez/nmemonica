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
  DebugLevel,
  TermFilterBy,
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { IDBStores, openIDB, putIDBItem } from "../../pwa/helper/idbHelper";
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
} from "../helper/userSettingsHelper";
import type { ValuesOf } from "../typings/utils";

import type { RootState } from ".";

export interface VocabularyInitSlice {
  value: RawVocabulary[];
  version: string;
  grpObj: GroupListMap;
  verbForm: string;

  setting: {
    ordered: ValuesOf<typeof TermSortBy>;
    englishSideUp: boolean;
    romaji: boolean;
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
    romaji: false,
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
  "vocabulary/getVocabulary",
  async () => {
    return getSheetFromIndexDB("vocabulary").then((sheet) => {
      const { data: value, hash: version } = sheetDataToJSON(sheet) as {
        data: Record<string, Vocabulary>;
        hash: string;
      };

      return { value, version };
    });
  }
);

export const vocabularySettingsFromAppStorage = createAsyncThunk(
  "vocabulary/vocabularySettingsFromAppStorage",
  (arg: (typeof vocabularyInitState)["setting"]) => {
    const initValues = arg;

    return initValues;
  }
);

export const deleteMetaVocab = createAsyncThunk(
  "vocabulary/deleteMetaVocab",
  (uidList: string[], thunkAPI) => {
    const state = (thunkAPI.getState() as RootState).vocabulary;
    const spaceRep = state.setting.repetition;

    return deleteMetadata(uidList, spaceRep);
  }
);

export const updateSpaceRepWord = createAsyncThunk(
  "vocabulary/updateSpaceRepWord",
  (arg: { uid: string; shouldIncrement?: boolean }, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = (thunkAPI.getState() as RootState).vocabulary;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(uid, spaceRep, {
      count: shouldIncrement,
      date: true,
    });
  }
);

export const removeFromSpaceRepetition = createAsyncThunk(
  "vocabulary/removeFromSpaceRepetition",
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState).vocabulary;

    const spaceRep = state.setting.repetition;
    return removeAction(uid, spaceRep);
  }
);

export const setSpaceRepetitionMetadata = createAsyncThunk(
  "vocabulary/setSpaceRepetitionMetadata",
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState).vocabulary;

    const spaceRep = state.setting.repetition;
    return updateAction(uid, spaceRep);
  }
);

export const toggleVocabularyTag = createAsyncThunk(
  "vocabulary/toggleVocabularyTag",
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
  "vocabulary/getVocabularyTags",
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
  "vocabulary/flipVocabularyPracticeSide",
  (_arg, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState).vocabulary;

    return userSettingAttrUpdate(
      new Date(),
      { vocabulary: state.setting },
      "/vocabulary/",
      "englishSideUp"
    );
  }
);

const vocabularySlice = createSlice({
  name: "vocabulary",
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
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "activeGroup",
        newValue
      );

      state.setting.activeGroup = newValue;
    },

    furiganaToggled(state, action: { payload: string }) {
      const uid = action.payload;

      const { record: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        { count: false, date: false },
        {
          toggle: ["f"],
        }
      );

      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    },

    setPitchAccentData(
      state,
      action: { payload: { uid: string; value: true | null } }
    ) {
      const { uid, value } = action.payload;

      const { record: newValue } = updateSpaceRepTerm(
        uid,
        state.setting.repetition,
        { count: false, date: false },
        {
          set: { pron: value },
        }
      );

      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
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
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "ordered",
        newOrdered
      );

      state.setting.ordered = newOrdered;
    },

    toggleVocabularyRomaji(state) {
      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "romaji"
      );

      state.setting.romaji = !state.setting.romaji;
    },

    toggleVocabularyBareKanji(state) {
      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "bareKanji"
      );

      state.setting.bareKanji = !state.setting.bareKanji;
    },

    toggleVocabularyHint(state) {
      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "hintEnabled"
      );

      state.setting.hintEnabled = !state.setting.hintEnabled;
    },

    setVerbFormsOrder(state, action: { payload: string[] }) {
      const order = action.payload;
      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbFormsOrder",
        order
      );

      state.setting.verbFormsOrder = order;
    },

    toggleAutoVerbView(state) {
      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "autoVerbView"
      );

      state.setting.autoVerbView = !state.setting.autoVerbView;
    },

    updateVerbColSplit(state, action: { payload: number }) {
      const split = action.payload;
      void userSettingAttrUpdate(
        new Date(),
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
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "difficultyThreshold",
        threshold
      );

      state.setting.difficultyThreshold = threshold;
    },

    setWordDifficulty: {
      reducer: (
        state: VocabularyInitSlice,
        action: PayloadAction<{ uid: string; value: null | number }>
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
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      },
      prepare: (uid: string, value: null | number) => ({
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
        "/vocabulary/",
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
          "/vocabulary/",
          "spaRepMaxReviewItem"
        );
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        const maxItems = Math.max(SR_MIN_REV_ITEMS, max);
        void userSettingAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "spaRepMaxReviewItem",
          maxItems
        );

        state.setting.spaRepMaxReviewItem = maxItems;
      }
    },
    setWordAccuracy: {
      reducer: (
        state: VocabularyInitSlice,
        action: PayloadAction<{ uid: string; value: null | number }>
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
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      },
      prepare: (uid: string, value: null | number) => ({
        payload: { uid, value },
      }),
    },
    toggleIncludeNew(state) {
      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "includeNew"
      );

      state.setting.includeNew = !state.setting.includeNew;
    },
    toggleIncludeReviewed(state) {
      void userSettingAttrUpdate(
        new Date(),
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
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "viewGoal",
          goal
        );

        state.setting.viewGoal = goal;
      } else {
        state.setting.viewGoal = undefined;
        void userSettingAttrDelete(new Date(), "/vocabulary/", "viewGoal");
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

    builder.addCase(updateSpaceRepWord.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
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
        { vocabulary: state.setting },
        "/vocabulary/",
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
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      }
    });

    builder.addCase(deleteMetaVocab.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });

    builder.addCase(flipVocabularyPracticeSide.fulfilled, (state) => {
      state.setting.englishSideUp = !state.setting.englishSideUp;
    });
  },
});

export const {
  clearVocabulary,
  verbFormChanged,
  furiganaToggled,
  setPitchAccentData,
  setVerbFormsOrder,
  toggleVocabularyOrdering,
  toggleVocabularyActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyHint,
  toggleVocabularyRomaji,
  toggleIncludeNew,
  toggleIncludeReviewed,
  updateVerbColSplit,
  toggleVocabularyBareKanji,

  setWordDifficulty,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  setWordAccuracy,
  setGoal,
  batchRepetitionUpdate,
} = vocabularySlice.actions;
export default vocabularySlice.reducer;
