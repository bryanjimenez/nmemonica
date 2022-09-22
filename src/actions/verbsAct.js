export const SET_SHOWN_FORM = "set_shown_form";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 */

/**
 * Set the shown verb form in the state
 * @param {string} form
 * @returns {ActCreator}
 */
export function setShownForm(form) {
  return (dispatch) => {
    dispatch({
      type: SET_SHOWN_FORM,
      value: form,
    });
  };
}
