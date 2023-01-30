import { localStorageKey } from "../constants/paths";
import { getWindowLocalStorage } from "./browserGlobal";

/**
 * modifies an attribute or toggles the existing value
 * @returns {Promise<*>} a promise which returns the modified localStorage object
 * @param {Date} time
 * @param {function} getState
 * @param {string} path
 * @param {string} attr
 * @param {*} [value] optional if absent [attr] will be toggled
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
    if (value !== undefined) {
      localPtr[attr] = value;
    } else if (statePtr[attr] === true || statePtr[attr] === false) {
      localPtr[attr] = !statePtr[attr];
    } else {
      console.error("failed localStoreAttrUpdate");
    }

    return setLocalStorage(localStorageKey, {
      ...locStoSettings,
      lastModified: time,
    });
  });
}

/**
 * modifies an attribute or toggles the existing value
 * @returns {Promise<*>} a promise which returns the modified localStorage object
 * @param {Date} time
 * @param {string} path
 * @param {string} attr
 */
export function localStoreAttrDelete(time, path, attr) {
  return getLocalStorageSettings(localStorageKey).then((locStoSettings) => {
    locStoSettings = locStoSettings || {};

    let localPtr = locStoSettings;

    path.split("/").forEach((p) => {
      if (p) {
        if (localPtr[p]) {
          localPtr = localPtr[p];
        } else {
          localPtr[p] = {};
          localPtr = localPtr[p];
        }
      }
    });

    localPtr[attr] = undefined;

    return setLocalStorage(localStorageKey, {
      ...locStoSettings,
      lastModified: time,
    });
  });
}

/**
 * used to store a whole settings object to the localStorage
 * @returns {Promise<*>} a promise which resolves to the object stored
 * @param {string} localStorageKey
 * @param {Object} value
 */
export function setLocalStorage(localStorageKey, value) {
  return new Promise((resolve, reject) => {
    try {
      const localStorage = getWindowLocalStorage();

      localStorage.setItem(localStorageKey, JSON.stringify(value));
      resolve(value);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * used to retrieve the settings object stored in localStorage
 * @returns {Promise<*>} a promise which resolves to the object stored
 * @param {string} localStorageKey
 */
export function getLocalStorageSettings(localStorageKey) {
  return new Promise((resolve, reject) => {
    let localStorageValue;

    try {
      const localStorage = getWindowLocalStorage();

      const textSettings = localStorage.getItem(localStorageKey);
      let resultObj;
      try {
        if (textSettings) {
          resultObj = JSON.parse(textSettings);
        }
      } catch (e) {
        // console.log("localStore parse failed");
        // console.error(e);
        reject(e);
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
      reject(e);
    }

    resolve(localStorageValue);
  });
}
