import data from "../../data/hiragana.json";

export const GET_HIRAGANA = "get_hiragana";

export function getHiragana() {
  return (dispatch) => {
    dispatch({
      type: GET_HIRAGANA,
      hiragana: data.hiragana,
      vowels: data.vowels,
      consonants: data.consonants,
      sounds: data.sounds,
    });
  };
}
