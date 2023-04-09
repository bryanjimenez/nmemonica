import { GET_PHRASES } from "./phrasesAct";
import {
  addFrequencyTerm,
  ADD_FREQUENCY_PHRASE,
  ADD_FREQUENCY_WORD,
} from "./settingsAct";

export const SERVICE_WORKER_REGISTERED = "service_worker_registered";
export const SERVICE_WORKER_LOGGER_MSG = "service_worker_logger_msg";
export const SERVICE_WORKER_NEW_TERMS_ADDED = "service_worker_new_terms";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 */

/**
 * @returns {ActCreator}
 */
export function registerServiceWorker() {
  return (dispatch) => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      return navigator.serviceWorker.register("sw.js").then(() =>
        dispatch({
          type: SERVICE_WORKER_REGISTERED,
        })
      );
    }
  };
}

/**
 * @param {*} newestWords
 * @returns {ActCreator}
 */
export function serviceWorkerNewTermsAdded(newestWords) {
  return (dispatch, getState) => {
    for (let termType in newestWords) {
      const uidArr = newestWords[termType].freq;
      const termObj = newestWords[termType].dic;

      // if (termType === "vocabulary")
      let actType = ADD_FREQUENCY_WORD;
      let type = "GET_VOCABULARY";

      if (termType === "phrases") {
        actType = ADD_FREQUENCY_PHRASE;
        type = GET_PHRASES;
      }

      addFrequencyTerm(actType, uidArr)(dispatch, getState).then(() => {
        // TODO: serviceWorkerNewTermsAdded
        if (termType === "phrases") {
          dispatch({
            type,
            value: termObj,
          });
        }
      });
    }
  };
}
