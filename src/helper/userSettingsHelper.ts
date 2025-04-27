import type { MetaDataObj } from "nmemonica";

import {
  getIndexDBStudyProgress,
  getIndexDBUserSettings,
  indexDBUserSettingAttrDelete,
  indexDBUserSettingAttrUpdate,
  indexDBUserStudyProgressAttrUpdate,
  setIndexDBStudyProgress,
  setIndexDBUserSettings,
} from "./userSettingsIndexDBHelper";
import { AppProgressState, type AppSettingState } from "../slices";
import { dataSetNames } from "./sheetHelper";
import {
  localStoreUserSettingAttrUpdate,
  setLocalStorageUserSettings,
} from "./userSettingsLocalStorageHelper";

/**
 * Reads a value from storage
 */
export function usingPathRead<T>(
  storage: Partial<AppSettingState>,
  path: (keyof AppSettingState)[]
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
  storage: Partial<AppSettingState>,
  path: (keyof AppSettingState)[],
  value: unknown
): Partial<AppSettingState> {
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
  state: Partial<AppSettingState>,
  path: string,
  attr: string
): Promise<boolean>;

export function userSettingAttrUpdate<T>(
  state: Partial<AppSettingState>,
  path: string,
  attr: string,
  value: T
): Promise<T>;
/**
 * Modifies an attribute or toggles the existing value
 * @param state required when toggling `attr` for prev value
 * @param path
 * @param attr
 * @param value optional if absent `attr` will be toggled
 */
export function userSettingAttrUpdate<T>(
  state: Partial<AppSettingState>,
  path: string,
  attr: string,
  value?: T
) {
  // Anything under global duplicate in localStorage
  if (path === "/global/") {
    localStoreUserSettingAttrUpdate(state, path, attr, value);
  }

  return indexDBUserSettingAttrUpdate(state, path, attr, value);
}

export function userStudyProgressAttrUpdate(
  path: (typeof dataSetNames)[number],
  value: Record<string, MetaDataObj | undefined>
) {
  return indexDBUserStudyProgressAttrUpdate(path, value);
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function userSettingAttrDelete(path: string, attr: string) {
  return indexDBUserSettingAttrDelete(path, attr);
}

/**
 * Store a whole settings object
 */
export function setUserSetting(value: Partial<AppSettingState>) {
  const _localStoreMirror = new Promise<void>((resolve) => {
    setLocalStorageUserSettings(value);
    resolve();
  });

  return setIndexDBUserSettings(value);
}

/**
 * Retrieve the settings object
 */
export function getUserSettings() {
  return getIndexDBUserSettings();
}

/**
 * Store a whole study progress object
 */
export function setStudyProgress(value: Partial<AppProgressState>) {
  return Promise.all(
    dataSetNames.reduce((acc, name) => {
      if (value[name] !== undefined) {
        return [...acc, setIndexDBStudyProgress(name, value[name])];
      }
      return acc;
    }, [] as Promise<unknown>[])
  ).then(() => {});
}

/**
 * Retrieve study progress
 */
export function getStudyProgress() {
  return Promise.all(
    dataSetNames.map((name) => getIndexDBStudyProgress(name))
  ).then((states) =>
    states.reduce(
      (acc, state, i) => {
        if (state !== null) {
          return { ...acc, [dataSetNames[i]]: state };
        }

        return acc;
      },
      {} as Record<(typeof dataSetNames)[number], Record<string, MetaDataObj>>
    )
  );
}
