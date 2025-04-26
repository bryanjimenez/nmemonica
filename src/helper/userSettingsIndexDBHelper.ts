import type { MetaDataObj } from "nmemonica";

import { usingPathRead, usingPathWrite } from "./userSettingsHelper";
import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../../pwa/helper/idbHelper";
import { type AppSettingState, settingsKeys } from "../slices";
import { dataSetNames } from "./sheetHelper";
import type { ValuesOf } from "../typings/utils";

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
    let initialState = res ?? {};

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

export function indexDBUserStudyProgressAttrUpdate(
  path: (typeof dataSetNames)[number],
  value: Record<string, MetaDataObj | undefined>
) {
  return getIndexDBStudyProgress(path).then((res) => {
    let initialState = res ?? {};

    return setIndexDBStudyProgress(path, {
      ...initialState,
      ...value,
    });
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
export function setIndexDBUserSettings(value: Partial<AppSettingState>) {
  return Promise.all(
    (Object.keys(value) as (keyof AppSettingState)[]).map((key) =>
      openIDB().then((db) =>
        putIDBItem(
          { db, store: IDBStores.SETTINGS },
          { key, value: value[key] }
        )
      )
    )
  ).then(() => {});
}

/**
 * Store a whole study-state object
 */
export function setIndexDBStudyProgress(
  path: (typeof dataSetNames)[number],
  value: Record<string, MetaDataObj | undefined>
) {
  return openIDB().then((db) =>
    putIDBItem({ db, store: IDBStores.STATE }, { key: path, value: value })
  );
}

/**
 * Retrieve the settings object stored in IndexDB
 */
export function getIndexDBUserSettings(): Promise<Partial<AppSettingState>> {
  return Promise.allSettled(
    settingsKeys.map((key) =>
      openIDB().then((db) => {
        // if indexedDB has stored setttings
        const stores = Array.from(db.objectStoreNames);

        const ErrorSettingsMissing = new Error("User settings not stored", {
          cause: { code: IDBErrorCause.NoResult },
        });
        if (!stores.includes(IDBStores.SETTINGS)) {
          throw ErrorSettingsMissing;
        }

        return getIDBItem({ db, store: IDBStores.SETTINGS }, key).then(
          (res) => {
            let initialState: ValuesOf<AppSettingState> | null = null;

            if (
              typeof res.value === "object" &&
              !Array.isArray(res.value) &&
              res.value !== null
            ) {
              initialState = res.value as ValuesOf<AppSettingState>;
            }

            return initialState;
          }
        );
      })
    )
  ).then((keyValues) =>
    settingsKeys.reduce<Partial<AppSettingState>>((acc, key, i) => {
      if (keyValues[i].status === "fulfilled") {
        return { ...acc, [key]: keyValues[i].value };
      }

      return acc;
    }, {})
  );
}

/**
 * Retrieve the study progress object stored in IndexDB
 */
export function getIndexDBStudyProgress(path: (typeof dataSetNames)[number]) {
  return openIDB()
    .then((db) => {
      // if indexedDB has stored
      const stores = Array.from(db.objectStoreNames);

      const ErrorSettingsMissing = new Error("Progress not stored", {
        cause: { code: IDBErrorCause.NoResult },
      });
      if (!stores.includes(IDBStores.STATE)) {
        throw ErrorSettingsMissing;
      }

      return getIDBItem({ db, store: IDBStores.STATE }, path).then((res) => {
        let initialState: Record<string, MetaDataObj | undefined> = {};

        if (
          typeof res.value === "object" &&
          !Array.isArray(res.value) &&
          res.value !== null
        ) {
          initialState = res.value as Record<string, MetaDataObj | undefined>;
        }

        return initialState;
      });
    })
    .catch((err) => {
      if (err instanceof Error && "cause" in err) {
        const errData = err.cause as { code: string };
        if (errData.code === "IDBNoResults") {
          // study progress not yet initialized
          return {} as Record<string, MetaDataObj | undefined>;
        }
      }

      // all else ...

      // eslint-disable-next-line
      console.log(err);
      throw err;
    });
}
