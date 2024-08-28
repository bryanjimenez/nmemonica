import { getWindow } from "./browserGlobal";
import { usingPathRead, usingPathWrite } from "./userSettingsHelper";
import { localStorageKey } from "../constants/paths";
import type { LocalStorageState } from "../slices";

// TODO: implement using promises to match userSettingsIndexDBHelper (fallback method)

/**
 * Modifies an attribute or toggles the existing value
 * @param time
 * @param state required when toggling `attr` for prev value
 * @param path
 * @param attr
 * @param value optional if absent `attr` will be toggled
 */
export function localStoreUserSettingAttrUpdate<T>(
  time: Date,
  state: Partial<LocalStorageState>,
  path: string,
  attr: string,
  value?: T
) {
  let locStoSettings = (getLocalStorageUserSettings(localStorageKey) ??
    {}) as LocalStorageState;

  const cleanPath = [
    ...path.split("/").filter((p) => p !== ""),
    attr,
  ] as (keyof LocalStorageState)[];

  let boolValue: boolean | undefined;
  if (value === undefined) {
    // toggle
    boolValue = !usingPathRead<boolean>(state, cleanPath);
  }

  const modifiedLocalStorage = usingPathWrite(
    { ...locStoSettings },
    cleanPath,
    boolValue ?? value
  );
  const modifiedValue = usingPathRead<T>(modifiedLocalStorage, cleanPath);

  setLocalStorageUserSettings(localStorageKey, {
    ...modifiedLocalStorage,
    lastModified: time,
  });

  return modifiedValue;
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function localStoreUserSettingAttrDelete(
  time: Date,
  path: string,
  attr: string
) {
  const locStoSettings = getLocalStorageUserSettings(localStorageKey) ?? {};
  const cleanPath = [
    ...path.split("/").filter((p) => p !== ""),
    attr,
  ] as (keyof LocalStorageState)[];

  const modifiedLocalStorage = usingPathWrite(
    { ...locStoSettings },
    cleanPath,
    undefined
  );

  setLocalStorageUserSettings(localStorageKey, {
    ...modifiedLocalStorage,
    lastModified: time,
  });
}

/**
 * Store a whole settings object to the localStorage
 */
export function setLocalStorageUserSettings(
  localStorageKey: string,
  value: unknown
) {
  const { localStorage } = getWindow();

  return localStorage.setItem(localStorageKey, JSON.stringify(value));
}

/**
 * Retrieve the settings object stored in localStorage
 */
export function getLocalStorageUserSettings(localStorageKey: string) {
  let localStorageValue: LocalStorageState | null = null;

  const { localStorage } = getWindow();

  const textSettings = localStorage.getItem(localStorageKey);

  let resultObj: LocalStorageState | null = null;

  if (textSettings !== null) {
    resultObj = JSON.parse(textSettings) as LocalStorageState;
  }

  if (
    typeof resultObj === "object" &&
    !Array.isArray(resultObj) &&
    resultObj !== null
  ) {
    localStorageValue = resultObj;
  }

  return localStorageValue;
}
