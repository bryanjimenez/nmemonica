import { localStoreAttrUpdate } from "../helper/localStorage";
import { firebaseAttrUpdate } from "./firebase";
export const SET_KANA_BTN_N = "set_kana_btn_number";
export const TOGGLE_KANA_WIDEMODE = "set_kana_widemode";
export const TOGGLE_KANA_EASYMODE = "set_kana_easymode";
export const TOGGLE_KANA_CHAR_SET = "toggle_kana_char_set";
export const SET_PHRASES_ORDERING = "set_phrases_ordering";
export const FLIP_PHRASES_PRACTICE_SIDE = "flip_phrases_practice_side";
export const TOGGLE_PHRASES_ROMAJI = "toggle_phrases_romaji";
export const TOGGLE_PHRASES_ACTIVE_GROUP = "toggle_phrases_active_group";
export const TOGGLE_PHRASES_ACTIVE_TAG = "toggle_phrases_active_tag";
export const SET_VOCABULARY_ORDERING = "set_vocabulary_ordering";
export const FLIP_VOCABULARY_PRACTICE_SIDE = "flip_vocabulary_practice_side";
export const TOGGLE_VOCABULARY_ROMAJI = "toggle_vocabulary_romaji";
export const TOGGLE_VOCABULARY_BARE_KANJI = "TOGGLE_VOCABULARY_BARE_KANJI";
export const TOGGLE_VOCABULARY_HINT = "toggle_vocabulary_hint";
export const TOGGLE_VOCABULARY_FILTER = "toggle_vocabulary_filter";
export const TOGGLE_VOCABULARY_ACTIVE_GROUP = "toggle_vocabulary_active_group";
export const TOGGLE_VOCABULARY_ACTIVE_TAG = "toggle_vocabulary_active_tag";
export const TOGGLE_VOCABULARY_REINFORCE = "toggle_vocabulary_reinforce";
export const SET_KANJI_BTN_N = "set_kanji_btn_number";
export const TOGGLE_KANJI_FILTER = "toggle_kanji_filter";
export const TOGGLE_KANJI_ACTIVE_GROUP = "toggle_kanji_active_group";
export const TOGGLE_KANJI_ACTIVE_TAG = "toggle_kanji_active_tag";
export const TOGGLE_KANJI_REINFORCE = "toggle_kanji_reinforce";
export const SET_OPPOSITES_Q_ROMAJI = "set_opposites_q_romaji";
export const SET_OPPOSITES_A_ROMAJI = "set_opposites_a_romaji";
export const SET_PARTICLES_A_ROMAJI = "set_particles_a_romaji";
export const ADD_FREQUENCY_WORD = "add_frequency_word";
export const REMOVE_FREQUENCY_WORD = "remove_frequency_word";
export const ADD_FREQUENCY_PHRASE = "add_frequency_phrase";
export const REMOVE_FREQUENCY_PHRASE = "remove_frequency_phrase";
export const ADD_FREQUENCY_KANJI = "add_frequency_kanji";
export const REMOVE_FREQUENCY_KANJI = "remove_frequency_kanji";
export const TOGGLE_PHRASES_FILTER = "toggle_phrases_filter";
export const TOGGLE_PHRASES_REINFORCE = "toggle_phrases_reinforce";
export const TOGGLE_DARK_MODE = "toggle_dark_mode";
export const SCROLLING_STATE = "scrolling_state";
export const AUTO_VERB_VIEW = "auto_verb_view";
export const VERB_FORM_VIEW = "verb_form_view";
export const ADD_SPACE_REP_WORD = "add_space_rep_word";
export const ADD_SPACE_REP_PHRASE = "add_space_rep_phrase";
export const ADD_SPACE_REP_KANJI = "add_space_rep_kanji";
export const DEBUG = "toggle_debug";
export const SET_SWIPE_THRESHOLD = "set_swipe_threshold";
export const SET_MOTION_THRESHOLD = "set_motion_threshold";
export const SET_VERB_FORM_ORDER = "set_verb_form_order";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

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
 * @param {number} number
 * @returns {ActCreator}
 */
export function setHiraganaBtnN(number) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/kana/";
    const attr = "choiceN";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, number);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        SET_KANA_BTN_N,
        number
      );
    } else {
      dispatch({
        type: SET_KANA_BTN_N,
        value: number,
      });
    }
  };
}

/**
 * @param {number} number
 * @returns {ActCreator}
 */
export function setKanjiBtnN(number) {
  return (dispatch, getState) => {
    const path = "/kanji/";
    const attr = "choiceN";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, number);

    dispatch({
      type: SET_KANJI_BTN_N,
      value: number,
    });
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleKanaGameWideMode() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/kana/";
    const attr = "wideMode";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_KANA_WIDEMODE
      );
    } else {
      dispatch({
        type: TOGGLE_KANA_WIDEMODE,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleKanaEasyMode() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/kana/";
    const attr = "easyMode";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_KANA_EASYMODE
      );
    } else {
      dispatch({
        type: TOGGLE_KANA_EASYMODE,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleKana() {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { charSet } = getState().settings.kana;

    const newCharSet = charSet + 1 < 3 ? charSet + 1 : 0;

    const path = "/kana/";
    const attr = "charSet";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, newCharSet);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_KANA_CHAR_SET,
        newCharSet
      );
    } else {
      dispatch({
        type: TOGGLE_KANA_CHAR_SET,
        value: newCharSet,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function togglePhrasesOrdering() {
  const max = Object.values(TermSortBy).length - 1;
  const allowed = /** @type {number[]} */ ([
    TermSortBy.RANDOM,
    TermSortBy.VIEW_DATE,
  ]);

  return (dispatch, getState) => {
    const { user } = getState().login;
    const { ordered } = getState().settings.phrases;

    let newOrdered = ordered + 1;
    while (!allowed.includes(newOrdered) || newOrdered > max) {
      newOrdered = newOrdered + 1 > max ? 0 : newOrdered + 1;
    }

    const path = "/phrases/";
    const attr = "ordered";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, newOrdered);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        SET_PHRASES_ORDERING,
        newOrdered
      );
    } else {
      dispatch({
        type: SET_PHRASES_ORDERING,
        value: newOrdered,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function flipPhrasesPracticeSide() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/phrases/";
    const attr = "practiceSide";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        FLIP_PHRASES_PRACTICE_SIDE
      );
    } else {
      dispatch({
        type: FLIP_PHRASES_PRACTICE_SIDE,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function togglePhrasesRomaji() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/phrases/";
    const attr = "romaji";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_PHRASES_ROMAJI
      );
    } else {
      dispatch({
        type: TOGGLE_PHRASES_ROMAJI,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleVocabularyReinforcement() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "reinforce";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_VOCABULARY_REINFORCE
      );
    } else {
      dispatch({
        type: TOGGLE_VOCABULARY_REINFORCE,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleVocabularyOrdering() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const { ordered } = getState().settings.vocabulary;
    const newOrdered =
      ordered + 1 < Object.keys(TermSortBy).length ? ordered + 1 : 0;

    const path = "/vocabulary/";
    const attr = "ordered";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, newOrdered);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        SET_VOCABULARY_ORDERING,
        newOrdered
      );
    } else {
      dispatch({
        type: SET_VOCABULARY_ORDERING,
        value: newOrdered,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function flipVocabularyPracticeSide() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "practiceSide";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        FLIP_VOCABULARY_PRACTICE_SIDE
      );
    } else {
      dispatch({
        type: FLIP_VOCABULARY_PRACTICE_SIDE,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleVocabularyRomaji() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "romaji";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_VOCABULARY_ROMAJI
      );
    } else {
      dispatch({
        type: TOGGLE_VOCABULARY_ROMAJI,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleVocabularyBareKanji() {
  return (dispatch, getState) => {
    const path = "/vocabulary/";
    const attr = "bareKanji";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    dispatch({
      type: TOGGLE_VOCABULARY_BARE_KANJI,
    });
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleVocabularyHint() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "hintEnabled";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_VOCABULARY_HINT
      );
    } else {
      dispatch({
        type: TOGGLE_VOCABULARY_HINT,
      });
    }
  };
}

/**
 * Toggle between groups, frequency, and tags
 * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
 * @returns {ActCreator}
 */
export function toggleVocabularyFilter(override) {
  const max = Object.values(TermFilterBy).length - 1;
  const allowed = /** @type {number[]} */ ([
    TermFilterBy.FREQUENCY,
    TermFilterBy.GROUP,
  ]);

  return (dispatch, getState) => {
    const { user } = getState().login;
    const { filter, reinforce } = getState().settings.vocabulary;

    const path = "/vocabulary/";
    const attr = "filter";
    const time = new Date();

    let newFilter = filter + 1;
    if (override !== undefined) {
      newFilter = override;
    } else {
      while (!allowed.includes(newFilter) || newFilter > max) {
        newFilter = newFilter + 1 > max ? 0 : newFilter + 1;
      }
    }

    localStoreAttrUpdate(time, getState, path, attr, newFilter);

    if (newFilter !== 0 && reinforce) {
      toggleVocabularyReinforcement()(dispatch, getState);
    }

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_VOCABULARY_FILTER,
        newFilter
      );
    } else {
      dispatch({
        type: TOGGLE_VOCABULARY_FILTER,
        value: newFilter,
      });
    }
  };
}

/**
 * @param {string} parent
 * @param {string|string[]} grpName
 * @returns {ActCreator}
 */
export function toggleActiveGrp(parent, grpName) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { activeGroup } = getState().settings[parent];

    // if (parent === "vocabulary")
    let action = TOGGLE_VOCABULARY_ACTIVE_GROUP;

    if (parent === "kanji") {
      action = TOGGLE_KANJI_ACTIVE_GROUP;
    } else if (parent === "phrases") {
      action = TOGGLE_PHRASES_ACTIVE_GROUP;
    }

    const groups = Array.isArray(grpName) ? grpName : [grpName];
    const newValue = grpParse(groups, activeGroup);

    const path = "/" + parent + "/";
    const attr = "activeGroup";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        action,
        newValue
      );
    } else {
      dispatch({
        type: action,
        value: newValue,
      });
    }
  };
}

/**
 * @param {string} parent
 * @param {string} tagName
 * @returns {ActCreator}
 */
export function toggleActiveTag(parent, tagName) {
  return (dispatch, getState) => {
    /** @type {{activeTags: string[]}} */
    const { activeTags } = getState().settings[parent];

    // if (parent === "vocabulary")
    let action = TOGGLE_VOCABULARY_ACTIVE_TAG;

    if (parent === "kanji") {
      action = TOGGLE_KANJI_ACTIVE_TAG;
    } else if (parent === "phrases") {
      action = TOGGLE_PHRASES_ACTIVE_TAG;
    }

    let newValue;
    if (activeTags.includes(tagName)) {
      newValue = activeTags.filter((a) => a !== tagName);
    } else {
      newValue = [...activeTags, tagName];
    }

    const path = "/" + parent + "/";
    const attr = "activeTags";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    dispatch({
      type: action,
      value: newValue,
    });
  };
}

// /**
//  * @returns {ActCreator}
//  */
// export function setOppositesQRomaji() {
//   return (dispatch, getState) => {
//     const { user } = getState().login;

//     const path = "/opposites/";
//     const attr = "qRomaji";
//     const time = new Date();
//     localStoreAttrUpdate(time, getState, path, attr);

//     if (user) {
//       firebaseAttrUpdate(
//         time,
//         dispatch,
//         getState,
//         user.uid,
//         path,
//         attr,
//         SET_OPPOSITES_Q_ROMAJI
//       );
//     } else {
//       dispatch({
//         type: SET_OPPOSITES_Q_ROMAJI,
//       });
//     }
//   };
// }

// /**
//  * @returns {ActCreator}
//  */
// export function setOppositesARomaji() {
//   return (dispatch, getState) => {
//     const { user } = getState().login;

//     const path = "/opposites/";
//     const attr = "aRomaji";
//     const time = new Date();
//     localStoreAttrUpdate(time, getState, path, attr);

//     if (user) {
//       firebaseAttrUpdate(
//         time,
//         dispatch,
//         getState,
//         user.uid,
//         path,
//         attr,
//         SET_OPPOSITES_A_ROMAJI
//       );
//     } else {
//       dispatch({
//         type: SET_OPPOSITES_A_ROMAJI,
//       });
//     }
//   };
// }

/**
 * @returns {ActCreator}
 */
export function setParticlesARomaji() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/particles/";
    const attr = "aRomaji";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        SET_PARTICLES_A_ROMAJI
      );
    } else {
      dispatch({
        type: SET_PARTICLES_A_ROMAJI,
      });
    }
  };
}

/**
 * @param {string} uid
 */
export function addFrequencyWord(uid) {
  return (dispatch, getState) => {
    updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, { set: { rein: true } })(
      dispatch,
      getState
    );

    dispatch({
      type: ADD_FREQUENCY_WORD,
      value: { uid },
    });
  };
}

/**
 * Removes frequency word
 * @param {string} uid
 * @returns {ActCreator}
 */
export function removeFrequencyWord(uid) {
  return (dispatch, getState) => {
    const path = "/vocabulary/";
    const attr = "repetition";
    /** @type {SpaceRepetitionMap} */
    const spaceRep = getLastStateValue(getState, path, attr);

    if (spaceRep[uid]?.rein === true) {
      // update frequency list count
      const reinforceList = Object.keys(spaceRep).filter(
        (k) => spaceRep[k].rein === true
      );
      // null to delete
      updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, {
        set: { rein: null },
      })(dispatch, getState);

      dispatch({
        type: REMOVE_FREQUENCY_WORD,
        value: { uid, count: reinforceList.length - 1 },
      });
    }
  };
}

/**
 * @param {string} uid
 */
export function addFrequencyPhrase(uid) {
  return (dispatch, getState) => {
    updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, false, {
      set: { rein: true },
    })(dispatch, getState);

    dispatch({
      type: ADD_FREQUENCY_PHRASE,
      value: { uid },
    });
  };
}

/**
 * Removes frequency word
 * @param {string} uid
 * @returns {ActCreator}
 */
export function removeFrequencyPhrase(uid) {
  return (dispatch, getState) => {
    const path = "/phrases/";
    const attr = "repetition";
    /** @type {SpaceRepetitionMap} */
    const spaceRep = getLastStateValue(getState, path, attr);

    if (spaceRep[uid]?.rein === true) {
      // update frequency list count
      const reinforceList = Object.keys(spaceRep).filter(
        (k) => spaceRep[k].rein === true
      );
      // null to delete
      updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, false, {
        set: { rein: null },
      })(dispatch, getState);

      dispatch({
        type: REMOVE_FREQUENCY_PHRASE,
        value: { uid, count: reinforceList.length - 1 },
      });
    }
  };
}

/**
 * @param {string} uid
 */
export function addFrequencyKanji(uid) {
  return (dispatch, getState) => {
    updateSpaceRepTerm(ADD_SPACE_REP_KANJI, uid, false, {
      set: { rein: true },
    })(dispatch, getState);

    dispatch({
      type: ADD_FREQUENCY_KANJI,
      value: { uid },
    });
  };
}

/**
 * Removes frequency word
 * @param {string} uid
 * @returns {ActCreator}
 */
export function removeFrequencyKanji(uid) {
  return (dispatch, getState) => {
    const path = "/kanji/";
    const attr = "repetition";
    /** @type {SpaceRepetitionMap} */
    const spaceRep = getLastStateValue(getState, path, attr);

    if (spaceRep[uid]?.rein === true) {
      // update frequency list count
      const reinforceList = Object.keys(spaceRep).filter(
        (k) => spaceRep[k].rein === true
      );
      // null to delete
      updateSpaceRepTerm(ADD_SPACE_REP_KANJI, uid, false, {
        set: { rein: null },
      })(dispatch, getState);

      dispatch({
        type: REMOVE_FREQUENCY_KANJI,
        value: { uid, count: reinforceList.length - 1 },
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleKanjiReinforcement() {
  return (dispatch, getState) => {
    const path = "/kanji/";
    const attr = "reinforce";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    dispatch({
      type: TOGGLE_KANJI_REINFORCE,
    });
  };
}

/**
 * Toggle between frequency and tags
 * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
 * @returns {ActCreator}
 */
export function toggleKanjiFilter(override) {
  return (dispatch, getState) => {
    const { filter, reinforce } = getState().settings.kanji;

    const path = "/kanji/";
    const attr = "filter";
    const time = new Date();

    let newFilter;
    if (override !== undefined) {
      newFilter = override;
    } else {
      newFilter = Object.values(TermFilterBy).includes(filter + 1)
        ? filter + 1
        : /*skip TermFilterBy.GROUP*/ TermFilterBy.FREQUENCY;
    }

    localStoreAttrUpdate(time, getState, path, attr, newFilter);

    if (newFilter !== 0 && reinforce) {
      toggleKanjiReinforcement()(dispatch, getState);
    }

    dispatch({
      type: TOGGLE_KANJI_FILTER,
      value: newFilter,
    });
  };
}

/**
 * @param {string} aType
 * @param {string[]} uidArr
 * @returns {ThenableActCreator}
 */
export function addFrequencyTerm(aType, uidArr) {
  return (dispatch, getState) =>
    /** @type {Promise<void>} */ (
      new Promise((resolve) => {
        const { user } = getState().login;

        let pathType;
        if (aType === ADD_FREQUENCY_WORD) {
          pathType = "vocabulary";
        } else if (aType === ADD_FREQUENCY_PHRASE) {
          pathType = "phrases";
        }

        const path = "/" + pathType + "/";
        const attr = "frequency";
        const time = new Date();

        const uidList = getLastStateValue(getState, path, attr);
        const newValue = [...new Set([...uidList, ...uidArr])];
        localStoreAttrUpdate(time, getState, path, attr, newValue);

        if (user) {
          firebaseAttrUpdate(
            time,
            dispatch,
            getState,
            user.uid,
            path,
            attr,
            aType,
            newValue
          ).then(() => {
            resolve();
          });
        } else {
          dispatch({
            type: aType,
            value: newValue,
          });
          resolve();
        }
      })
    );
}

/**
 * @typedef {(uid:string, shouldIncrement?: boolean | undefined) => updateSpaceRepTermYield} updateSpaceRepWordYield
 * @param {string} uid
 * @param {boolean} [shouldIncrement]
 */
export function updateSpaceRepWord(uid, shouldIncrement = true) {
  return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, shouldIncrement);
}

/**
 * @typedef {(uid:string, shouldIncrement?: boolean | undefined) => updateSpaceRepTermYield} updateSpaceRepPhraseYield
 * @param {string} uid
 * @param {boolean} [shouldIncrement]
 */
export function updateSpaceRepPhrase(uid, shouldIncrement = true) {
  return updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, shouldIncrement);
}

// /**
//  * @typedef {(uid:string) => updateSpaceRepTermYield} toggleFuriganaYield
//  * @param {string} uid
//  */
// export function toggleFurigana(uid) {
//   return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, { toggle: ["f"] });
// }

/**
 * @typedef {(uid:string, value:number) => updateSpaceRepTermYield} setWordDifficultyYield
 * @param {string} uid
 * @param {number} value
 */
export function setWordDifficulty(uid, value) {
  return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, {
    set: { difficulty: value },
  });
}

/**
 * Sets term timed play average stats (correct)
 * @typedef {(uid:string, tpElapsed: number, options?: {pronunciation?: null}) => updateSpaceRepTermYield} setWordTPCorrectYield
 * @param {string} uid
 * @param {number} tpElapsed
 * @param {{pronunciation?: null}} options reset incorrect types
 * @returns {(dispatch: function, getState: function) => updateSpaceRepTermYield}
 */
export function setWordTPCorrect(uid, tpElapsed, { pronunciation } = {}) {
  return (dispatch, getState) => {
    const aType = ADD_SPACE_REP_WORD;
    const pathPart = "vocabulary";

    const path = "/" + pathPart + "/";
    const attr = "repetition";
    const time = new Date();

    /** @type {SpaceRepetitionMap} */
    const spaceRep = getLastStateValue(getState, path, attr);
    const prevMap = { [uid]: spaceRep[uid] };

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

    /** @type {SpaceRepetitionMap["uid"]} */
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

    /** @type {SpaceRepetitionMap} */
    const newValue = { ...spaceRep, [uid]: o };
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    dispatch({
      type: aType,
      value: newValue,
    });

    return { map: { [uid]: o }, prevMap };
  };
}

/**
 * Sets term timed play average stats (incorrect)
 * @typedef {(uid:string, options: {pronunciation?: boolean}|undefined) => updateSpaceRepTermYield} setWordTPIncorrectYield
 * @param {string} uid
 * @param {{pronunciation?: true}} options incorrect types
 */
export function setWordTPIncorrect(uid, { pronunciation } = {}) {
  return (dispatch, getState) => {
    const aType = ADD_SPACE_REP_WORD;
    const pathPart = "vocabulary";

    const path = "/" + pathPart + "/";
    const attr = "repetition";
    const time = new Date();

    /** @type {SpaceRepetitionMap} */
    const spaceRep = getLastStateValue(getState, path, attr);
    const prevMap = { [uid]: spaceRep[uid] };

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

    /** @type {SpaceRepetitionMap["uid"]} */
    const o = {
      ...(spaceRep[uid] || {}),
      tpPc: newPlayCount,
      tpAcc: newAccuracy,
      pron: pronunciation,
    };

    /** @type {SpaceRepetitionMap} */
    const newValue = { ...spaceRep, [uid]: o };
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    dispatch({
      type: aType,
      value: newValue,
    });

    return { map: { [uid]: o }, prevMap };
  };
}
/**
 * @typedef {{map: SpaceRepetitionMap, prevMap: SpaceRepetitionMap}} updateSpaceRepTermYield
 * @param {ADD_SPACE_REP_WORD | ADD_SPACE_REP_PHRASE | ADD_SPACE_REP_KANJI} aType
 * @param {string} uid
 * @param {boolean} shouldIncrement should view count increment
 * @param {{toggle?: (import("../typings/raw").FilterKeysOfType<SpaceRepetitionMap["uid"], boolean>)[], set?: {[k in keyof SpaceRepetitionMap["uid"]]+?: SpaceRepetitionMap["uid"][k]|null}}} [options] additional optional settable attributes ({@link toggleFurigana })
 * @returns {(dispatch: function, getState: function) => updateSpaceRepTermYield}
 */
export function updateSpaceRepTerm(
  aType,
  uid,
  shouldIncrement = true,
  options
) {
  return (dispatch, getState) => {
    const { user } = getState().login;

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

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        aType,
        newValue
      );
    } else {
      dispatch({
        type: aType,
        value: newValue,
      });
    }

    return { map: { [uid]: o }, prevMap };
  };
}

/**
 * Toggle between group, frequency, and tags filtering
 * @param {typeof TermFilterBy[keyof TermFilterBy]} [override]
 * @returns {ActCreator}
 */
export function togglePhrasesFilter(override) {
  const max = Object.values(TermFilterBy).length - 1;
  const allowed = /** @type {number[]} */ ([
    TermFilterBy.FREQUENCY,
    TermFilterBy.GROUP,
  ]);

  return (dispatch, getState) => {
    const { user } = getState().login;
    const { filter, reinforce } = getState().settings.phrases;

    const path = "/phrases/";
    const attr = "filter";
    const time = new Date();

    let newFilter = filter + 1;
    if (override !== undefined) {
      newFilter = override;
    } else {
      while (!allowed.includes(newFilter) || newFilter > max) {
        newFilter = newFilter + 1 > max ? 0 : newFilter + 1;
      }
    }

    localStoreAttrUpdate(time, getState, path, attr, newFilter);

    if (newFilter !== TermFilterBy.GROUP && reinforce) {
      togglePhrasesReinforcement()(dispatch, getState);
    }

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_PHRASES_FILTER,
        newFilter
      );
    } else {
      dispatch({
        type: TOGGLE_PHRASES_FILTER,
        value: newFilter,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function togglePhrasesReinforcement() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/phrases/";
    const attr = "reinforce";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_PHRASES_REINFORCE
      );
    } else {
      dispatch({
        type: TOGGLE_PHRASES_REINFORCE,
      });
    }
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
 * @returns {ActCreator}
 */
export function toggleDarkMode() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/global/";
    const attr = "darkMode";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        TOGGLE_DARK_MODE
      );
    } else {
      dispatch({
        type: TOGGLE_DARK_MODE,
      });
    }
  };
}

// /**
//  * @param {typeof DebugLevel[keyof DebugLevel]} override
//  * @returns {ActCreator}
//  */
// export function toggleDebug(override) {
//   return (dispatch, getState) => {
//     const { user } = getState().login;
//     const { debug } = getState().settings.global;

//     const path = "/global/";
//     const attr = "debug";
//     const time = new Date();

//     let newDebug;
//     if (override !== undefined) {
//       if (Object.values(DebugLevel).includes(override)) {
//         newDebug = override;
//       } else {
//         throw new Error("Debug override not valid");
//       }
//     } else {
//       newDebug = Object.values(DebugLevel).includes(debug + 1)
//         ? debug + 1
//         : DebugLevel.OFF;
//     }

//     localStoreAttrUpdate(time, getState, path, attr, newDebug);

//     if (user) {
//       firebaseAttrUpdate(
//         time,
//         dispatch,
//         getState,
//         user.uid,
//         path,
//         attr,
//         DEBUG,
//         newDebug
//       );
//     } else {
//       dispatch({
//         type: DEBUG,
//         value: newDebug,
//       });
//     }
//   };
// }

/**
 * @param {string} value
 * @returns {ActCreator}
 */
export function scrollingState(value) {
  return (dispatch) => {
    dispatch({
      type: SCROLLING_STATE,
      value,
    });
  };
}

/**
 * @returns {ActCreator}
 */
export function toggleAutoVerbView() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "autoVerbView";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        AUTO_VERB_VIEW
      );
    } else {
      dispatch({
        type: AUTO_VERB_VIEW,
      });
    }
  };
}

/**
 * @param {number} number
 * @returns {ActCreator}
 */
export function updateVerbColSplit(number) {
  return (dispatch, getState) => {
    const path = "/vocabulary/";
    const attr = "verbColSplit";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, number);

    dispatch({
      type: VERB_FORM_VIEW,
      value: number,
    });
  };
}

/**
 * Retrieves last App settings state value for path and attr
 * @param {function} getState
 * @param {string} path
 * @param {string} attr
 */
export function getLastStateValue(getState, path, attr) {
  const stateSettings = getState().settings;

  let statePtr = stateSettings;

  path.split("/").forEach((p) => {
    if (p) {
      statePtr = statePtr[p];
    }
  });

  return statePtr[attr];
}

/**
 * @param {number} value Swipe threshold value
 * @returns {ActCreator}
 */
export function setSwipeThreshold(value) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/global/";
    const attr = "swipeThreshold";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, value);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        SET_SWIPE_THRESHOLD
      );
    } else {
      dispatch({
        type: SET_SWIPE_THRESHOLD,
        value,
      });
    }
  };
}

/**
 * @param {number} value Motion threshold value
 * @returns {ActCreator}
 */
export function setMotionThreshold(value) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/global/";
    const attr = "motionThreshold";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, value);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        SET_MOTION_THRESHOLD
      );
    } else {
      dispatch({
        type: SET_MOTION_THRESHOLD,
        value,
      });
    }
  };
}

/**
 * @param {string[]} order
 * @returns {ActCreator}
 */
export function setVerbFormsOrder(order) {
  return (dispatch, getState) => {
    const path = "/vocabulary/";
    const attr = "verbFormsOrder";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, order);

    dispatch({
      type: SET_VERB_FORM_ORDER,
      value: order,
    });
  };
}
