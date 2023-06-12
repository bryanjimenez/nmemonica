import { localStorageKey } from "../constants/paths";
import { getWindowLocalStorage } from "./browserGlobal";

/**
 * Reads a value from storage
 */
function usingPathRead<T>(storage:Record<string,T>, path:string[]): T {
  if (path.length === 1) {
    const attr = path[0];
    return storage[attr];
  }

  const [first, ...rest] = path;

  const child = storage[first] as Record<string,T>;
  return usingPathRead(child, rest);
}

/**
 * Writes a value to storage
 * @template {Object} T
 * @param {T} storage
 * @param {[keyof T, ...string[]]} path
 * @param {unknown} value
 * @return {T}
 */
function usingPathWrite(storage:Record<string,T>, path:string[], value:T):Record<string,T> {
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
 * @param time
 * @param state
 * @param path
 * @param attr
 * @param value optional if absent [attr] will be toggled
 */
export function localStoreAttrUpdate<T>(time:Date, state:Partial<SettingState>, path:string, attr:string, value?:T):T {
  let locStoSettings:SettingState = getLocalStorageSettings(localStorageKey) || {};

  const cleanPath= [...path.split("/").filter((p) => p !== ""), attr] as [keyof SettingState, ...string[]];

  if(value===undefined){
    // toggle
    value = !usingPathRead(state, cleanPath);
  }

  const modifiedLocalStorage = usingPathWrite({...locStoSettings}, cleanPath, value)
  const modifiedValue:T | boolean = usingPathRead(modifiedLocalStorage, cleanPath);

  setLocalStorage(localStorageKey, {
    ...modifiedLocalStorage,
    lastModified: time,
  });

  return modifiedValue;
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function localStoreAttrDelete(time:Date, path:string, attr:string) {
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
 */
export function setLocalStorage(localStorageKey:string, value:unknown) {
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
 */
export function getLocalStorageSettings(localStorageKey:string) {
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
