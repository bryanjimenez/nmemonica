import { firebaseConfig } from "../../environment.development";

export const GET_VOCABULARY = "get_vocabulary";

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
