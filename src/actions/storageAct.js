export const MEMORY_STORAGE_STATUS = "memory_storage_status";

/**
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 */

/**
 * gets persistent status and quota info
 * @returns {ThenableActCreator}
 */
export function getMemoryStorageStatus() {
  return (dispatch) => {
    if (navigator.storage && navigator.storage.persist) {
      return navigator.storage.persisted().then(function (persistent) {
        return getStorageUsage().then(({ quota, usage }) => {
          dispatch({
            type: MEMORY_STORAGE_STATUS,
            value: { quota, usage, persistent },
          });
        });
      });
    } else {
      const e = "Browser does not support persistent storage";

      dispatch({
        type: MEMORY_STORAGE_STATUS,
        value: { error: e },
      });
      return Promise.reject(new Error(e));
    }
  };
}

/**
 * sets persistent storage bit (if browser supports it)
 * @returns {ThenableActCreator}
 */
export function setPersistentStorage() {
  return (dispatch) => {
    if (navigator.storage && navigator.storage.persist) {
      return navigator.storage.persisted().then(function (persistent) {
        if (persistent) {
          return getStorageUsage().then(({ quota, usage }) => {
            dispatch({
              type: MEMORY_STORAGE_STATUS,
              value: { quota, usage, persistent },
            });
          });
        } else {
          return navigator.storage.persist().then(function (persistent) {
            if (persistent) {
              console.log(
                "Storage will not be cleared except by explicit user action"
              );
            } else {
              console.log(
                "Storage may be cleared by the UA under storage pressure."
              );
            }

            return getStorageUsage().then(({ quota, usage }) => {
              dispatch({
                type: MEMORY_STORAGE_STATUS,
                value: { quota, usage, persistent },
              });
            });
          });
        }
      });
    } else {
      const e = "Browser does not support persistent storage";

      dispatch({
        type: MEMORY_STORAGE_STATUS,
        value: { error: e },
      });
      return Promise.reject(new Error(e));
    }
  };
}

/**
 * get temporary storage quota info
 * @returns {Promise<*>}
 */
export function getStorageUsage() {
  return new Promise((resolve, reject) => {
    if (navigator.webkitTemporaryStorage != null) {
      navigator.webkitTemporaryStorage.queryUsageAndQuota(
        (usedBytes, grantedBytes) => {
          resolve({ quota: grantedBytes, usage: usedBytes });
        },
        reject
      );
    } else if (
      navigator.storage != null &&
      navigator.storage.estimate != null
    ) {
      navigator.storage.estimate().then(resolve).catch(reject);
    } else {
      reject(new Error("Quota info unsupported"));
    }
  });
}
