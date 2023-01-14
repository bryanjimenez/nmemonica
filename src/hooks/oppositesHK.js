import { useEffect } from "react";
import { firebaseConfig } from "../../environment.development";

export const GET_OPPOSITES = "get_opposites";

/**
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../components/Games/ParticlesGame").ParticleGamePhrase} ParticleGamePhrase
 */

/**
 * Fetches opposites data and updates Store state if no previous fetch
 * @param {function} dispatch redux dispatch
 * @param {string} version cache version
 * @param {RawPhrase[]} rawOpposites array of opposites from previous fetch
 */
export function useOppositesStore(dispatch, version, rawOpposites) {
  useEffect(() => {
    const controller = new AbortController();

    if (version !== undefined && rawOpposites.length === 0) {
      // console.log("fetch");
      fetch(firebaseConfig.databaseURL + "/lambda/opposites.json", {
        signal: controller.signal,
        headers: { "Data-Version": version },
      })
        .then((res) => res.json())
        .then((data) =>
          dispatch({
            type: GET_OPPOSITES,
            value: data,
          })
        );
    }

    return function cleanup() {
      controller.abort();
    };
  }, [dispatch, version, rawOpposites]);
}
