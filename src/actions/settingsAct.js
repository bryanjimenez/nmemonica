export const SET_HIRAGANA_BTN_N = "set_hiragana_btn_n";
export const SET_VERB_ORDERING = "set_verb_ordering";

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
