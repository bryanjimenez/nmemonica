export const SET_SHOWN_FORM = "set_shown_form";

export function setShownForm(form) {
  return (dispatch) => {
    dispatch({
      type: SET_SHOWN_FORM,
      value: form,
    });
  };
}
