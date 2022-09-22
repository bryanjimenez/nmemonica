import { firebaseConfig } from "../../environment.development";

export const GET_PHRASES = "get_phrases";

/**
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 */

/**
 * @returns {ThenableActCreator}
 */
export function getPhrases() {
  return (dispatch, getState) => {
    const version = getState().version.phrases || 0;

    return fetch(firebaseConfig.databaseURL + "/lambda/phrases.json", {
      headers: { "Data-Version": version },
    })
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_PHRASES,
          value: data,
        })
      );
  };
}
