import { SERVICE_WORKER_LOGGER_MSG } from "./serviceWorkerAct";
import { DebugLevel } from "./settingsAct";

export const UI_LOGGER_MSG = "ui_logger_msg";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 */

/**
 * UI logger
 * @param {string} msg
 * @param {typeof DebugLevel[keyof DebugLevel]} [lvl]
 * @param {string} [type]
 * @returns {ActCreator}
 */
export function logger(msg, lvl=DebugLevel.DEBUG, type = UI_LOGGER_MSG) {
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
