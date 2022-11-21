import { firebaseConfig } from "../../environment.development";

export const GET_VOCABULARY = "get_vocabulary";
export const SET_PREVIOUS_SEEN_TERM = "set_previous_seen_term";
export const CLEAR_PREVIOUS_SEEN_TERM = "clear_previous_seen_term";
export const SET_PUSHED_PLAY = "set_pushed_play";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../components/Pages/Phrases").RawPhrase} RawPhrase
 */

/**
 * Fetches vocabulary
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
 * @param {{lastTerm?: RawVocabulary|RawPhrase, lastVerb?: RawVocabulary}} term
 * @_return {ThenableActCreator}
 * @_yield {Promise<void>}
 * @return {Promise<void>} TODO: connect function call strips outer function
 */
export function setPreviousTerm({ lastTerm, lastVerb }) {
  // @ts-expect-error
  return (dispatch) => {
    return new Promise((resolve) => {
      dispatch({
        type: SET_PREVIOUS_SEEN_TERM,
        term: lastTerm,
        verb: lastVerb,
      });
      // @ts-expect-error
      resolve();
    });
  };
}

export function clearPreviousTerm() {
  return (/** @type {function} */ dispatch) => {
    dispatch({
      type: CLEAR_PREVIOUS_SEEN_TERM,
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
