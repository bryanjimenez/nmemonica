import { GET_PHRASES } from "./phrasesAct";
import {
  addFrequencyTerm,
  ADD_FREQUENCY_PHRASE,
  ADD_FREQUENCY_WORD,
} from "./settingsAct";
import { GET_VOCABULARY } from "./vocabularyAct";

export const SERVICE_WORKER_REGISTERED = "service_worker_registered";

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

export function serviceWorkerEventListeners() {
  return (dispatch, getState) => {
    if ("serviceWorker" in navigator) {
      // set event listener

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "NEW_TERMS_ADDED") {
          const newestWords = event.data.msg;

          for (let termType in newestWords) {
            const uidArr = newestWords[termType].freq;
            const termObj = newestWords[termType].dic;

            let type;
            let actType;
            if (termType === "vocabulary") {
              actType = ADD_FREQUENCY_WORD;
              type = GET_VOCABULARY;
            } else if (termType === "phrases") {
              actType = ADD_FREQUENCY_PHRASE;
              type = GET_PHRASES;
            }

            addFrequencyTerm(actType, uidArr)(dispatch, getState).then(() => {
              dispatch({
                type,
                value: termObj,
              });
            });
          }
        }
      });
    }
  };
}
