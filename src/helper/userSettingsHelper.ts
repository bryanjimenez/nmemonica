import {
  getIndexDBUserSettings,
  indexDBUserSettingAttrDelete,
  indexDBUserSettingAttrUpdate,
  setIndexDBUserSettings,
} from "./userSettingsIndexDBHelper";
import { type LocalStorageState } from "../slices";

/**
 * Reads a value from storage
 */
export function usingPathRead<T>(
  storage: Partial<LocalStorageState>,
  path: (keyof LocalStorageState)[]
): T {
  if (path.length === 1) {
    const attr = path[0];
    return storage[attr] as T;
  }

  const [first, ...rest] = path;
  const child = storage[first] ?? {};

  return usingPathRead(child, rest);
}

/**
 * Writes a value to storage
 */
export function usingPathWrite(
  storage: Partial<LocalStorageState>,
  path: (keyof LocalStorageState)[],
  value: unknown
): Partial<LocalStorageState> {
  if (path.length === 1) {
    const attr = path[0];
    return { ...storage, [attr]: value };
  }

  const [first, ...rest] = path;
  const child = storage[first] ?? {};

  return {
    ...storage,
    [first]: usingPathWrite(child, rest, value),
  };
}

export function userSettingAttrUpdate(
  time: Date,
  state: Partial<LocalStorageState>,
  path: string,
  attr: string
): Promise<boolean>;

export function userSettingAttrUpdate<T>(
  time: Date,
  state: Partial<LocalStorageState>,
  path: string,
  attr: string,
  value: T
): Promise<T>;
/**
 * Modifies an attribute or toggles the existing value
 * @param time
 * @param state required when toggling `attr` for prev value
 * @param path
 * @param attr
 * @param value optional if absent `attr` will be toggled
 */
export function userSettingAttrUpdate<T>(
  time: Date,
  state: Partial<LocalStorageState>,
  path: string,
  attr: string,
  value?: T
) {
  return indexDBUserSettingAttrUpdate(time, state, path, attr, value);
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function userSettingAttrDelete(time: Date, path: string, attr: string) {
  return indexDBUserSettingAttrDelete(time, path, attr);
}

/**
 * Store a whole settings object
 */
export function setUserSetting(value: unknown) {
  return setIndexDBUserSettings(value);
}

/**
 * Retrieve the settings object
 */
export function getUserSettings() {
  return getIndexDBUserSettings();
}
