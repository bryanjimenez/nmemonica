import { localStoreAttrUpdate } from "./localStorageHelper";

/**
 * @typedef {typeof import("../actions/settingsAct").TermSortBy} TermSortBy
 * @typedef {typeof import("../actions/settingsAct").TermFilterBy} TermFilterBy
 */

export const ADD_SPACE_REP_WORD = "add_space_rep_word";
export const ADD_SPACE_REP_PHRASE = "add_space_rep_phrase";
export const ADD_SPACE_REP_KANJI = "add_space_rep_kanji";

// enum
export const DebugLevel = Object.freeze({
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  DEBUG: 3,
});

// enum
export const TermFilterBy = Object.freeze({
  GROUP: 0,
  FREQUENCY: 1,
  TAGS: 2,
});

// enum
export const TermSortBy = Object.freeze({
  RANDOM: 0,
  ALPHABETIC: 1,
  VIEW_DATE: 2,
  GAME: 3,
  DIFFICULTY: 4,
});

export const TermSortByLabel = [
  "Randomized",
  "Alphabetic",
  "Staleness",
  "Space Rep",
  "Difficulty",
];

/**
 * @param {typeof DebugLevel[keyof DebugLevel]} override
 */
export function toggleDebugAct(override) {
  return (/** @type {RootState} */ state) => {
    const { debug } = state.settingsHK.global;

    const path = "/global/";
    const attr = "debug";
    const time = new Date();

    let newDebug;
    if (override !== undefined) {
      if (Object.values(DebugLevel).includes(override)) {
        newDebug = override;
      } else {
        throw new Error("Debug override not valid");
      }
    } else {
      newDebug = Object.values(DebugLevel).includes(debug + 1)
        ? debug + 1
        : DebugLevel.OFF;
    }

    localStoreAttrUpdate(time, state, path, attr, newDebug);
    return newDebug;
  };
}

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {{map: SpaceRepetitionMap, prevMap: SpaceRepetitionMap}} updateSpaceRepTermYield
 * @param {ADD_SPACE_REP_WORD | ADD_SPACE_REP_PHRASE | ADD_SPACE_REP_KANJI} aType
 * @param {string} uid
 * @param {boolean} shouldIncrement should view count increment
 * @param {{toggle?: (import("../typings/raw").FilterKeysOfType<SpaceRepetitionMap["uid"], boolean>)[], set?: {[k in keyof SpaceRepetitionMap["uid"]]+?: SpaceRepetitionMap["uid"][k]|null}}} [options] additional optional settable attributes ({@link furiganaToggled })
 */
export function updateSpaceRepTerm(
  aType,
  uid,
  shouldIncrement = true,
  options
) {
  return (/** @type {SettingState} */ state) => {
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
    const spaceRep = getLastStateValue(state, path, attr);
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
    localStoreAttrUpdate(time, state, path, attr, newValue);

    return { map: { [uid]: o }, prevMap, value: newValue };
  };
}

/**
 * Retrieves last App settings state value for path and attr
 * @param {SettingState} state
 * @param {string} path
 * @param {string} attr
 */
export function getLastStateValue(state, path, attr) {
  const stateSettings = state;

  let statePtr = stateSettings;

  path.split("/").forEach((p) => {
    if (p) {
      statePtr = statePtr[p];
    }
  });

  return statePtr[attr];
}
