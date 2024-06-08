import { MutableRefObject, useCallback } from "react";

import { AppDispatch } from "../slices";
import { registerSWForSubscription } from "../slices/sheetSlice";

function useSubscribe(
  dispatch: AppDispatch,
  serviceAddress: MutableRefObject<string>
) {
  const registerCB = useCallback(() => {
    // to register client
    // https://github.com/mdn/serviceworker-cookbook/blob/master/push-simple/index.js

    const serviceURL = serviceAddress.current;

    registerSWForSubscription(dispatch, serviceURL);
  }, [dispatch, serviceAddress]);

  return {
    registerCB,
  };
}
