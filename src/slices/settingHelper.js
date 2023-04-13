import { localStoreAttrUpdate } from "../helper/localStorageHelper";

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
export function toggleDebugHelper(override) {
  return (/** @type {SettingState} */ state) => {
    const { debug } = state.global;

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

    return localStoreAttrUpdate(time, state, path, attr, newDebug);
  };
}

/**
 * @param {string} parent
 * @param {string|string[]} grpName
 */
export function toggleActiveGrpHelper(parent, grpName) {
  return (/** @type {SettingState} */ state) => {
    const { activeGroup } = state[parent];

    const groups = Array.isArray(grpName) ? grpName : [grpName];
    const newValue = grpParse(groups, activeGroup);

    const path = "/" + parent + "/";
    const attr = "activeGroup";
    const time = new Date();
    return localStoreAttrUpdate(time, state, path, attr, newValue);
  };
}

 /**
   * @param {string} parent
   * @param {string} tagName
   */
 export function toggleActiveTagHelper(parent, tagName) {
  return (/** @type {SettingState} */ state) => {
    /** @type {{activeTags: string[]}} */
    const { activeTags } = state[parent];

    let newValue;
    if (activeTags.includes(tagName)) {
      newValue = activeTags.filter((a) => a !== tagName);
    } else {
      newValue = [...activeTags, tagName];
    }

    const path = "/" + parent + "/";
    const attr = "activeTags";
    const time = new Date();
    return localStoreAttrUpdate(time, state, path, attr, newValue);
  };
}

/**
 * Adds or removes grpNames to the activeGroup list.
 * Returns an updated list of selected groups
 * @param {string[]} grpNames a group name to be toggled
 * @param {string[]} activeGroup a list of groups that are selected
 */
export function grpParse(grpNames, activeGroup) {
  /** @type {string[]} */
  let newValue = [];

  const grpNamesSet = [...new Set(grpNames)];
  const activeGroupSet = [...new Set(activeGroup)];

  grpNamesSet.forEach((grpEl) => {
    const isGrp = grpEl.indexOf(".") === -1;

    if (isGrp) {
      if (activeGroupSet.some((e) => e.indexOf(grpEl + ".") !== -1)) {
        newValue = [
          ...activeGroupSet.filter((v) => v.indexOf(grpEl + ".") === -1),
          grpEl,
        ];
      } else if (activeGroupSet.includes(grpEl)) {
        newValue = [...activeGroupSet.filter((v) => v !== grpEl)];
      } else {
        newValue = [...activeGroupSet, grpEl];
      }
    } else {
      newValue = activeGroupSet.includes(grpEl)
        ? activeGroupSet.filter((v) => v !== grpEl)
        : [...activeGroupSet, grpEl];
    }
  });

  return newValue;
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
    let prevMap =
      spaceRep[uid] === undefined ? undefined : { [uid]: spaceRep[uid] };

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

    const map = { [uid]: o };
    prevMap = prevMap === undefined ? { ...map } : prevMap;

    /** @type {SpaceRepetitionMap} */
    const newValue = { ...spaceRep, ...map };
    localStoreAttrUpdate(time, state, path, attr, newValue);

    return { map, prevMap, value: newValue };
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
