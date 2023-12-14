export interface SwMessage {
  msg: string;
  lvl: number;
  type: string;
}

export const SWRequestHeader = Object.freeze({
  NO_CACHE: "X-No-Cache",
});

export const UIMsg = Object.freeze({
  UI_LOGGER_MSG: "ui_logger_msg",
});

export interface SWVersionInfo {
  swVersion: string;
  jsVersion: string;
  bundleVersion: string;
}

export interface AppEndpoints {
  /** Endpoint for UI resources (html, js, css, ...) */
  ui?: string;
  /** Endpoint for Data sets (cache.json, kanji.json, ...) */
  data?: string;
  /** Endpoint for Pronounce resource */
  media?: string;
}

export const SWMsgIncoming = Object.freeze({
  POST_INSTALL_ACTIVATE_DONE: "POST_INSTALL_ACTIVATE_DONE",
  SERVICE_WORKER_LOGGER_MSG: "service_worker_logger_msg",
  SERVICE_WORKER_NEW_TERMS_ADDED: "service_worker_new_terms",
});

export const SWMsgOutgoing = Object.freeze({
  SW_VERSION: "SW_VERSION",
  DO_HARD_REFRESH: "DO_HARD_REFRESH",
  RECACHE_DATA: "RECACHE_DATA",
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

/**
 * Post install/activate
 * - cache data
 */
export function swMessageRecacheData(appEndPoints: AppEndpoints) {
  if (navigator.serviceWorker) {
    return navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.controller?.postMessage({
        type: SWMsgOutgoing.RECACHE_DATA,
        endpoints: appEndPoints,
      });
    });
  }
  return Promise.reject(serviceWorkerNotAvailableErr);
}

export function swMessageGetVersions() {
  navigator.serviceWorker.controller?.postMessage({
    type: SWMsgOutgoing.SW_VERSION,
  });
}

export function swMessageDoHardRefresh() {
  navigator.serviceWorker.controller?.postMessage({
    type: SWMsgOutgoing.DO_HARD_REFRESH,
  });
}
