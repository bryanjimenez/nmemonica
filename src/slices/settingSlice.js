import { createSlice } from "@reduxjs/toolkit";
import merge from "lodash/fp/merge";
import {
  ADD_SPACE_REP_KANJI,
  ADD_SPACE_REP_PHRASE,
  ADD_SPACE_REP_WORD,
  getLastStateValue,
} from "../actions/settingsAct";
import { localStorageKey } from "../constants/paths";
import { getVerbFormsArray } from "../helper/gameHelper";
import {
  getLocalStorageSettings,
  localStoreAttrUpdate,
} from "../helper/localStorageNoPromise";

/**
 * @typedef {typeof import("../actions/settingsAct").TermSortBy} TermSortBy
 * @typedef {typeof import("../actions/settingsAct").TermFilterBy} TermFilterBy
 */

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {{map: SpaceRepetitionMap, prevMap: SpaceRepetitionMap}} updateSpaceRepTermYield
 * @param {ADD_SPACE_REP_WORD | ADD_SPACE_REP_PHRASE | ADD_SPACE_REP_KANJI} aType
 * @param {string} uid
 * @param {boolean} shouldIncrement should view count increment
 * @param {{toggle?: (import("../typings/raw").FilterKeysOfType<SpaceRepetitionMap["uid"], boolean>)[], set?: {[k in keyof SpaceRepetitionMap["uid"]]+?: SpaceRepetitionMap["uid"][k]|null}}} [options] additional optional settable attributes ({@link furiganaToggled })
 */
function updateSpaceRepTerm(aType, uid, shouldIncrement = true, options) {
  return (/** @type {function} */ getState) => {
    let pathPart;
    if (aType === ADD_SPACE_REP_WORD) {
      pathPart = "vocabulary";
    } else if (aType === ADD_SPACE_REP_PHRASE) {
      pathPart = "phrases";
    } else if (aType === ADD_SPACE_REP_KANJI) {
      pathPart = "kanji";
    }

    const path = "/" + pathPart + "/";
    const attr = "repetition";
    const time = new Date();

    /** @type {SpaceRepetitionMap} */
    const spaceRep = getLastStateValue(getState, path, attr);
    const prevMap = { [uid]: spaceRep[uid] };

    let count;
    if (spaceRep[uid] && spaceRep[uid].vC > 0 && shouldIncrement) {
      count = spaceRep[uid].vC + 1;
    } else if (spaceRep[uid] && spaceRep[uid].vC > 0 && !shouldIncrement) {
      count = spaceRep[uid].vC;
    } else {
      count = 1;
    }

    let uidChangedAttr = {};
    if (options !== undefined) {
      if (options.toggle) {
        const optToggled = options.toggle.reduce((acc, attr) => {
          let val;
          if (["f"].includes(attr)) {
            // this default is only for furigana so far
            val = !(spaceRep[uid] && spaceRep[uid][attr] === false) || false;
          } else {
            val = spaceRep[uid] && spaceRep[uid][attr];
          }

          return { ...acc, [attr]: !val };
        }, {});

        uidChangedAttr = { ...uidChangedAttr, ...optToggled };
      }

      if (options.set !== undefined) {
        const optSet = Object.keys(options.set).reduce((acc, k) => {
          if (options.set !== undefined && options.set[k] !== undefined) {
            if (options.set[k] === null) {
              acc = { ...acc, [k]: undefined };
            } else {
              acc = { ...acc, [k]: options.set[k] };
            }
          }
          return acc;
        }, {});

        uidChangedAttr = { ...uidChangedAttr, ...optSet };
      }
    }

    const now = new Date().toJSON();
    /** @type {SpaceRepetitionMap["uid"]} */
    const o = {
      ...(spaceRep[uid] || {}),
      vC: count,
      d: now,
      ...uidChangedAttr,
    };

    /** @type {SpaceRepetitionMap} */
    const newValue = { ...spaceRep, [uid]: o };
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    return { map: { [uid]: o }, prevMap, value: newValue };
  };
}

export const initialState = {
  global: {
    darkMode: false,
    scrolling: false,
    memory: { quota: 0, usage: 0, persistent: false },
    debug: 0,
    console: [],
    swipeThreshold: 0,
    motionThreshold: 0,
  },
  kana: { choiceN: 16, wideMode: false, easyMode: false, charSet: 0 },
  phrases: {
    ordered: /** @type {TermSortBy[keyof TermSortBy]} */ (0),
    practiceSide: false,
    romaji: false,
    reinforce: false,
    repetition: /** @type {SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (0),
  },
  vocabulary: {
    ordered: /** @type {TermSortBy[keyof TermSortBy]} */ (0),
    practiceSide: false,
    romaji: false,
    bareKanji: false,
    hintEnabled: false,
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (0),
    reinforce: false,
    repetition: /** @type {SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    autoVerbView: false,
    verbColSplit: 0,
    verbFormsOrder: getVerbFormsArray().map((f) => f.name),
  },
  kanji: {
    choiceN: 32,
    filter: /** @type {TermFilterBy[keyof TermFilterBy]} */ (2),
    reinforce: false,
    repetition: /** @type {SpaceRepetitionMap}*/ ({}),
    frequency: { uid: undefined, count: 0 },
    activeGroup: [],
    activeTags: [],
  },
  opposites: { qRomaji: false, aRomaji: false },
  particles: { aRomaji: false },
};

const settingSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    localStorageSettingsInitialized(state) {
      const lsSettings = getLocalStorageSettings(localStorageKey);
      // use merge to prevent losing defaults not found in localStorage
      const mergedSettings = merge(initialState, lsSettings);
      delete mergedSettings.lastModified;
      state.vocabulary = mergedSettings.vocabulary;

      // calculated values
      const vocabReinforceList = Object.keys(
        mergedSettings.vocabulary.repetition
      ).filter((k) => mergedSettings.vocabulary.repetition[k]?.rein === true);
      state.vocabulary.frequency = {
        uid: undefined,
        count: vocabReinforceList.length,
      };

      const phraseReinforceList = Object.keys(
        mergedSettings.phrases.repetition
      ).filter((k) => mergedSettings.phrases.repetition[k]?.rein === true);
      state.phrases.frequency = {
        uid: undefined,
        count: phraseReinforceList.length,
      };

      const kanjiReinforceList = Object.keys(
        mergedSettings.kanji.repetition
      ).filter((k) => mergedSettings.kanji.repetition[k]?.rein === true);
      state.kanji.frequency = {
        uid: undefined,
        count: kanjiReinforceList.length,
      };
    },

    furiganaToggled(state, action) {
      // FIXME: hacky
      const getState = () => ({ settings: state });
      const { value } = updateSpaceRepTerm(
        ADD_SPACE_REP_WORD,
        action.payload,
        false,
        { toggle: ["f"] }
      )(getState);

      state.vocabulary.repetition = value;
    },
  },
});

export const { localStorageSettingsInitialized, furiganaToggled } =
  settingSlice.actions;
export default settingSlice.reducer;
