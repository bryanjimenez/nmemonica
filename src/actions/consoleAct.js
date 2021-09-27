import { SERVICE_WORKER_LOGGER_MSG } from "./serviceWorkerAct";

export const UI_LOGGER_MSG = "ui_logger_msg";

/**
 *
 * @param {String} msg
 * @param {Number} lvl
 * @param {String} type
 * @returns
 */
export function logger(msg, lvl, type = UI_LOGGER_MSG) {
  return (dispatch, getState) => {
    const { debug } = getState().settings.global;
    if (debug !== 0 && lvl <= debug) {
      let m;
      if (type === SERVICE_WORKER_LOGGER_MSG) {
        m = "SW: " + msg;
      } else {
        m = "UI: " + msg;
      }

      dispatch({
        type,
        value: { msg: m, lvl },
      });
    }
  };
}
