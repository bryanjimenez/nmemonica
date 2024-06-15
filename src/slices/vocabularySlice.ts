import { SheetData } from "@nmemonica/x-spreadsheet";
import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import type { GroupListMap, MetaDataObj, RawVocabulary } from "nmemonica";

import {
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
  localStoreAttrDelete,
  localStoreAttrUpdate,
} from "../helper/localStorageHelper";
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
  getWorkbookFromIndexDB,
  workbookSheetNames,
} from "../helper/sheetHelper";
import { findInColumn, findInRow } from "../helper/sheetHelper";
import { SWRequestHeader } from "../helper/serviceWorkerHelper";
import { getTagsFromSheet, setTagsFromSheet } from "../helper/sheetHelper";
import { MEMORIZED_THRLD } from "../helper/sortHelper";
import type { ValuesOf } from "../typings/utils";

import type { AppDispatch, RootState } from ".";

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
    reinforce: boolean;
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
    reinforce: false,
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
    return getWorkbookFromIndexDB().then((workbook) => {
      const sheet = workbook.find(
        (s) =>
          s.name.toLowerCase() ===
          workbookSheetNames.vocabulary.prettyName.toLowerCase()
      );
      if (sheet === undefined) {
        throw new Error("Expected to find Vocabulary sheet in workbook");
      }
      const { data: value, hash: version } = sheetDataToJSON(sheet) as {
        data: Record<string, Vocabulary>;
        hash: string;
      };

      return { value, version };
    });
  }
);

export const vocabularyFromLocalStorage = createAsyncThunk(
  "vocabulary/vocabularyFromLocalStorage",
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

    return getWorkbookFromIndexDB().then(
      (sheetArr: SheetData[]) => {
        // Get current tags for term
        const vIdx = sheetArr.findIndex(
          (s) => s.name.toLowerCase() === sheetName.toLowerCase()
        );
        if (vIdx === -1) {
          throw new Error(`Expected to find ${sheetName} sheet`);
        }
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
  (arg: { query: string }) => {
    const { query } = arg;
    const sheetName = workbookSheetNames.vocabulary.prettyName;

    return getWorkbookFromIndexDB().then(
      (sheetArr: SheetData[]) => {
        // Get current tags for term
        const vIdx = sheetArr.findIndex(
          (s) => s.name.toLowerCase() === sheetName.toLowerCase()
        );
        if (vIdx === -1) {
          throw new Error(`Expected to find ${sheetName} sheet`);
        }
        const s = { ...sheetArr[vIdx] };

        return getTagsFromSheet(s, query);
      }
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

      state.setting.activeGroup = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "activeGroup",
        newValue
      );
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

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );
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

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );
    },

    toggleVocabularyReinforcement(
      state,
      action: { payload: boolean | undefined }
    ) {
      const newValue = action.payload;

      state.setting.reinforce = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "reinforce",
        newValue
      );
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

      state.setting.ordered = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "ordered",
        newOrdered
      );
    },

    flipVocabularyPracticeSide(state) {
      state.setting.englishSideUp = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "englishSideUp"
      );
    },

    toggleVocabularyRomaji(state) {
      state.setting.romaji = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "romaji"
      );
    },

    toggleVocabularyBareKanji(state) {
      state.setting.bareKanji = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "bareKanji"
      );
    },

    toggleVocabularyHint(state) {
      state.setting.hintEnabled = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "hintEnabled"
      );
    },

    toggleVocabularyFilter(
      state,
      action: { payload: ValuesOf<typeof TermFilterBy> }
    ) {
      const allowed: number[] = [TermFilterBy.FREQUENCY, TermFilterBy.GROUP];

      const override = action.payload;
      const { filter, reinforce } = state.setting;

      const newFilter = toggleAFilter(
        filter + 1,
        allowed,
        override
      ) as ValuesOf<typeof TermFilterBy>;

      state.setting.filter = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "filter",
        newFilter
      );

      if (newFilter !== 0 && reinforce) {
        state.setting.reinforce = false;
      }
    },

    setVerbFormsOrder(state, action: { payload: string[] }) {
      const order = action.payload;
      state.setting.verbFormsOrder = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbFormsOrder",
        order
      );
    },

    toggleAutoVerbView(state) {
      state.setting.autoVerbView = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "autoVerbView"
      );
    },

    updateVerbColSplit(state, action: { payload: number }) {
      const split = action.payload;
      state.setting.verbColSplit = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbColSplit",
        split
      );
    },

    addFrequencyWord(state, action: { payload: string }) {
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
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );
    },

    removeFrequencyWord(state, action: { payload: string }) {
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

        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      }
    },

    setMemorizedThreshold(state, action: { payload: number }) {
      const threshold = action.payload;

      state.setting.difficultyThreshold = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "difficultyThreshold",
        threshold
      );
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

        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      },
      prepare: (uid: string, value: null | number) => ({
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
        "/vocabulary/",
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
        localStoreAttrDelete(new Date(), "/vocabulary/", "spaRepMaxReviewItem");
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        state.setting.spaRepMaxReviewItem = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "spaRepMaxReviewItem",
          Math.max(SR_MIN_REV_ITEMS, max)
        );
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

        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      },
      prepare: (uid: string, value: null | number) => ({
        payload: { uid, value },
      }),
    },
    toggleIncludeNew(state) {
      state.setting.includeNew = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "includeNew"
      );
    },
    toggleIncludeReviewed(state) {
      state.setting.includeReviewed = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "includeReviewed"
      );
    },
    setGoal(
      state,
      action: PayloadAction<VocabularyInitSlice["setting"]["viewGoal"]>
    ) {
      const goal = action.payload;

      if (goal !== undefined) {
        state.setting.viewGoal = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "viewGoal",
          goal
        );
      } else {
        state.setting.viewGoal = undefined;
        localStoreAttrDelete(new Date(), "/vocabulary/", "viewGoal");
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(vocabularyFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(
        vocabularyInitState.setting,
        localStorageValue
      );

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });

    builder.addCase(getVocabulary.fulfilled, (state, action) => {
      const { value, version } = action.payload;
      state.grpObj = buildGroupObject(value);
      state.value = buildVocabularyArray(value);
      state.version = version;
    });

    builder.addCase(updateSpaceRepWord.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );
    });

    builder.addCase(setSpaceRepetitionMetadata.fulfilled, (state, action) => {
      const { newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
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
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      }
    });

    builder.addCase(deleteMetaVocab.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.setting.repTID = Date.now();
      state.setting.repetition = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );
    });
  },
});

export const {
  clearVocabulary,
  verbFormChanged,
  furiganaToggled,
  setPitchAccentData,
  removeFrequencyWord,
  setVerbFormsOrder,
  toggleVocabularyOrdering,
  toggleVocabularyActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  toggleIncludeNew,
  toggleIncludeReviewed,
  updateVerbColSplit,
  toggleVocabularyBareKanji,
  flipVocabularyPracticeSide,
  addFrequencyWord,

  setWordDifficulty,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  setWordAccuracy,
  setGoal,
  batchRepetitionUpdate,
} = vocabularySlice.actions;
export default vocabularySlice.reducer;
