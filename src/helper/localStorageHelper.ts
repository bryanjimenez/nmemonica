import { getWindow } from "./browserGlobal";
import { localStorageKey } from "../constants/paths";
import type { LocalStorageState } from "../slices";

/**
 * Reads a value from storage
 */
function usingPathRead<T>(
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
function usingPathWrite(
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

/**
 * Modifies an attribute or toggles the existing value
 * @param time
 * @param state
 * @param path
 * @param attr
 * @param value optional if absent [attr] will be toggled
 */
export function localStoreAttrUpdate<T>(
  time: Date,
  state: Partial<LocalStorageState>,
  path: string,
  attr: string,
  value?: T
) {
  let locStoSettings = (getLocalStorageSettings(localStorageKey) ??
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

  setLocalStorage(localStorageKey, {
    ...modifiedLocalStorage,
    lastModified: time,
  });

  return modifiedValue;
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function localStoreAttrDelete(time: Date, path: string, attr: string) {
  const locStoSettings = getLocalStorageSettings(localStorageKey) ?? {};
  const cleanPath = [
    ...path.split("/").filter((p) => p !== ""),
    attr,
  ] as (keyof LocalStorageState)[];

  const modifiedLocalStorage = usingPathWrite(
    { ...locStoSettings },
    cleanPath,
    undefined
  );

  setLocalStorage(localStorageKey, {
    ...modifiedLocalStorage,
    lastModified: time,
  });
}

/**
 * Store a whole settings object to the localStorage
 */
export function setLocalStorage(localStorageKey: string, value: unknown) {
  const { localStorage } = getWindow();

  return localStorage.setItem(localStorageKey, JSON.stringify(value));
}

/**
 * Retrieve the settings object stored in localStorage
 */
export function getLocalStorageSettings(localStorageKey: string) {
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
