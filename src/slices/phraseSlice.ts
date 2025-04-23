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
  TermFilterBy,
  TermSortBy,
  deleteMetadata,
  grpParse,
  toggleAFilter,
  updateSpaceRepTerm,
} from "./settingHelper";
import { IDBStores, openIDB, putIDBItem } from "../../pwa/helper/idbHelper";
import { DebugLevel } from "../helper/consoleHelper";
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
  userStudyStateAttrUpdate,
} from "../helper/userSettingsHelper";
import { getIndexDBStudyState } from "../helper/userSettingsIndexDBHelper";
import type { ValuesOf } from "../typings/utils";

import type { RootState } from ".";

const SLICE_NAME = "phrases";
export interface PhraseInitSlice {
  value: RawPhrase[];
  version: string;
  grpObj: GroupListMap;

  metadata: Record<string, MetaDataObj | undefined>;
  metadataID: number;

  setting: {
    ordered: ValuesOf<typeof TermSortBy>;
    englishSideUp: boolean;
    spaRepMaxReviewItem?: number;
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

  metadata: {},
  metadataID: -1,

  setting: {
    ordered: 0,
    englishSideUp: false,
    spaRepMaxReviewItem: undefined,
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
  `${SLICE_NAME}/getPhrase`,
  async (_arg, thunkAPI) => {
    return getSheetFromIndexDB(SLICE_NAME).then((sheet) => {
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

/**
 * Pull Phrase metadata from indexedDB
 */
export const getPhraseMeta = createAsyncThunk(
  `${SLICE_NAME}/getPhraseMeta`,
  async () => {
    return getIndexDBStudyState(SLICE_NAME).then((data) => {
      return data ?? {};
    });
  }
);

export const phraseSettingsFromAppStorage = createAsyncThunk(
  `${SLICE_NAME}/phraseSettingsFromAppStorage`,
  (arg: typeof phraseInitState.setting) => {
    const initValues = arg;

    return initValues;
  }
);

export const togglePhraseTag = createAsyncThunk(
  `${SLICE_NAME}/togglePhraseTag`,
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
  `${SLICE_NAME}/getPhraseTags`,
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
  `${SLICE_NAME}/flipPhrasesPracticeSide`,
  (arg: { query: string }, thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    return userSettingAttrUpdate(
      { phrases: state.setting },
      "/phrases/",
      "englishSideUp"
    );
  }
);

export const setPhraseAccuracy = createAsyncThunk(
  `${SLICE_NAME}/setPhraseAccuracy`,
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

    return userStudyStateAttrUpdate(SLICE_NAME, newValue).then(() => newValue);
  }
);

export const setPhraseDifficulty = createAsyncThunk(
  `${SLICE_NAME}/setPhraseDifficulty`,
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

    return userStudyStateAttrUpdate(SLICE_NAME, newValue).then(() => newValue);
  }
);

export const updateSpaceRepPhrase = createAsyncThunk(
  `${SLICE_NAME}/updateSpaceRepPhrase`,
  (arg: { uid: string; shouldIncrement?: boolean }, thunkAPI) => {
    const { uid, shouldIncrement } = arg;
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];

    const spaceRep = state.metadata;

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

    const spaceRep = state.metadata;
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

    const spaceRep = state.metadata;
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

export const deleteMetaPhrase = createAsyncThunk(
  `${SLICE_NAME}/deleteMetaPhrase`,
  (uidList: string[], thunkAPI) => {
    const state = (thunkAPI.getState() as RootState)[SLICE_NAME];
    const spaceRep = state.metadata;

    const newValue = deleteMetadata(uidList, spaceRep);

    return userStudyStateAttrUpdate(SLICE_NAME, newValue.record).then(
      () => newValue
    );
  }
);

const phraseSlice = createSlice({
  name: SLICE_NAME,
  initialState: phraseInitState,
  reducers: {
    clearPhrases(state) {
      state.value = phraseInitState.value;
      state.version = phraseInitState.version;
      state.grpObj = phraseInitState.grpObj;
    },

    togglePhraseActiveGrp(state, action: { payload: string }) {
      const grpName = action.payload;

      const { activeGroup } = state.setting;

      const groups = Array.isArray(grpName) ? grpName : [grpName];
      const newValue: string[] = grpParse(groups, activeGroup);

      void userSettingAttrUpdate(
        { phrases: state.setting },
        "/phrases/",
        "activeGroup",
        newValue
      );

      state.setting.activeGroup = newValue;
    },

    setMemorizedThreshold(state, action: { payload: number }) {
      const threshold = action.payload;

      void userSettingAttrUpdate(
        { phrases: state.setting },
        "/phrases/",
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
        void userSettingAttrDelete("/phrases/", "spaRepMaxReviewItem");
        state.setting.spaRepMaxReviewItem = undefined;
      } else {
        const maxItems = Math.max(SR_MIN_REV_ITEMS, max);
        void userSettingAttrUpdate(
          { phrases: state.setting },
          "/phrases/",
          "spaRepMaxReviewItem",
          maxItems
        );

        state.setting.spaRepMaxReviewItem = maxItems;
      }
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
        { phrases: state.setting },
        "/phrases/",
        "ordered",
        newOrdered
      );

      state.setting.ordered = newOrdered;
    },
    toggleIncludeNew(state) {
      void userSettingAttrUpdate(
        { phrases: state.setting },
        "/phrases/",
        "includeNew"
      );

      state.setting.includeNew = !state.setting.includeNew;
    },
    toggleIncludeReviewed(state) {
      void userSettingAttrUpdate(
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
          { phrases: state.setting },
          "/phrases/",
          "viewGoal",
          goal
        );

        state.setting.viewGoal = goal;
      } else {
        state.setting.viewGoal = undefined;
        void userSettingAttrDelete("/phrases/", "viewGoal");
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
    builder.addCase(getPhraseMeta.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });

    builder.addCase(phraseSettingsFromAppStorage.fulfilled, (state, action) => {
      const storedValue = action.payload;
      const mergedSettings = merge(phraseInitState.setting, storedValue);

      return {
        ...state,
        setting: { ...mergedSettings, repTID: Date.now() },
      };
    });

    builder.addCase(flipPhrasesPracticeSide.fulfilled, (state) => {
      state.setting.englishSideUp = !state.setting.englishSideUp;
    });

    builder.addCase(setPhraseAccuracy.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
    builder.addCase(setPhraseDifficulty.fulfilled, (state, action) => {
      const newValue = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
    builder.addCase(updateSpaceRepPhrase.fulfilled, (state, action) => {
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
    builder.addCase(deleteMetaPhrase.fulfilled, (state, action) => {
      const { record: newValue } = action.payload;

      state.metadataID = Date.now();
      state.metadata = newValue;
    });
  },
});

export const {
  clearPhrases,
  togglePhraseActiveGrp,
  toggleIncludeNew,
  toggleIncludeReviewed,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  setGoal,

  togglePhrasesOrdering,
} = phraseSlice.actions;
export default phraseSlice.reducer;
