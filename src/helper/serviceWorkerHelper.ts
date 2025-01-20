import { ValuesOf } from "../typings/utils";

export interface SwMessage {
  msg: string;
  lvl: number;
  type: string;
}

export const SWRequestHeader = Object.freeze({
  DATA_VERSION: "Data-Version",
});

export function hasHeader(
  request: Request,
  header: ValuesOf<typeof SWRequestHeader>
) {
  const [k, v] = Object.entries(header)[0];

  return request.headers.get(k) === v;
}

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
});

export const SWMsgOutgoing = Object.freeze({
  SW_GET_VERSIONS: "SW_GET_VERSIONS",
  SW_REFRESH_HARD: "SW_REFRESH_HARD",
  DATASET_JSON_SAVE: "DATASET_JSON_SAVE",
});

const serviceWorkerNotAvailableErr = new Error("Service Worker not available");

export function swMessageSubscribe(handler: (e: MessageEvent) => void) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", handler);
  }
}

export function swMessageUnsubscribe(handler: (e: MessageEvent) => void) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.removeEventListener("message", handler);
  }
}

export function swMessageGetVersions() {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.controller?.postMessage({
        type: SWMsgOutgoing.SW_GET_VERSIONS,
      });
    });
  }

  return Promise.reject(serviceWorkerNotAvailableErr);
}

export function swMessageDoHardRefresh() {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.controller?.postMessage({
        type: SWMsgOutgoing.SW_REFRESH_HARD,
      });
    });
  }

  return Promise.reject(serviceWorkerNotAvailableErr);
}
