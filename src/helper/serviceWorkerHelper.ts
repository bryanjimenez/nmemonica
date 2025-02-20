export interface SwMessage {
  msg: string;
  lvl: number;
  type: string;
}

export const SWRequestHeader = Object.freeze({
  CACHE_RELOAD: <const>{ ["Cache-Control"]: "reload" },
  CACHE_NO_WRITE: <const>{ ["Cache-Control"]: "no-store" },

  DATA_VERSION: "Data-Version",
});

export const UIMsg = Object.freeze({
  UI_LOGGER_MSG: "ui_logger_msg",
});

export interface SWVersionInfo {
  swVersion: string;
  jsVersion: string;
  bundleVersion: string;
}

export const SWMsgIncoming = Object.freeze({
  POST_INSTALL_ACTIVATE_DONE: "POST_INSTALL_ACTIVATE_DONE",
  SERVICE_WORKER_LOGGER_MSG: "service_worker_logger_msg",
  SERVICE_WORKER_NEW_TERMS_ADDED: "service_worker_new_terms",
});

export const SWMsgOutgoing = Object.freeze({
  SW_GET_VERSIONS: "SW_GET_VERSIONS",
  SW_REFRESH_HARD: "SW_REFRESH_HARD",
  DATASET_JSON_SAVE: "DATASET_JSON_SAVE",
});

const serviceWorkerNotAvailableErr = new Error("Service Worker not available");

export function swMessageSubscribe(
  swMessageEventListener: (e: MessageEvent) => void
) {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", swMessageEventListener);
  }
}

export function swMessageUnsubscribe(
  swMessageEventListener: (e: MessageEvent) => void
) {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.removeEventListener(
      "message",
      swMessageEventListener
    );
  }
}

export function swMessageGetVersions() {
  if (navigator.serviceWorker) {
    return navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.controller?.postMessage({
        type: SWMsgOutgoing.SW_GET_VERSIONS,
      });
    });
  }

  return Promise.reject(serviceWorkerNotAvailableErr);
}

export function swMessageDoHardRefresh() {
  if (navigator.serviceWorker) {
    return navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.controller?.postMessage({
        type: SWMsgOutgoing.SW_REFRESH_HARD,
      });
    });
  }

  return Promise.reject(serviceWorkerNotAvailableErr);
}
