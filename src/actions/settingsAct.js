import firebase from "firebase/app";
import "firebase/database";
import { localStoreAttrUpdate } from "../helper/localStorage";

export const SET_HIRAGANA_BTN_N = "set_hiragana_btn_n";
export const TOGGLE_HIRAGANA_WIDEMODE = "set_hiragana_widemode";
export const SET_VERB_ORDERING = "set_verb_ordering";
export const SET_PHRASES_ORDERING = "set_phrases_ordering";
export const FLIP_PHRASES_PRACTICE_SIDE = "flip_phrases_practice_side";
export const TOGGLE_PHRASES_ROMAJI = "toggle_phrases_romaji";
export const SET_VOCABULARY_ORDERING = "set_vocabulary_ordering";
export const FLIP_VOCABULARY_PRACTICE_SIDE = "flip_vocabulary_practice_side";
export const TOGGLE_VOCABULARY_ROMAJI = "toggle_vocabulary_romaji";
export const TOGGLE_VOCABULARY_HINT = "toggle_vocabulary_hint";
export const SET_OPPOSITES_Q_ROMAJI = "set_opposites_q_romaji";
export const SET_OPPOSITES_A_ROMAJI = "set_opposites_a_romaji";
export const SET_PARTICLES_A_ROMAJI = "set_particles_a_romaji";

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

function firebaseAttrUpdate(time, dispatch, uid, path, attr, aType, value) {
  firebase
    .database()
    .ref("user/" + uid)
    .update({ lastModified: time });

  if (value) {
    const setting = { [attr]: value };

    firebase
      .database()
      .ref("user/" + uid + path)
      .update(setting)
      .then(() => {
        dispatch({
          type: aType,
          value: value,
        });
      })
      .catch(function (e) {
        console.error("set failed");
        console.error(e);
      });
  } else {
    firebase
      .database()
      .ref("user/" + uid + path + attr)
      .once("value")
      .then(function (snapshot) {
        const data = snapshot.val();
        const setting = { [attr]: !data };

        firebase
          .database()
          .ref("user/" + uid + path)
          .update(setting)
          .then(() => {
            dispatch({
              type: aType,
              value: !data,
            });
          })
          .catch(function (e) {
            console.error("update failed");
            console.error(e);
          });
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
