import { useMemo } from "react";

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * Returns a uid list of the frequency terms
 * @template {{uid:string}} RawItem
 * @param {SpaceRepetitionMap} repetition
 * @param {RawItem[]} filteredTerms
 */
export function useFrequency(repetition, filteredTerms) {
  const frequency = useMemo(
    () =>
      filteredTerms.reduce((/** @type {string[]}*/ acc, cur) => {
        if (repetition[cur.uid]?.rein === true) {
          return [...acc, cur.uid];
        }
        return acc;
      }, []),
    [repetition, filteredTerms]
  );

  return frequency;
}
