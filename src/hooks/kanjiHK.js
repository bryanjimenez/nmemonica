import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { firebaseConfig } from "../../environment.development";

export const GET_KANJI = "get_kanji";

/**
 * @typedef {import("../typings/state").AppRootState} AppRootState
 * @typedef {import("../components/Pages/Kanji").RawKanji} RawKanji
 * @typedef {import("../components/Games/ParticlesGame").ParticleGamePhrase} ParticleGamePhrase
 */

/**
 * Fetches kanji data and updates Store state if no previous fetch
 */
export function useKanjiStore() {
  const dispatch = useDispatch();

  const version = useSelector(
    (/** @type {AppRootState}*/ { version }) => version.kanji
  );

  const rawKanjis = useSelector(
    (/** @type {AppRootState}*/ { kanji }) => kanji.value
  );

  useEffect(() => {
    const controller = new AbortController();

    if (version !== undefined && rawKanjis.length === 0) {
      // console.log("fetch");
      fetch(firebaseConfig.databaseURL + "/lambda/kanji.json", {
        signal: controller.signal,
        headers: { "Data-Version": version },
      })
        .then((res) => res.json())
        .then((data) => dispatch({ type: GET_KANJI, value: data }));
    }

    return function cleanup() {
      controller.abort();
    };
  }, [dispatch, version, rawKanjis]);

  return rawKanjis;
}
