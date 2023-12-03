
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
  SW_CACHE_DATA: "SW_CACHE_DATA",
  SW_VERSION: "SW_VERSION",
  SET_ENDPOINT:"SET_ENDPOINT",
  DO_HARD_REFRESH:"DO_HARD_REFRESH"

});

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

export function swMessageSetLocalServiceEndpoint({
  ui,
  data,
  media,
}: AppEndpoints) {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.controller?.postMessage({
      type: SWMsgOutgoing.SET_ENDPOINT,
      endpoint: {
        ui,
        data,
        media,
      },
    });
  }
}

/**
 * Post install/activate
 * - cache ui
 * - cache data
 */
export function swMessageInitCache(endpoint:AppEndpoints){
  navigator.serviceWorker.ready.then(()=>{
    navigator.serviceWorker.controller?.postMessage({
      type: SWMsgOutgoing.SW_CACHE_DATA,
      endpoint}
    )
  })
}

export function swMessageGetVersions() {
  navigator.serviceWorker.controller?.postMessage({
    type: SWMsgOutgoing.SW_VERSION,
  });
}

export function swMessageDoHardRefresh() {
  navigator.serviceWorker.controller?.postMessage({
    type:  SWMsgOutgoing.DO_HARD_REFRESH,
  });
}

