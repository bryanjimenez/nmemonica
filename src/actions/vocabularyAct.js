import { firebaseConfig } from "../../environment.development";

export const GET_VOCABULARY = "get_vocabulary";
export const SET_PREVIOUS_SEEN_WORD = "set_previous_seen_word";
export const SET_PUSHED_PLAY = "set_pushed_play";

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

export function setPreviousWord(word) {
  return (dispatch) => {
    dispatch({
      type: SET_PREVIOUS_SEEN_WORD,
      value: word,
    });
  };
}

export function pushedPlay(value) {
  return (dispatch) => {
    dispatch({
      type: SET_PUSHED_PLAY,
      value,
    });
  };
}
