import { SheetData } from "@nmemonica/x-spreadsheet";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import type {
  GroupListMap,
  MetaDataObj,
  RawPhrase,
  SourcePhrase,
} from "nmemonica";

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
import { sheetDataToJSON } from "../helper/jsonHelper";
import {
  SR_MIN_REV_ITEMS,
  removeAction,
  updateAction,
} from "../helper/recallHelper";
import { buildGroupObject, getPropsFromTags } from "../helper/reducerHelper";
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

export interface PhraseInitSlice {
  value: RawPhrase[];
  version: string;
  grpObj: GroupListMap;

  setting: {
    ordered: ValuesOf<typeof TermSortBy>;
    englishSideUp: boolean;
    romaji: boolean;
    reinforce: boolean;
    repTID: number;
    repetition: Record<string, MetaDataObj | undefined>;
    spaRepMaxReviewItem?: number;
    frequency: { uid?: string; count: number };
    activeGroup: string[];
    filter: ValuesOf<typeof TermFilterBy>;
    difficultyThreshold: number;
    includeNew: boolean;
    includeReviewed: boolean;

    viewGoal?: number;
  };
}

export const phraseInitState: PhraseInitSlice = {
  value: [],
  version: "",
  grpObj: {},

  setting: {
    ordered: 0,
    englishSideUp: false,
    romaji: false,
    reinforce: false,
    repTID: -1,
    repetition: {},
    spaRepMaxReviewItem: undefined,
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    filter: 0,
    difficultyThreshold: MEMORIZED_THRLD,
    includeNew: true,
    includeReviewed: true,

    viewGoal: undefined,
  },
};

/**
 * For inverse tagged phrases
 * Checks that an initial uid has atleast one pair
 */
function inversePairCheck<T extends { japanese: string; tag?: string }>(
  initial: string,
  object: Record<string, T>
) {
  let errors;

  let { inverse } = getPropsFromTags(object[initial].tag);
  let inversePair = inverse;

  while (inversePair !== undefined && inversePair !== initial) {
    const { inverse } = getPropsFromTags(object[inversePair]?.tag);

    if (inverse !== undefined) {
      inversePair = inverse;
    } else {
      // match failed
      inversePair = undefined;
      errors = [
        ...(errors ?? []),
        `Missing inverse pair for ${object[initial].japanese}`,
      ];
    }
  }

  return errors;
}

export function buildPhraseArray<T extends SourcePhrase>(
  object: Record<string, T>
): { values: RawPhrase[]; errors?: string[] } {
  let errors: undefined | string[];
  const values = Object.keys(object).map((k) => {
    const iPhrase = object[k];
    let { tags, particles, inverse, polite } = getPropsFromTags(iPhrase.tag);

    errors = inversePairCheck(k, object);

    return {
      ...iPhrase,
      uid: k,

      // Keep raw metadata
      tag:
        iPhrase.tag !== undefined
          ? (JSON.parse(iPhrase.tag) as Record<string, string[]>)
          : undefined,

      // Derived from tag
      tags,
      particles,
      inverse,
      polite,
    };
  });

  return { values, errors };
}

/**
 * Fetch phrases
 */
export const getPhrase = createAsyncThunk(
  "phrase/getPhrase",
  async (_arg, thunkAPI) => {
    // TODO: rename state.phrases -> state.phrase
    return getSheetFromIndexDB("phrases").then((sheet) => {
      const { data: jsonValue, hash: version } = sheetDataToJSON(sheet) as {
        data: Record<string, SourcePhrase>;
        hash: string;
      };

      const groups = buildGroupObject(jsonValue);
      const { values, errors } = buildPhraseArray(jsonValue);
      if (errors) {
        errors.forEach((e) => {
          thunkAPI.dispatch(logger(e, DebugLevel.WARN));
        });
      }

      return { version, value: jsonValue, values, groups };
    });
  }
);

export const phraseSettingsFromAppStorage = createAsyncThunk(
  "phrase/phraseSettingsFromAppStorage",
  (arg: typeof phraseInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

export const deleteMetaPhrase = createAsyncThunk(
  "phrase/deleteMetaPhrase",
  (uidList: string[], thunkAPI) => {
    const state = (thunkAPI.getState() as RootState).phrases;
    const spaceRep = state.setting.repetition;

    return deleteMetadata(uidList, spaceRep);
  }
);

export const updateSpaceRepPhrase = createAsyncThunk(
  "phrase/updateSpaceRepPhrase",
  (arg: { uid: string; shouldIncrement: boolean }, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = (thunkAPI.getState() as RootState).phrases;

    const spaceRep = state.setting.repetition;

    return updateSpaceRepTerm(uid, spaceRep, {
      count: shouldIncrement,
      date: true,
    });
  }
);

export const removeFromSpaceRepetition = createAsyncThunk(
  "phrase/removeFromSpaceRepetition",
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState).phrases;

    const spaceRep = state.setting.repetition;
    return removeAction(uid, spaceRep);
  }
);

export const setSpaceRepetitionMetadata = createAsyncThunk(
  "phrase/setSpaceRepetitionMetadata",
  (arg: { uid: string }, thunkAPI) => {
    const { uid } = arg;
    const state = (thunkAPI.getState() as RootState).phrases;

    const spaceRep = state.setting.repetition;
    return updateAction(uid, spaceRep);
  }
);

export const togglePhraseTag = createAsyncThunk(
  "phrase/togglePhraseTag",
  (arg: { query: string; tag: string }, _thunkAPI) => {
    const { query, tag } = arg;
    // const dispatch = thunkAPI.dispatch as AppDispatch;
    const sheetName = workbookSheetNames.phrases.prettyName;

    return getWorkbookFromIndexDB(["phrases"]).then((sheetArr: SheetData[]) => {
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
          // TODO: update state
          // wb.forEach(s=>{
          //   refreshAfterUpdate(dispatch,s.name)
          // })
        });
    });
  }
);

export const getPhraseTags = createAsyncThunk(
  "phrase/getPhraseTags",
  (arg: { query: string }, thunkAPI) => {
    const { query } = arg;
    const sheetName = workbookSheetNames.phrases.prettyName;

    return getWorkbookFromIndexDB(["phrases"])
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

export const flipPhrasesPracticeSide = createAsyncThunk(
  "phrase/flipPhrasesPracticeSide",
  (arg: { query: string }, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState).phrases;

    return userSettingAttrUpdate(
      new Date(),
      { phrases: state.setting },
      "/phrases/",
      "englishSideUp"
    );
  }
);

const phraseSlice = createSlice({
  name: "phrase",
  initialState: phraseInitState,
  reducers: {
    clearPhrases(state) {
      state.value = phraseInitState.value;
      state.version = phraseInitState.version;
      state.grpObj = phraseInitState.grpObj;
    },
    /**
     * Toggle between group, frequency, and tags filtering
     */
    togglePhrasesFilter(
      state,
      action: { payload?: ValuesOf<typeof TermFilterBy> }
    ) {
      const override = action.payload;

      const allowed = [TermFilterBy.FREQUENCY, TermFilterBy.GROUP];

      const { filter, reinforce } = state.setting;

      const newFilter = toggleAFilter(
        filter + 1,
        allowed,
        override
      ) as ValuesOf<typeof TermFilterBy>;

      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "filter",
        newFilter
      );

      state.setting.filter = newFilter;

      if (newFilter !== TermFilterBy.GROUP && reinforce) {
        state.setting.reinforce = false;
      }
    },

    togglePhraseActiveGrp(state, action: { payload: string }) {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue: string[] = grpParse(groups, activeGroup);

      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "activeGroup",
        newValue
      );

      state.setting.activeGroup = newValue;
    },
    togglePhrasesReinforcement(
      state,
      action: { payload: boolean | undefined }
    ) {
      const newValue = action.payload ?? false;

      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "reinforce",
        newValue
      );

      state.setting.reinforce = newValue;
    },

    setMemorizedThreshold(state, action: { payload: number }) {
      const threshold = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "difficultyThreshold",
        threshold
      );

      state.setting.difficultyThreshold = threshold;
    },

    setPhraseDifficulty: {
      reducer: (
        state: PhraseInitSlice,
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
          { phrases: state.setting },
          "/phrases/",
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
        "/phrases/",
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
          "/phrases/",
          "spaRepMaxReviewItem"
        );
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        const maxItems = Math.max(SR_MIN_REV_ITEMS, max);
        void userSettingAttrUpdate(
          new Date(),
          { phrases: state.setting },
          "/phrases/",
          "spaRepMaxReviewItem",
          maxItems
        );

        state.setting.spaRepMaxReviewItem = maxItems;
      }
    },
    setPhraseAccuracy: {
      reducer: (
        state: PhraseInitSlice,
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
          { phrases: state.setting },
          "/phrases/",
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

    addFrequencyPhrase(state, action: PayloadAction<string>) {
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
        { phrases: state.setting },
        "/phrases/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;

      let frequency = { uid, count: state.setting.frequency.count + 1 };
      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "frequency",
        frequency
      );

      state.setting.frequency = frequency;
    },

    removeFrequencyPhrase(state, action: { payload: string }) {
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
          { phrases: state.setting },
          "/phrases/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;

        let frequency = { uid, count: state.setting.frequency.count - 1 };
        void userSettingAttrUpdate(
          new Date(),
          { phrases: state.setting },
          "/phrases/",
          "frequency",
          frequency
        );

        state.setting.frequency = frequency;
      }
    },

    togglePhrasesRomaji(state) {
      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "romaji"
      );

      state.setting.romaji = !state.setting.romaji;
    },

    togglePhrasesOrdering(
      state,
      action: PayloadAction<ValuesOf<typeof TermSortBy>>
    ) {
      const allowed = [
        TermSortBy.RANDOM,
        TermSortBy.VIEW_DATE,
        TermSortBy.RECALL,
      ];
      const override = action.payload;

      const { ordered } = state.setting;

      let newOrdered = toggleAFilter(
        ordered + 1,
        allowed,
        override
      ) as ValuesOf<typeof TermSortBy>;

      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "ordered",
        newOrdered
      );

      state.setting.ordered = newOrdered;
    },
    toggleIncludeNew(state) {
      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "includeNew"
      );

      state.setting.includeNew = !state.setting.includeNew;
    },
    toggleIncludeReviewed(state) {
      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "includeReviewed"
      );

      state.setting.includeReviewed = !state.setting.includeReviewed;
    },

    setGoal(
      state,
      action: PayloadAction<PhraseInitSlice["setting"]["viewGoal"]>
    ) {
      const goal = action.payload;

      if (goal !== undefined) {
        void userSettingAttrUpdate(
          new Date(),
          { phrases: state.setting },
          "/phrases/",
          "viewGoal",
          goal
        );

        state.setting.viewGoal = goal;
      } else {
        state.setting.viewGoal = undefined;
        void userSettingAttrDelete(new Date(), "/phrases/", "viewGoal");
      }
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getPhrase.fulfilled, (state, action) => {
      const { version, values, groups } = action.payload;
      state.grpObj = groups;
      state.value = values;
      state.version = version;
    });

    builder.addCase(phraseSettingsFromAppStorage.fulfilled, (state, action) => {
      const storedValue = action.payload;
      const mergedSettings = merge(phraseInitState.setting, storedValue);

      const phraseReinforceList = Object.keys(mergedSettings.repetition).filter(
        (k) => mergedSettings.repetition[k]?.rein === true
      );
      mergedSettings.frequency = {
        uid: undefined,
        count: phraseReinforceList.length,
      };

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });
    builder.addCase(updateSpaceRepPhrase.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
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
        { phrases: state.setting },
        "/phrases/",
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
          { phrases: state.setting },
          "/phrases/",
          "repetition",
          newValue
        );

        state.setting.repTID = Date.now();
        state.setting.repetition = newValue;
      }
    });

    builder.addCase(deleteMetaPhrase.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      void userSettingAttrUpdate(
        new Date(),
        { phrases: state.setting },
        "/phrases/",
        "repetition",
        newValue
      );

      state.setting.repTID = Date.now();
      state.setting.repetition = newValue;
    });

    builder.addCase(flipPhrasesPracticeSide.fulfilled, (state) => {
      state.setting.englishSideUp = !state.setting.englishSideUp;
    });
  },
});

export const {
  clearPhrases,
  togglePhrasesRomaji,
  togglePhrasesFilter,
  togglePhraseActiveGrp,
  togglePhrasesReinforcement,
  toggleIncludeNew,
  toggleIncludeReviewed,
  addFrequencyPhrase,
  setPhraseDifficulty,
  setPhraseAccuracy,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  setGoal,

  removeFrequencyPhrase,
  togglePhrasesOrdering,
  batchRepetitionUpdate,
} = phraseSlice.actions;
export default phraseSlice.reducer;
