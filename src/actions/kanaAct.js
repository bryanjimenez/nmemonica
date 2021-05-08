import data from "../../data/kana.json";

export const GET_KANA = "get_kana";

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
