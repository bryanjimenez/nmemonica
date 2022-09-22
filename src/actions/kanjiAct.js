import { firebaseConfig } from "../../environment.development";

export const GET_KANJI = "get_kanji";

/**
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 */

/**
 * @returns {ThenableActCreator}
 */
export function getKanji() {
  return (dispatch, getState) => {
    const version = getState().version.kanji || 0;

    return fetch(firebaseConfig.databaseURL + "/lambda/kanji.json", {
      headers: { "Data-Version": version },
    })
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_KANJI,
          value: data,
        })
      );
  };
}
