import { firebaseConfig } from "../../environment.development";

export const GET_VOCABULARY = "get_vocabulary";
export const SET_PREVIOUS_SEEN_WORD = "set_previous_seen_word";
export const SET_PUSHED_PLAY = "set_pushed_play";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * @return {ActCreator}
 */
export function getVocabulary() {
  return (dispatch, getState) => {
    const version = getState().version.vocabulary || 0;

    return fetch(firebaseConfig.databaseURL + "/lambda/vocabulary.json", {
      headers: { "Data-Version": version },
    })
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_VOCABULARY,
          value: data,
        })
      );
  };
}

/**
 * @param {RawVocabulary} word
 * @returns {ThenableActCreator}
 */
export function setPreviousWord(word) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      dispatch({
        type: SET_PREVIOUS_SEEN_WORD,
        value: word,
      });

      resolve(word);
    });
  };
}

/**
 * @param {boolean} value
 * @returns {ActCreator}
 */
export function pushedPlay(value) {
  return (dispatch) => {
    dispatch({
      type: SET_PUSHED_PLAY,
      value,
    });
  };
}
