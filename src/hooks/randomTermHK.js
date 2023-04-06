import { useMemo } from "react";

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * Returns a uid list of the frequency terms
 * @template {{uid:string}} RawItem
 * @param {boolean} use When set to false returns undefined
 * @param {string[]} frequencyUids list of uids from where to randomly pick
 * @param {RawItem[]} filteredTerms list of terms from where to return
 */
export function useRandomTerm(use, frequencyUids, filteredTerms) {
  const randomTerm = useMemo(() => {
    if (use && frequencyUids.length > 0) {
      const min = 0;
      const max = frequencyUids.length;
      const idx = Math.floor(Math.random() * (max - min) + min);
      const fUid = frequencyUids[idx];
      const f = filteredTerms.find((v) => fUid === v.uid);

      return f;
    }
  }, [use, filteredTerms, frequencyUids]);

  return randomTerm;
}
