import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";

import {
  audioServicePath,
  dataServiceEndpoint,
  dataServicePath,
  pronounceEndoint,
} from "../../environment.development";
import { RootState } from "../slices";

/**
 * Url rewrite for when localServiceURL is set
 * @param state
 * @param path to service
 * @returns a full url with a path
 */
export function rewriteUrl(localServiceURL: string, path: string) {
  const endpoint = getEndpointUrlBasedOnPath(path);

  const baseUrl = localServiceURL === "" ? endpoint : localServiceURL + path;

  return baseUrl;
}

/**
 * Url rewrite for when localServiceURL is set
 * @param path
 * @param path to service
 * @returns a full url with a path
 */
export function useRewriteUrl(path: string) {
  const endpoint = getEndpointUrlBasedOnPath(path);

  const { localServiceURL } = useSelector(({ global }: RootState) => global);

  const baseUrl = useMemo(() => {
    return localServiceURL === "" ? endpoint : localServiceURL + path;
  }, [path, endpoint, localServiceURL]);

  return baseUrl;
}

/**
 * A **one time** value read of the localServiceURL
 * @returns the url or null if the localServiceURL has not been
 */
export function useOnceRewriteUrl() {
  const localServiceURLREF = useRef<string | null>(null);
  const { localServiceURL } = useSelector(({ global }: RootState) => global);

  useEffect(() => {
    if (localServiceURL !== "" && localServiceURLREF.current === null) {
      localServiceURLREF.current = localServiceURL;
    }
  }, [localServiceURL]);

  return localServiceURLREF;
}

function getEndpointUrlBasedOnPath(path: string) {
  let endpoint: string;
  switch (path) {
    case "":
      // no endpoint, just the base url
      // only for Sheet
      endpoint = "";
      break;
    case audioServicePath:
      endpoint = pronounceEndoint;
      break;
    case dataServicePath:
      endpoint = dataServiceEndpoint;
      break;

    default:
      throw new Error("Path does not match");
  }

  return endpoint;
}
