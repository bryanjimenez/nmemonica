import { developmentAuthEndPoint } from "../../environment.development";
import { fetchAudio as fetchAudioWithAuth } from "./audioHelper.production";

/**
 * Request auth from **dev_auth** service
 *
 * Fetch audio **with auth**
 *
 * Play using AudioContext
 * @param {string} audioUrl
 * @param {AbortController} [AbortController]
 */
export function fetchAudio(audioUrl, AbortController) {
  const url = audioUrl.split("?")[1];

  const authP = fetch(developmentAuthEndPoint + url)
    .then((res) => res.json())
    .then((data) => ({ Authorization: "Bearer " + data.auth }))
    .catch((err) => {
      console.log("dev_auth failed");
      return err;
    });

  return authP.then((auth) => {
    const aRequest = new Request(audioUrl, { headers: auth });
    return fetchAudioWithAuth(aRequest, AbortController);
  });
}
