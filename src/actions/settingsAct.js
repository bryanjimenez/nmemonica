import firebase from "firebase/app";
import "firebase/database";
import { localStoreAttrUpdate } from "../helper/localStorage";

export const SET_HIRAGANA_BTN_N = "set_hiragana_btn_n";
export const TOGGLE_HIRAGANA_WIDEMODE = "set_hiragana_widemode";
export const SET_VERB_ORDERING = "set_verb_ordering";
export const SET_VERB_MASU = "set_verb_masu";
export const SET_PHRASES_ORDERING = "set_phrases_ordering";
export const FLIP_PHRASES_PRACTICE_SIDE = "flip_phrases_practice_side";
export const TOGGLE_PHRASES_ROMAJI = "toggle_phrases_romaji";
export const SET_VOCABULARY_ORDERING = "set_vocabulary_ordering";
export const FLIP_VOCABULARY_PRACTICE_SIDE = "flip_vocabulary_practice_side";
export const TOGGLE_VOCABULARY_ROMAJI = "toggle_vocabulary_romaji";
export const TOGGLE_VOCABULARY_HINT = "toggle_vocabulary_hint";
export const TOGGLE_VOCABULARY_ACTIVE_GROUP = "toggle_vocabulary_active_group";
export const TOGGLE_VOCABULARY_AUTO_PLAY = "toggle_vocabulary_auto_play";
export const SET_OPPOSITES_Q_ROMAJI = "set_opposites_q_romaji";
export const SET_OPPOSITES_A_ROMAJI = "set_opposites_a_romaji";
export const SET_PARTICLES_A_ROMAJI = "set_particles_a_romaji";
export const ADD_FREQUENCY_WORD = "add_frequency_word";
export const REMOVE_FREQUENCY_WORD = "remove_frequency_word";
export const TOGGLE_DARK_MODE = "toggle_dark_mode";
export const SCROLLING_STATE = "scrolling_state";

export function setHiraganaBtnN(number) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/hiragana/";
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
        SET_HIRAGANA_BTN_N,
        number
      );
    } else {
      dispatch({
        type: SET_HIRAGANA_BTN_N,
        value: number,
      });
    }
  };
}

export function toggleHiraganaWideMode() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/hiragana/";
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
        TOGGLE_HIRAGANA_WIDEMODE
      );
    } else {
      dispatch({
        type: TOGGLE_HIRAGANA_WIDEMODE,
      });
    }
  };
}

export function setVerbsOrdering() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/verbs/";
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
        SET_VERB_ORDERING
      );
    } else {
      dispatch({
        type: SET_VERB_ORDERING,
      });
    }
  };
}

export function setVerbsMasu() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    const path = "/verbs/";
    const attr = "masu";
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
        SET_VERB_MASU
      );
    } else {
      dispatch({
        type: SET_VERB_MASU,
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

export function toggleVocabularyActiveGrp(grpName) {
  return (dispatch, getState) => {
    const { user } = getState().login;
    const { activeGroup } = getState().settings.vocabulary;

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

function getLastStateValue(getState, path, attr) {
  const stateSettings = getState().settings;

  let statePtr = stateSettings;

  path.split("/").forEach((p) => {
    if (p) {
      statePtr = statePtr[p];
    }
  });

  return statePtr[attr];
}

function firebaseAttrUpdate(
  time,
  dispatch,
  getState,
  uid,
  path,
  attr,
  aType,
  value
) {
  let setting;
  if (value) {
    setting = { [attr]: value };
  } else {
    const currVal = getLastStateValue(getState, path, attr);
    setting = { [attr]: !currVal };
  }

  firebase
    .database()
    .ref("user/" + uid)
    .update({ lastModified: time });

  firebase
    .database()
    .ref("user/" + uid + path)
    .update(setting)
    .then(() => {
      dispatch({
        type: aType,
        value: setting[attr],
      });
    })
    .catch(function (e) {
      console.error("update failed");
      console.error(e);
    });
}
