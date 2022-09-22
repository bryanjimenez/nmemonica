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
export const SET_VOCABULARY_ORDERING = "set_vocabulary_ordering";
export const FLIP_VOCABULARY_PRACTICE_SIDE = "flip_vocabulary_practice_side";
export const TOGGLE_VOCABULARY_ROMAJI = "toggle_vocabulary_romaji";
export const TOGGLE_VOCABULARY_HINT = "toggle_vocabulary_hint";
export const TOGGLE_VOCABULARY_FILTER = "toggle_vocabulary_filter";
export const TOGGLE_VOCABULARY_ACTIVE_GROUP = "toggle_vocabulary_active_group";
export const TOGGLE_VOCABULARY_AUTO_PLAY = "toggle_vocabulary_auto_play";
export const TOGGLE_VOCABULARY_REINFORCE = "toggle_vocabulary_reinforce";
export const TOGGLE_KANJI_FILTER = "toggle_kanji_filter";
export const TOGGLE_KANJI_ACTIVE_GROUP = "toggle_kanji_active_group";
export const SET_OPPOSITES_Q_ROMAJI = "set_opposites_q_romaji";
export const SET_OPPOSITES_A_ROMAJI = "set_opposites_a_romaji";
export const SET_PARTICLES_A_ROMAJI = "set_particles_a_romaji";
export const ADD_FREQUENCY_WORD = "add_frequency_word";
export const REMOVE_FREQUENCY_WORD = "remove_frequency_word";
export const ADD_FREQUENCY_PHRASE = "add_frequency_phrase";
export const REMOVE_FREQUENCY_PHRASE = "remove_frequency_phrase";
export const TOGGLE_PHRASES_FILTER = "toggle_phrases_filter";
export const TOGGLE_PHRASES_REINFORCE = "toggle_phrases_reinforce";
export const TOGGLE_DARK_MODE = "toggle_dark_mode";
export const SCROLLING_STATE = "scrolling_state";
export const AUTO_VERB_VIEW = "auto_verb_view";
export const VERB_FORM_VIEW = "verb_form_view";
export const ADD_SPACE_REP_WORD = "add_space_rep_word";
export const ADD_SPACE_REP_PHRASE = "add_space_rep_phrase";
export const DEBUG = "toggle_debug";
export const TOGGLE_SWIPE = "toggle_swipe";
export const SET_VERB_FORM_ORDER = "set_verb_form_order";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 */

export const DEBUG_OFF = 0,
  DEBUG_ERROR = 1,
  DEBUG_WARN = 2,
  DEBUG_ON = 3;

export const FILTER_GRP = 0,
  FILTER_FREQ = 1,
  FILTER_REP = 2;

/**
 * @typedef {FILTER_GRP|FILTER_FREQ|FILTER_REP} TermFilterBy
 * @typedef {DEBUG_OFF|DEBUG_ERROR|DEBUG_WARN|DEBUG_ON} DebugLevel
 */

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
    const { charSet, easyMode } = getState().settings.kana;

    const newCharSet = charSet + 1 < 3 ? charSet + 1 : 0;

    const path = "/kana/";
    const attr = "charSet";
    const time = new Date();
    localStoreAttrUpdate(time, getState, path, attr, newCharSet);

    if (newCharSet < 2 && easyMode) {
      toggleKanaEasyMode()(dispatch, getState);
    }

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
export function setPhrasesOrdering() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/phrases/";
    const attr = "ordered";
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
        SET_PHRASES_ORDERING
      );
    } else {
      dispatch({
        type: SET_PHRASES_ORDERING,
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
export function setVocabularyOrdering() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "ordered";
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
        SET_VOCABULARY_ORDERING
      );
    } else {
      dispatch({
        type: SET_VOCABULARY_ORDERING,
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
export function toggleVocabularyHint() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "hint";
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
 * toggle between groups, frequency, and spaced repetition
 * @param {TermFilterBy} override
 * @returns {ActCreator}
 */
export function toggleVocabularyFilter(override) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { filter, reinforce } = getState().settings.vocabulary;

    const path = "/vocabulary/";
    const attr = "filter";
    const time = new Date();

    let newFilter;
    if (override !== undefined) {
      newFilter = override;
    } else {
      newFilter = filter + 1 < 3 ? filter + 1 : 0;
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
 * @param {string} grpName
 * @returns {ActCreator}
 */
export function toggleActiveGrp(parent, grpName) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { activeGroup } = getState().settings[parent];

    let action;
    if (parent === "kanji") {
      action = TOGGLE_KANJI_ACTIVE_GROUP;
    } else if (parent === "vocabulary") {
      action = TOGGLE_VOCABULARY_ACTIVE_GROUP;
    } else if (parent === "phrases") {
      action = TOGGLE_PHRASES_ACTIVE_GROUP;
    }

    const newValue = grpParse(grpName, activeGroup);

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

export const AUTOPLAY_OFF = 0,
  AUTOPLAY_EN_JP = 1,
  AUTOPLAY_JP_EN = 2;
/**
 * @returns {ActCreator}
 */
export function toggleVocabularyAutoPlay() {
  return (dispatch, getState) => {
    const { autoPlay } = getState().settings.vocabulary;

    const newValue = autoPlay + 1 < 3 ? autoPlay + 1 : 0;

    dispatch({
      type: TOGGLE_VOCABULARY_AUTO_PLAY,
      value: newValue,
    });
  };
}

/**
 * @returns {ActCreator}
 */
export function setOppositesQRomaji() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/opposites/";
    const attr = "qRomaji";
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
        SET_OPPOSITES_Q_ROMAJI
      );
    } else {
      dispatch({
        type: SET_OPPOSITES_Q_ROMAJI,
      });
    }
  };
}

/**
 * @returns {ActCreator}
 */
export function setOppositesARomaji() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/opposites/";
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
        SET_OPPOSITES_A_ROMAJI
      );
    } else {
      dispatch({
        type: SET_OPPOSITES_A_ROMAJI,
      });
    }
  };
}

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
  return addFrequencyTerm(ADD_FREQUENCY_WORD, [uid]);
}

/**
 * @param {string} uid
 * @returns {ActCreator}
 */
export function removeFrequencyWord(uid) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "frequency";
    const time = new Date();
    const currVal = /** @type {string[]} */ (
      getLastStateValue(getState, path, attr)
    );
    const newValue = currVal.filter((i) => i !== uid);
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        ADD_FREQUENCY_WORD,
        newValue
      );
    } else {
      dispatch({
        type: REMOVE_FREQUENCY_WORD,
        value: newValue,
      });
    }
  };
}

/**
 * @param {string} uid
 */
export function addFrequencyPhrase(uid) {
  return addFrequencyTerm(ADD_FREQUENCY_PHRASE, [uid]);
}

/**
 * @param {string} uid
 * @returns {ActCreator}
 */
export function removeFrequencyPhrase(uid) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/phrases/";
    const attr = "frequency";
    const time = new Date();
    const currVal = /** @type {string[]}*/ (
      getLastStateValue(getState, path, attr)
    );
    const newValue = currVal.filter((i) => i !== uid);
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        REMOVE_FREQUENCY_PHRASE,
        newValue
      );
    } else {
      dispatch({
        type: REMOVE_FREQUENCY_PHRASE,
        value: newValue,
      });
    }
  };
}

/**
 * @param {string} aType
 * @param {string[]} uidArr
 * @returns {ThenableActCreator}
 */
export function addFrequencyTerm(aType, uidArr) {
  return (dispatch, getState) =>
    new Promise((resolve, reject) => {
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
    });
}

/**
 * @param {string} uid
 * @param {boolean} [shouldIncrement]
 */
export function updateSpaceRepWord(uid, shouldIncrement = true) {
  return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, shouldIncrement);
}

/**
 * @param {string} uid
 * @param {boolean} [shouldIncrement]
 */
export function updateSpaceRepPhrase(uid, shouldIncrement = true) {
  return updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, shouldIncrement);
}

/**
 * @param {string} uid
 */
export function toggleFurigana(uid) {
  return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, false, { toggle: ["f"] });
}

/**
 * @param {string} aType
 * @param {string} uid
 * @param {boolean} shouldIncrement
 * @param {*} [options]
 * @returns {ActCreator}
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
    }

    const path = "/" + pathPart + "/";
    const attr = "repetition";
    const time = new Date();

    const spaceRep = getLastStateValue(getState, path, attr);

    let count;
    if (spaceRep[uid] && spaceRep[uid].c > 0 && shouldIncrement) {
      count = spaceRep[uid].c + 1;
    } else if (spaceRep[uid] && spaceRep[uid].c > 0 && !shouldIncrement) {
      count = spaceRep[uid].c;
    } else {
      count = 1;
    }

    let toggled = {};
    if (options && options.toggle) {
      toggled = options.toggle.reduce((acc, attr) => {
        // this default is only for furigana so far
        const val = !(spaceRep[uid] && spaceRep[uid][attr] === false) || false;
        return { ...acc, [attr]: !val };
      }, {});
    }

    const now = new Date().toJSON();
    const o = { ...(spaceRep[uid] || {}), c: count, d: now, ...toggled };

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

    return o;
  };
}

/**
 * @param {TermFilterBy} override
 * @returns {ActCreator}
 */
export function togglePhrasesFilter(override) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { filter, reinforce } = getState().settings.phrases;

    const path = "/phrases/";
    const attr = "filter";
    const time = new Date();

    let newFilter;
    if (override !== undefined) {
      newFilter = override;
    } else {
      newFilter = filter + 1 < 3 ? filter + 1 : 0;
    }

    localStoreAttrUpdate(time, getState, path, attr, newFilter);

    if (newFilter !== FILTER_GRP && reinforce) {
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
 * Adds or removes grpName to the activeGroup list
 * @param {string} grpName a group name to be toggled
 * @param {string[]} activeGroup a list of groups that are selected
 * @returns {string[]} newValue an updated list of selected groups
 */
export function grpParse(grpName, activeGroup) {
  const isGrp = grpName.indexOf(".") === -1;

  let newValue;
  if (isGrp) {
    if (activeGroup.some((e) => e.indexOf(grpName + ".") !== -1)) {
      newValue = [
        ...activeGroup.filter((v) => v.indexOf(grpName + ".") === -1),
        grpName,
      ];
    } else if (activeGroup.includes(grpName)) {
      newValue = [...activeGroup.filter((v) => v !== grpName)];
    } else {
      newValue = [...activeGroup, grpName];
    }
  } else {
    newValue = activeGroup.includes(grpName)
      ? activeGroup.filter((v) => v !== grpName)
      : [...activeGroup, grpName];
  }
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

/**
 * @param {DebugLevel} override
 * @returns {ActCreator}
 */
export function toggleDebug(override) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { debug } = getState().settings.global;

    const path = "/global/";
    const attr = "debug";
    const time = new Date();

    let newDebug;
    if (override !== undefined) {
      if (override >= DEBUG_OFF && override <= DEBUG_ON) {
        newDebug = override;
      } else {
        throw new Error("Debug override not valid");
      }
    } else {
      newDebug = debug + 1 < 4 ? debug + 1 : 0;
    }

    localStoreAttrUpdate(time, getState, path, attr, newDebug);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        DEBUG,
        newDebug
      );
    } else {
      dispatch({
        type: DEBUG,
        value: newDebug,
      });
    }
  };
}

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
 * @param {function} getState
 * @param {string} path
 * @param {string} attr
 * @returns {*}
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
 * @returns {ActCreator}
 */
export function toggleSwipe() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/global/";
    const attr = "touchSwipe";
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
        TOGGLE_SWIPE
      );
    } else {
      dispatch({
        type: TOGGLE_SWIPE,
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
