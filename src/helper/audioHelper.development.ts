import { fetchAudio as fetchAudioWithAuth } from "./audioHelper.production";
import {
  authenticationHeader,
  developmentAuthEndPoint,
} from "../../environment.development";

/**
 * Request auth from **dev_auth** service
 *
 * Fetch audio **with auth**
 *
 * Play using AudioContext
 */
export function fetchAudio(
  audioUrl: string,
  AbortController?: AbortController
) {
  const url = audioUrl.split("?")[1];

  const authP = fetch(developmentAuthEndPoint + url)
    .then((res) => res.json())
    .catch((err: Error) => {
      console.log("dev_auth failed");
      console.log(err.message);
      return err;
    });

  return authP.then((data) => {
    const { auth } = data as { auth: string };
    if (auth) {
      const h = { [authenticationHeader]: auth };
      const aRequest = new Request(audioUrl, { headers: h });
      return fetchAudioWithAuth(aRequest, AbortController);
    }

    // TODO: return unavailable warning?
  });
}
