import { localStorageKey } from "../constants/paths";
import { getWindowLocalStorage } from "../helper/browserGlobal";

/**
 * Modifies an attribute or toggles the existing value
 * @param {Date} time
 * @param {*} state
 * @param {string} path
 * @param {string} attr
 * @param {*} [value] optional if absent [attr] will be toggled
 */
export function localStoreAttrUpdate(time, state, path, attr, value) {
  // const stateSettings = getState().settings;

  let locStoSettings = getLocalStorageSettings(localStorageKey) || {};
  let statePtr = state;
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
}

/**
 * Modifies an attribute or toggles the existing value
 * @param {Date} time
 * @param {string} path
 * @param {string} attr
 */
export function localStoreAttrDelete(time, path, attr) {
  const locStoSettings = getLocalStorageSettings(localStorageKey) || {};

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
}

/**
 * Store a whole settings object to the localStorage
 * @param {string} localStorageKey
 * @param {*} value
 */
export function setLocalStorage(localStorageKey, value) {
  try {
    const localStorage = getWindowLocalStorage();

    localStorage.setItem(localStorageKey, JSON.stringify(value));
  } catch (e) {
    console.log("setLocalStorage failed");
    console.error(e);
  }
}

/**
 * Retrieve the settings object stored in localStorage
 * @param {string} localStorageKey
 */
export function getLocalStorageSettings(localStorageKey) {
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
      console.error("localStore parse failed");
      console.error(e);
    }

    if (
      typeof resultObj === "object" &&
      !Array.isArray(resultObj) &&
      resultObj !== null
    ) {
      localStorageValue = resultObj;
    }
  } catch (e) {
    console.error("localStore getItem failed");
    console.error(e);
  }

  return localStorageValue;
}
