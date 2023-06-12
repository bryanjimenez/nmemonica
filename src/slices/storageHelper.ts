/**
 * gets persistent status and quota info
 */
export function memoryStorageStatus():Promise<{quota:number,usage:number,persistent:boolean}> {
  if ("storage" in navigator && "persist" in navigator.storage) {
    return navigator.storage.persisted().then((persistent) =>
      getStorageUsage().then(({ quota, usage }) => ({
        quota,
        usage,
        persistent,
      }))
    );
  } else {
    // @ts-expect-error Error.cause
    const e = new Error("Browser does not support persistent storage", {
      cause: { code: "PersistentStorageUnsupported" },
    });

    return Promise.reject(e);
  }
}

/**
 * sets persistent storage bit (if browser supports it)
 */
export function persistStorage() {
  // @ts-expect-error Error.cause
  const e = new Error("Browser does not support persistent storage", {
    cause: { code: "PersistentStorageUnsupported" },
  });

  if ("storage" in navigator && "persist" in navigator.storage) {
    return navigator.storage.persisted().then(function (persistent) {
      if (persistent) {
        return getStorageUsage().then(({ quota, usage }) => ({
          quota,
          usage,
          persistent,
          warning: undefined,
        }));
      } else {
        return navigator.storage.persist().then(function (persistent) {
          let warning:string|undefined;

          if (persistent) {
            warning =
              "Storage will not be cleared except by explicit user action";
          } else {
            // warning =
            //   "Storage may be cleared by the UA under storage pressure.";
            return Promise.reject(e);
          }
          return getStorageUsage().then(({ quota, usage }) => ({
            quota,
            usage,
            persistent,
            warning,
          }));
        });
      }
    });
  } else {
    return Promise.reject(e);
  }
}

/**
 * get temporary storage quota info
 */
export function getStorageUsage():Promise<{quota:number,usage:number}>  {
  return new Promise((resolve, reject) => {
    if ("webkitTemporaryStorage" in navigator) {
      navigator.webkitTemporaryStorage.queryUsageAndQuota(
        (usedBytes:number, grantedBytes:number) => {
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
      // @ts-expect-error Error.cause
      const e = new Error("Quota info unsupported", {
        cause: { code: "QuotaInfoUnsupported" },
      });

      reject(e);
    }
  });
}
