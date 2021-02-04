export const SERVICE_WORKER_REGISTERED = "service_worker_registered";

export function registerServiceWorker() {
  return (dispatch) => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").then(() => {
        dispatch({
          type: SERVICE_WORKER_REGISTERED,
        });
      });
    }
  };
}
