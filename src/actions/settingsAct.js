import { localStoreAttrUpdate } from "../helper/localStorage";
import { firebaseAttrUpdate } from "./firebase";
import { FILTER_GRP } from "../reducers/settingsRed";
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
export const ADD_SPACE_REP_WORD = "add_space_rep_word";
export const ADD_SPACE_REP_PHRASE = "add_space_rep_phrase";

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

export function toggleVocabularyActiveGrp(grpName) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { activeGroup } = getState().settings.vocabulary;

    const newValue = grpParse(grpName, activeGroup);

    const path = "/vocabulary/";
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
        TOGGLE_VOCABULARY_ACTIVE_GROUP,
        newValue
      );
    } else {
      dispatch({
        type: TOGGLE_VOCABULARY_ACTIVE_GROUP,
        value: newValue,
      });
    }
  };
}

export function toggleVocabularyAutoPlay() {
  return (dispatch) => {
    // const { user } = getState().login;

    // const path = "/vocabulary/";
    // const attr = "autoPlay";
    // const time = new Date();
    // localStoreAttrUpdate(time, getState, path, attr);

    // if (user) {
    //   firebaseAttrUpdate(
    //     time,
    //     dispatch,
    //     getState,
    //     user.uid,
    //     path,
    //     attr,
    //     TOGGLE_VOCABULARY_AUTO_PLAY
    //   );
    // } else {
    dispatch({
      type: TOGGLE_VOCABULARY_AUTO_PLAY,
    });
    // }
  };
}

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

export function addFrequencyWord(uid) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "frequency";
    const time = new Date();

    const uidList = getLastStateValue(getState, path, attr);
    const newValue = [...uidList, uid];
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
        type: ADD_FREQUENCY_WORD,
        value: newValue,
      });
    }
  };
}

export function removeFrequencyWord(uid) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/vocabulary/";
    const attr = "frequency";
    const time = new Date();
    const currVal = getLastStateValue(getState, path, attr);
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

export function addFrequencyPhrase(uid) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/phrases/";
    const attr = "frequency";
    const time = new Date();

    const uidList = getLastStateValue(getState, path, attr);
    const newValue = [...uidList, uid];
    localStoreAttrUpdate(time, getState, path, attr, newValue);

    if (user) {
      firebaseAttrUpdate(
        time,
        dispatch,
        getState,
        user.uid,
        path,
        attr,
        ADD_FREQUENCY_PHRASE,
        newValue
      );
    } else {
      dispatch({
        type: ADD_FREQUENCY_PHRASE,
        value: newValue,
      });
    }
  };
}

export function removeFrequencyPhrase(uid) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/phrases/";
    const attr = "frequency";
    const time = new Date();
    const currVal = getLastStateValue(getState, path, attr);
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

export function updateSpaceRepWord(uid, shouldIncrement = true) {
  return updateSpaceRepTerm(ADD_SPACE_REP_WORD, uid, shouldIncrement);
}

export function updateSpaceRepPhrase(uid, shouldIncrement = true) {
  return updateSpaceRepTerm(ADD_SPACE_REP_PHRASE, uid, shouldIncrement);
}

export function updateSpaceRepTerm(aType, uid, shouldIncrement = true) {
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

    const now = new Date().toJSON();
    const o = { c: count, d: now };

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
 * @param {*} grpName a group name to be toggled
 * @param {*} activeGroup a list of groups that are selected
 * @returns {Array} newValue an updated list of selected groups
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

export function togglePhrasesActiveGrp(grpName) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { activeGroup } = getState().settings.phrases;

    const newValue = grpParse(grpName, activeGroup);

    const path = "/phrases/";
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
        TOGGLE_PHRASES_ACTIVE_GROUP,
        newValue
      );
    } else {
      dispatch({
        type: TOGGLE_PHRASES_ACTIVE_GROUP,
        value: newValue,
      });
    }
  };
}

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

export function scrollingState(value) {
  return (dispatch) => {
    dispatch({
      type: SCROLLING_STATE,
      value,
    });
  };
}

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
