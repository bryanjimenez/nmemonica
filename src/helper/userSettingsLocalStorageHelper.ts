import { getWindow } from "./browserGlobal";
import { usingPathRead, usingPathWrite } from "./userSettingsHelper";
import { type AppSettingState, settingsKeys } from "../slices";

// TODO: implement using promises to match userSettingsIndexDBHelper (fallback method)

/**
 * Modifies an attribute or toggles the existing value
 * @param state required when toggling `attr` for prev value
 * @param path
 * @param attr
 * @param value optional if absent `attr` will be toggled
 */
export function localStoreUserSettingAttrUpdate<T>(
  state: Partial<AppSettingState>,
  path: string,
  attr: string,
  value?: T
) {
  let locStoSettings = getLocalStorageUserSettings();

  const cleanPath = [
    ...path.split("/").filter((p) => p !== ""),
    attr,
  ] as (keyof AppSettingState)[];

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

  setLocalStorageUserSettings({
    ...modifiedLocalStorage,
  });

  return modifiedValue;
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function localStoreUserSettingAttrDelete(
  path: string,
  attr: string
) {
  const locStoSettings = getLocalStorageUserSettings();
  const cleanPath = [
    ...path.split("/").filter((p) => p !== ""),
    attr,
  ] as (keyof AppSettingState)[];

  const modifiedLocalStorage = usingPathWrite(
    { ...locStoSettings },
    cleanPath,
    undefined
  );

  setLocalStorageUserSettings({
    ...modifiedLocalStorage,
  });
}

/**
 * Store a whole settings object to the localStorage
 */
export function setLocalStorageUserSettings(value: Partial<AppSettingState>) {
  const { localStorage } = getWindow();

  (Object.keys(value) as (keyof AppSettingState)[]).forEach((key) => {
    localStorage.setItem(key, JSON.stringify(value[key]));
  });
}

/**
 * Retrieve the settings object stored in localStorage
 */
export function getLocalStorageUserSettings() {
  const { localStorage } = getWindow();

  const resultObj = settingsKeys.reduce((acc, key) => {
    const partialSetting = localStorage.getItem(key);

    if (partialSetting !== null) {
      try {
        return { ...acc, [key]: JSON.parse(partialSetting) };
      } catch {
        // TODO: warn localStorage is corrupt
      }
    }

    return acc;
  }, {} as Partial<AppSettingState>);

  return resultObj;
}
