import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import { firebaseConfig } from "../../environment.development";
import { MEMORIZED_THRLD, getVerbFormsArray } from "../helper/gameHelper";
import { localStoreAttrUpdate } from "../helper/localStorageHelper";
import {
  buildGroupObject,
  buildVocabularyObject,
} from "../helper/reducerHelper";
import {
  TermFilterBy,
  TermSortBy,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import type { RawVocabulary,SpaceRepetitionMap } from "../typings/raw";

/**
 * Fetch vocabulary
 */
export const getVocabulary = createAsyncThunk(
  "vocabulary/getVocabulary",
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState
    const version = state.version.vocabulary || "0";

    if (version === "0") {
      console.error("fetching vocabulary: 0");
    }
    return fetch(firebaseConfig.databaseURL + "/lambda/vocabulary.json", {
      headers: { "Data-Version": version },
    }).then((res) => res.json().then((value) => ({ value, version })));
  }
);

export const updateSpaceRepWord = createAsyncThunk(
  "vocabulary/updateSpaceRepWord",
  async (arg:{uid:string, shouldIncrement?:boolean}, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state =  (thunkAPI.getState() as RootState).vocabulary;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(uid, spaceRep, {
      count: shouldIncrement,
      date: true,
    });
  }
);

export const vocabularyFromLocalStorage = createAsyncThunk(
  "vocabulary/vocabularyFromLocalStorage",
  async (arg:typeof initialState['setting']) => {
    const initValues = arg;

    return initValues;
  }
);

export interface VocabularyIniSt {
  value: RawVocabulary[];
  version: string,
  grpObj: {},
  verbForm: string,

  setting: {
    ordered: typeof TermSortBy[keyof typeof TermSortBy]
    practiceSide: boolean,
    romaji: boolean,
    bareKanji: boolean,
    hintEnabled: boolean,
    filter: typeof TermFilterBy[keyof typeof TermFilterBy];
    memoThreshold: number,
    reinforce: boolean,
    repTID: number;
    repetition: SpaceRepetitionMap,
    activeGroup: string[],
    autoVerbView: boolean,
    verbColSplit: number,
    verbFormsOrder: string[],
  },
}
export const initialState:VocabularyIniSt = {
  value: [],
  version: "",
  grpObj: {},
  verbForm: "dictionary",

  setting: {
    ordered: 0,
    practiceSide: false,
    romaji: false,
    bareKanji: false,
    hintEnabled: false,
    filter: 0,
    memoThreshold: MEMORIZED_THRLD,
    reinforce: false,
    repTID: -1,
    repetition: {},
    activeGroup: [],
    autoVerbView: false,
    verbColSplit: 0,
    verbFormsOrder: getVerbFormsArray().map((f) => f.name),
  },
};

const vocabularySlice = createSlice({
  name: "vocabulary",
  initialState,
  reducers: {
    /**
     * @param {typeof initialState} state
     * @param {{payload: string}} action
     */
    verbFormChanged(state, action) {
      return {
        ...state,
        verbForm: action.payload,
      };
    },

    toggleVocabularyActiveGrp: (state, action) => {
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

    /**
     * @param {typeof initialState} state
     * @param {{payload: string}} action
     */
    furiganaToggled(state, action) {
      const uid = action.payload;

      const { value: newValue } = updateSpaceRepTerm(
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

    toggleVocabularyReinforcement(state) {
      state.setting.reinforce = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "reinforce"
      );
    },

    toggleVocabularyOrdering(state, action) {
      const { ordered } = state.setting;
      const override = action.payload;

      const allowed = [
        TermSortBy.ALPHABETIC,
        TermSortBy.DIFFICULTY,
        TermSortBy.GAME,
        TermSortBy.RANDOM,
        TermSortBy.VIEW_DATE,
      ];
      const newOrdered = toggleAFilter(ordered + 1, allowed, override) as typeof TermSortBy[keyof typeof TermSortBy];

      state.setting.ordered = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "ordered",
        newOrdered
      );
    },

    flipVocabularyPracticeSide(state) {
      state.setting.practiceSide = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "practiceSide"
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

    toggleVocabularyFilter(state, action) {
      const allowed:number[] = [
        TermFilterBy.FREQUENCY,
        TermFilterBy.GROUP,
      ];

      const override = action.payload;
      const { filter, reinforce } = state.setting;

      const newFilter = 
        toggleAFilter(filter + 1, allowed, override) as typeof TermFilterBy[keyof typeof TermFilterBy]
      

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

    /**
     * @param {typeof initialState} state
     * @param {{payload: string[]}} action
     */
    setVerbFormsOrder(state, action) {
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

    /**
     * @param {typeof initialState} state
     * @param {{payload: number}} action
     */
    updateVerbColSplit(state, action) {
      const split = action.payload;
      state.setting.verbColSplit = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "verbColSplit",
        split
      );
    },

    /**
     * @param {typeof initialState} state
     * @param {{payload: string}} action
     */
    addFrequencyWord(state, action) {
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
        { vocabulary: state.setting },
        "/vocabulary/",
        "repetition",
        newValue
      );
    },

    removeFrequencyWord(state, action) {
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

    /**
     * Filter vocabulary excluding terms with value above
     * @param {typeof initialState} state
     * @param {{payload: number}} action
     */
    setMemorizedThreshold(state, action) {
      const threshold = action.payload;

      state.setting.memoThreshold = localStoreAttrUpdate(
        new Date(),
        { vocabulary: state.setting },
        "/vocabulary/",
        "memoThreshold",
        threshold
      );
    },

    setWordDifficulty: {
      reducer:
        (state:VocabularyIniSt, action:{payload: {uid: string, value: number}}) => {
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
            { vocabulary: state.setting },
            "/vocabulary/",
            "repetition",
            newValue
          );
        },
      prepare:
        (uid, value) => ({ payload: { uid, value } }),
    },
    setWordTPCorrect: {
      reducer:
        (state:VocabularyIniSt, action:{payload: {uid:string, tpElapsed:number, pronunciation:boolean}}) => {
          const { uid, tpElapsed, pronunciation } = action.payload;

          const spaceRep = state.setting.repetition;

          let newPlayCount = 1;
          let newAccuracy = 1.0;
          let newCorrAvg = tpElapsed;

          if (spaceRep[uid]) {
            const playCount = spaceRep[uid].tpPc;
            const accuracy = spaceRep[uid].tpAcc;
            const correctAvg = spaceRep[uid].tpCAvg || 0;

            if (playCount !== undefined && accuracy != undefined) {
              newPlayCount = playCount + 1;

              const scores = playCount * accuracy;
              newAccuracy = (scores + 1.0) / newPlayCount;

              const correctCount = scores;
              const correctSum = correctAvg * correctCount;
              newCorrAvg = (correctSum + tpElapsed) / (correctCount + 1);
            }
          }

          const o = {
            ...(spaceRep[uid] || {}),
            pron:
              pronunciation === null || spaceRep[uid] === undefined
                ? undefined
                : spaceRep[uid].pron,
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
      prepare:
        (uid, tpElapsed, { pronunciation } = {}) => ({
          payload: { uid, tpElapsed, pronunciation },
        }),
    },
    setWordTPIncorrect: {
      reducer:
        (state:VocabularyIniSt, action:{payload: {uid:string, pronunciation:boolean}}) => {
          const { uid, pronunciation } = action.payload;

          const spaceRep = state.setting.repetition;

          let newPlayCount = 1;
          let newAccuracy = 0;

          if (spaceRep[uid]) {
            const playCount = spaceRep[uid].tpPc;
            const accuracy = spaceRep[uid].tpAcc;

            if (playCount !== undefined && accuracy != undefined) {
              newPlayCount = playCount + 1;

              const scores = playCount * accuracy;
              newAccuracy = (scores + 0) / newPlayCount;
            }
          }

          const o = {
            ...(spaceRep[uid] || {}),
            tpPc: newPlayCount,
            tpAcc: newAccuracy,
            pron: 
              pronunciation === true ? true : undefined
            ,
          };

          const newValue = { ...spaceRep, [uid]: o } as SpaceRepetitionMap;
          state.setting.repTID = Date.now();
          state.setting.repetition = localStoreAttrUpdate(
            new Date(),
            { vocabulary: state.setting },
            "/vocabulary/",
            "repetition",
            newValue
          );
        },
      prepare:
        /**
         * @param {string} uid
         * @param {unknown} param1
         */
        (uid, { pronunciation } = {}) => ({
          payload: { uid, pronunciation },
        }),
    },
  },

  extraReducers: (builder) => {
    builder.addCase(vocabularyFromLocalStorage.fulfilled, (state, action) => {
      const localStorageValue = action.payload;
      const mergedSettings = merge(initialState.setting, localStorageValue);

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });

    builder.addCase(getVocabulary.fulfilled, (state, action) => {
      const { value, version } = action.payload;
      state.grpObj = buildGroupObject(value);
      state.value = buildVocabularyObject(value);
      state.version = version;
    });

    builder.addCase(updateSpaceRepWord.fulfilled, (state, action) => {
      const { value: newValue } = action.payload;

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
  updateVerbColSplit,
  toggleVocabularyBareKanji,
  flipVocabularyPracticeSide,
  addFrequencyWord,

  setWordDifficulty,
  setMemorizedThreshold,
  setWordTPCorrect,
  setWordTPIncorrect,
} = vocabularySlice.actions;
export default vocabularySlice.reducer;
