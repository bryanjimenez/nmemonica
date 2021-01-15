import { localStorageKey } from "../constants/paths";
import { getWindowLocalStorage } from "./browserGlobal";

/**
 * modifies an attribute or toggles the existing value
 * @returns {Promise} a promise which returns the modified localStorage object
 * @param {Date} time
 * @param {*} getState
 * @param {String} path
 * @param {String} attr
 * @param {*} value optional if absent [attr] will be toggled
 */
export function localStoreAttrUpdate(time, getState, path, attr, value) {
  const stateSettings = getState().settings;

  return getLocalStorageSettings(localStorageKey).then((locStoSettings) => {
    locStoSettings = locStoSettings || {};

    let statePtr = stateSettings;
    let localPtr = locStoSettings;

    path.split("/").forEach((p) => {
      if (p) {
        statePtr = statePtr[p];

        if (localPtr[p]) {
          localPtr = localPtr[p];
        } else {
          localPtr[p] = {};
          localPtr = localPtr[p];
        }
      }
    });

    // use value passed else toggle previous value
    localPtr[attr] = value ? value : !statePtr[attr];

    return setLocalStorage(localStorageKey, {
      ...locStoSettings,
      lastModified: time,
    });
  });
}

/**
 * used to store a whole settings object to the localStorage
 * @returns {Promise} a promise which resolves to the object stored
 * @param {String} localStorageKey
 * @param {Object} value
 */
export function setLocalStorage(localStorageKey, value) {
  return new Promise((resolutionFunc, rejectionFunc) => {
    try {
      const localStorage = getWindowLocalStorage();

      localStorage.setItem(localStorageKey, JSON.stringify(value));
      resolutionFunc(value);
    } catch (e) {
      rejectionFunc(e);
    }
  });
}

/**
 * used to retrieve the settings object stored in localStorage
 * @returns {Promise} a promise which resolves to the object stored
 * @param {*} localStorageKey
 */
export function getLocalStorageSettings(localStorageKey) {
  return new Promise((resolutionFunc, rejectionFunc) => {
    let localStorageValue;

    try {
      const localStorage = getWindowLocalStorage();

      const textSettings = localStorage.getItem(localStorageKey);
      let resultObj;
      try {
        resultObj = JSON.parse(textSettings);
      } catch (e) {
        // console.log("localStore parse failed");
        // console.error(e);
        rejectionFunc(e);
      }

      if (
        typeof resultObj === "object" &&
        !Array.isArray(resultObj) &&
        resultObj !== null
      ) {
        localStorageValue = resultObj;
      }
    } catch (e) {
      // console.log("localStore getItem failed");
      // console.error(e);
      rejectionFunc(e);
    }

    resolutionFunc(localStorageValue);
  });
}
