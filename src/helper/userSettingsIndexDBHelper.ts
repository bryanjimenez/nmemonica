import {
  localStorageKey as indexDBKey,
  usingPathRead,
  usingPathWrite,
} from "./userSettingsHelper";
import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../../pwa/helper/idbHelper";
import { AppSettingState } from "../slices";

export function indexDBUserSettingAttrUpdate(
  state: Partial<AppSettingState>,
  path: string,
  attr: string
): Promise<boolean>;

export function indexDBUserSettingAttrUpdate<T>(
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
export function indexDBUserSettingAttrUpdate<T>(
  state: Partial<AppSettingState>,
  path: string,
  attr: string,
  value?: T
) {
  return getIndexDBUserSettings().then((res) => {
    let initialState = (res ?? {}) as AppSettingState;

    const cleanPath = [
      ...path.split("/").filter((p) => p !== ""),
      attr,
    ] as (keyof AppSettingState)[];

    let boolValue: boolean | undefined;
    if (value === undefined) {
      // toggle
      boolValue = !usingPathRead<boolean>(state, cleanPath);
    }

    const modifiedState = usingPathWrite(
      { ...initialState },
      cleanPath,
      boolValue ?? value
    );
    const modifiedValue = usingPathRead<T>(modifiedState, cleanPath);

    void setIndexDBUserSettings({
      ...modifiedState,
    });

    return modifiedValue;
  });
}

/**
 * Modifies an attribute or toggles the existing value
 */
export function indexDBUserSettingAttrDelete(path: string, attr: string) {
  return getIndexDBUserSettings().then((res) => {
    const initialState = res ?? {};
    const cleanPath = [
      ...path.split("/").filter((p) => p !== ""),
      attr,
    ] as (keyof AppSettingState)[];

    const modifiedState = usingPathWrite(
      { ...initialState },
      cleanPath,
      undefined
    );

    void setIndexDBUserSettings({
      ...modifiedState,
    });
  });
}

/**
 * Store a whole settings object
 */
export function setIndexDBUserSettings(value: unknown) {
  return openIDB().then((db) =>
    putIDBItem(
      { db, store: IDBStores.SETTINGS },
      { key: indexDBKey, value: value as AppSettingState }
    )
  );
}

/**
 * Retrieve the settings object stored in IndexDB
 */
export function getIndexDBUserSettings() {
  return openIDB()
    .then((db) => {
      // if indexedDB has stored setttings
      const stores = Array.from(db.objectStoreNames);

      const ErrorSettingsMissing = new Error("User settings not stored", {
        cause: { code: IDBErrorCause.NoResult },
      });
      if (!stores.includes(IDBStores.SETTINGS)) {
        throw ErrorSettingsMissing;
      }

      return getIDBItem({ db, store: IDBStores.SETTINGS }, indexDBKey).then(
        (res) => {
          let initialState: AppSettingState | null = null;

          if (
            typeof res.value === "object" &&
            !Array.isArray(res.value) &&
            res.value !== null
          ) {
            initialState = res.value as AppSettingState;
          }

          return initialState;
        }
      );
    })
    .catch((err) => {
      if (err instanceof Error && "cause" in err) {
        const errData = err.cause as { code: string };
        if (errData.code === "IDBNoResults") {
          // user settings not yet initialized
          return null;
        }
      }

      // all else ...

      // eslint-disable-next-line
      console.log(err);
      throw err;
    });
}
