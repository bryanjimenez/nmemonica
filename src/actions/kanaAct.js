import data from "../../data/kana.json";

export const GET_KANA = "get_kana";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 */

/**
 * @returns {ActCreator}
 */
export function getKana() {
  return (dispatch) => {
    dispatch({
      type: GET_KANA,
      hiragana: data.hiragana,
      katakana: data.katakana,
      vowels: data.vowels,
      consonants: data.consonants,
      sounds: data.sounds,
    });
  };
}
