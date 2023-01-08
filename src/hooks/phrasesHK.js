import { useEffect } from "react";
import { firebaseConfig } from "../../environment.development";

export const GET_PARTICLE_PHRASES = "get_particle_phrases";

/**
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../components/Games/ParticlesGame").ParticleGamePhrase} ParticleGamePhrase
 */

/**
 * Fetches phrases data and updates Store state if no previous fetch
 * or reuses previous fetch data to build gamePhrases
 * @param {function} dispatch redux dispatch
 * @param {string} version cache version
 * @param {RawPhrase[]} rawPhrases array of phrases from previous fetch
 * @param {ParticleGamePhrase[]} gamePhrases
 */
export function useParticlePhrasesStore(
  dispatch,
  version,
  rawPhrases,
  gamePhrases
) {
  useEffect(() => {
    const controller = new AbortController();

    if (version !== undefined && rawPhrases.length === 0) {
      // console.log("fetch");
      fetch(firebaseConfig.databaseURL + "/lambda/phrases.json", {
        signal: controller.signal,
        headers: { "Data-Version": version },
      })
        .then((res) => res.json())
        .then((data) => {
          const value = Object.keys(data).map((k) => ({
            ...data[k],
            uid: k,
          }));
          dispatch({ type: GET_PARTICLE_PHRASES, value });
        });
    }

    if (rawPhrases.length > 0 && gamePhrases.length === 0) {
      // console.log("no fetch");
      dispatch({ type: GET_PARTICLE_PHRASES, value: rawPhrases });
    }

    return function cleanup() {
      controller.abort();
    };
  }, [dispatch, version, rawPhrases, gamePhrases]);
}
