import firebase from "firebase/app";
import "firebase/database";

export const SET_HIRAGANA_BTN_N = "set_hiragana_btn_n";
export const SET_VERB_ORDERING = "set_verb_ordering";
export const SET_PHRASES_ORDERING = "set_phrases_ordering";
export const FLIP_PHRASES_PRACTICE_SIDE = "flip_phrases_practice_side";
export const TOGGLE_PHRASES_ROMAJI = "toggle_phrases_romaji";
export const SET_OPPOSITES_Q_ROMAJI = "set_opposites_q_romaji";
export const SET_OPPOSITES_A_ROMAJI = "set_opposites_a_romaji";
export const SET_PARTICLES_A_ROMAJI = "set_particles_a_romaji";

export function setHiraganaBtnN(number) {
  return (dispatch, getState) => {
    const { user } = getState().login;

    if (user) {
      firebaseAttrSet(
        dispatch,
        user.uid,
        "/hiragana/",
        "choiceN",
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

export function setVerbsOrdering() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    if (user) {
      firebaseAttrToggle(
        dispatch,
        user.uid,
        "/verbs/",
        "ordered",
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

    if (user) {
      firebaseAttrToggle(
        dispatch,
        user.uid,
        "/phrases/",
        "ordered",
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

    if (user) {
      firebaseAttrToggle(
        dispatch,
        user.uid,
        "/phrases/",
        "practiceSide",
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

    if (user) {
      firebaseAttrToggle(
        dispatch,
        user.uid,
        "/phrases/",
        "romaji",
        TOGGLE_PHRASES_ROMAJI
      );
    } else {
      dispatch({
        type: TOGGLE_PHRASES_ROMAJI,
      });
    }
  };
}

export function setOppositesQRomaji() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    if (user) {
      firebaseAttrToggle(
        dispatch,
        user.uid,
        "/opposites/",
        "qRomaji",
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

    if (user) {
      firebaseAttrToggle(
        dispatch,
        user.uid,
        "/opposites/",
        "aRomaji",
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

    if (user) {
      firebaseAttrToggle(
        dispatch,
        user.uid,
        "/particles/",
        "aRomaji",
        SET_PARTICLES_A_ROMAJI
      );
    } else {
      dispatch({
        type: SET_PARTICLES_A_ROMAJI,
      });
    }
  };
}

function firebaseAttrToggle(dispatch, uid, path, attr, aType) {
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

function firebaseAttrSet(dispatch, uid, path, attr, aType, value) {
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
}
