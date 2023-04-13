import { localStorageKey } from "../constants/paths";
import { getWindowLocalStorage } from "./browserGlobal";

/**
 * Reads a value from storage
 * @template {Object} T
 * @param {T} storage
 * @param {[keyof T, ...string[]]} path
 * @return {unknown}
 */
function usingPathRead(storage, path) {
  if (path.length === 1) {
    const attr = path[0];
    return storage[attr];
  }

  const [first, ...rest] = path;

  return usingPathRead(storage[first], rest);
}

/**
 * Writes a value to storage
 * @template {Object} T
 * @param {T} storage
 * @param {[keyof T, ...string[]]} path
 * @param {unknown} value
 * @return {T}
 */
function usingPathWrite(storage, path, value) {
  if (path.length === 1) {
    const attr = path[0];
    return { ...storage, [attr]: value };
  }

  const [first, ...rest] = path;

  return {
    ...storage,
    [first]: usingPathWrite(storage[first] || {}, rest, value),
  };
}

/**
 * Modifies an attribute or toggles the existing value
 * @template {unknown} T
 * @param {Date} time
 * @param {Partial<SettingState>} state
 * @param {string} path
 * @param {string} attr
 * @param {T | boolean} [value] optional if absent [attr] will be toggled
 * @returns {unknown extends T ? boolean : T}
 */
export function localStoreAttrUpdate(time, state, path, attr, value) {
  /** @type {SettingState}*/
  let locStoSettings = getLocalStorageSettings(localStorageKey) || {};

  /** @type {[keyof SettingState, ...string[]]} */
  const cleanPath = [...path.split("/").filter((p) => p !== ""), attr];

  if(value===undefined){
    // toggle
    value = !usingPathRead(state, cleanPath);
  }

  const modifiedLocalStorage = usingPathWrite({...locStoSettings}, cleanPath, value)
  const modifiedValue = /** @type {T | boolean} */ (usingPathRead(modifiedLocalStorage, cleanPath));

  setLocalStorage(localStorageKey, {
    ...modifiedLocalStorage,
    lastModified: time,
  });

  return modifiedValue;
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
