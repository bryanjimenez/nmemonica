import { authenticationHeader, developmentAuthEndPoint } from "../../environment.development";
import { fetchAudio as fetchAudioWithAuth } from "./audioHelper.production";

/**
 * Request auth from **dev_auth** service
 *
 * Fetch audio **with auth**
 *
 * Play using AudioContext
 */
export function fetchAudio(audioUrl:string, AbortController?:AbortController) {
  const url = audioUrl.split("?")[1];

  const authP = fetch(developmentAuthEndPoint + url)
    .then((res) => res.json())
    .then((data) => ({ [authenticationHeader]: data.auth }))
    .catch((err) => {
      console.log("dev_auth failed");
      return err;
    });

  return authP.then((auth) => {
    const aRequest = new Request(audioUrl, { headers: auth });
    return fetchAudioWithAuth(aRequest, AbortController);
  });
}
