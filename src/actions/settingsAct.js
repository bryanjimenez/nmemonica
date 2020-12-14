export const SET_HIRAGANA_BTN_N = "set_hiragana_btn_n";
export const SET_VERB_ORDERING = "set_verb_ordering";
export const SET_PHRASES_ORDERING = "set_phrases_ordering";
export const FLIP_PHRASES_PRACTICE_SIDE = "flip_phrases_practice_side";

export function setHiraganaBtnN(number) {
  return (dispatch) => {
    dispatch({
      type: SET_HIRAGANA_BTN_N,
      value: number,
    });
  };
}

export function setVerbsOrdering() {
  return (dispatch) => {
    dispatch({
      type: SET_VERB_ORDERING,
    });
  };
}

export function setPhrasesOrdering() {
  return (dispatch) => {
    dispatch({
      type: SET_PHRASES_ORDERING,
    });
  };
}

export function flipPhrasesPracticeSide() {
  return (dispatch) => {
    dispatch({
      type: FLIP_PHRASES_PRACTICE_SIDE,
    });
  };
}
