import { MutableRefObject, useCallback } from "react";

import {
  pushServicePubKeyPath,
  pushServiceRegisterClientPath,
} from "../../environment.production";
import { AppDispatch } from "../slices";
import { logger } from "../slices/globalSlice";
import { DebugLevel } from "../slices/settingHelper";

/**
 * Borrowed from MDN serviceworker cookbook
 * @link https://github.com/mdn/serviceworker-cookbook/blob/master/tools.js
 */
export function urlBase64ToUint8Array(base64String: string) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useSubscribe(
  dispatch: AppDispatch,
  serviceAddress: MutableRefObject<string>
) {
  const registerCB = useCallback(() => {
    // to register client
    // https://github.com/mdn/serviceworker-cookbook/blob/master/push-simple/index.js

    const serviceURL = serviceAddress.current;

    void navigator.serviceWorker.ready.then((registration) => {
      void registration.pushManager
        .getSubscription()
        .then(async (subscription) => {
          if (subscription) {
            return subscription;
          }

          const res = await fetch(serviceURL + pushServicePubKeyPath);
          const keyBase64String = await res.text();
          // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
          // urlBase64ToUint8Array() is defined in /tools.js
          const keyUint8Array = urlBase64ToUint8Array(keyBase64String);

          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyUint8Array,
          });
        })
        .then((subscription) => {
          void fetch(serviceURL + pushServiceRegisterClientPath, {
            method: "post",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({
              subscription,
            }),
          });
        })
        .catch((err: Error) => {
          dispatch(logger("Push API: " + err.message, DebugLevel.ERROR));
        });
    });
  }, [dispatch, serviceAddress]);

  return {
    registerCB,
  };
}
