import {
  type PayloadAction,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import type {
  GroupListMap,
  MetaDataObj,
  RawVocabulary,
  SourceVocabulary,
} from "nmemonica";

import {
  TermFilterBy,
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { dataServiceEndpoint } from "../../environment.production";
import { getVerbFormsArray } from "../helper/JapaneseVerb";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import {
  SR_MIN_REV_ITEMS,
  removeAction,
  updateAction,
} from "../helper/recallHelper";
import {
  buildGroupObject,
  buildVocabularyArray,
} from "../helper/reducerHelper";
import { SWRequestHeader } from "../helper/serviceWorkerHelper";
import { MEMORIZED_THRLD } from "../helper/sortHelper";
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
    reinforce: boolean;
    repTID: number;
    repetition: Record<string, MetaDataObj | undefined>;
    spaRepMaxReviewItem: number;
    activeGroup: string[];
    autoVerbView: boolean;
    verbColSplit: number;
    verbFormsOrder: string[];
    includeNew: boolean;
    includeReviewed: boolean;
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
    spaRepMaxReviewItem: SR_MIN_REV_ITEMS,
    activeGroup: [],
    autoVerbView: false,
    verbColSplit: 0,
    verbFormsOrder: getVerbFormsArray().map((f) => f.name),
    includeNew: true,
    includeReviewed: true,
  },
};

/**
 * Fetch vocabulary
 */
export const getVocabulary = createAsyncThunk(
  "vocabulary/getVocabulary",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const version = state.version.vocabulary ?? "0";

    // if (version === "0") {
    //   console.error("fetching vocabulary: 0");
    // }
    const value = (await fetch(dataServiceEndpoint + "/vocabulary.json", {
      headers: { [SWRequestHeader.DATA_VERSION]: version },
    }).then((res) => res.json())) as Record<string, SourceVocabulary>;

    return { value, version };
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
        TermSortBy.GAME,
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
    setWordTPCorrect: {
      reducer: (
        state: VocabularyInitSlice,
        action: PayloadAction<{
          uid: string;
          tpElapsed: number;
          pronunciation?: boolean;
        }>
      ) => {
        const { uid, tpElapsed, pronunciation } = action.payload;

        const spaceRep = state.setting.repetition;

        let newPlayCount = 1;
        let newAccuracy = 1.0;
        let newCorrAvg = tpElapsed;

        const uidData = spaceRep[uid];
        if (uidData !== undefined) {
          const playCount = uidData.tpPc;
          const accuracy = uidData.tpAcc;
          const correctAvg = uidData.tpCAvg ?? 0;

          if (playCount !== undefined && accuracy !== undefined) {
            newPlayCount = playCount + 1;

            const scores = playCount * accuracy;
            newAccuracy = (scores + 1.0) / newPlayCount;

            const correctCount = scores;
            const correctSum = correctAvg * correctCount;
            newCorrAvg = (correctSum + tpElapsed) / (correctCount + 1);
          }
        }

        const prevMisPron = pronunciation === true || (uidData?.pron ?? false);
        const o: MetaDataObj = {
          ...(spaceRep[uid] ?? { lastView: new Date().toJSON(), vC: 1 }),
          pron: prevMisPron || undefined,
          tpPc: newPlayCount,
          tpAcc: newAccuracy,
          tpCAvg: newCorrAvg,
        };

        const newValue = { ...spaceRep, [uid]: o };
        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      },
      prepare: (
        uid: string,
        tpElapsed: number,
        { pronunciation }: { pronunciation?: boolean } | undefined = {}
      ) => ({
        type: "string",
        payload: { uid, tpElapsed, pronunciation },
      }),
    },
    setWordTPIncorrect: {
      reducer: (
        state: VocabularyInitSlice,
        action: PayloadAction<{ uid: string; pronunciation?: boolean }>
      ) => {
        const { uid, pronunciation } = action.payload;

        const spaceRep = state.setting.repetition;

        let newPlayCount = 1;
        let newAccuracy = 0;

        const uidData = spaceRep[uid];
        if (uidData !== undefined) {
          const playCount = uidData.tpPc;
          const accuracy = uidData.tpAcc;

          if (playCount !== undefined && accuracy !== undefined) {
            newPlayCount = playCount + 1;

            const scores = playCount * accuracy;
            newAccuracy = (scores + 0) / newPlayCount;
          }
        }

        const o: MetaDataObj = {
          ...(spaceRep[uid] ?? { lastView: new Date().toJSON(), vC: 1 }),
          tpPc: newPlayCount,
          tpAcc: newAccuracy,
          pron: pronunciation === true ? true : undefined,
        };

        const newValue = { ...spaceRep, [uid]: o };
        state.setting.repTID = Date.now();
        state.setting.repetition = localStoreAttrUpdate(
          new Date(),
          { vocabulary: state.setting },
          "/vocabulary/",
          "repetition",
          newValue
        );
      },
      prepare: (
        uid: string,
        { pronunciation }: { pronunciation?: boolean } | undefined = {}
      ) => ({
        payload: { uid, pronunciation },
      }),
    },
    /**
     * Space Repetition maximum item review
     * per session
     */
    setSpaRepMaxItemReview(state, action: PayloadAction<number>) {
      const value = Math.max(SR_MIN_REV_ITEMS, action.payload);

      state.setting.spaRepMaxReviewItem = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "spaRepMaxReviewItem",
        value
      );
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
  setWordTPCorrect,
  setWordTPIncorrect,
  setSpaRepMaxItemReview,
  setWordAccuracy,
} = vocabularySlice.actions;
export default vocabularySlice.reducer;
