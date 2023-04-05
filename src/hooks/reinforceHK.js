import { useMemo, useRef, useState } from "react";
import { TermFilterBy } from "../actions/settingsAct";

/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * Returns a term or undefined, and a function to update the next move
 *
 * When moved forward
 * - at random selects a frequency term or moves forward
 *
 * When moved back
 * - moves back
 * @template {{uid:string}} RawItem
 * @param {boolean} reinforce Menu setting
 * @param {typeof TermFilterBy[keyof TermFilterBy]} freqFilter Menu setting
 * @param {function} setSelectedIndex
 * @param {SpaceRepetitionMap} repetition
 * @param {RawItem[]} filteredTerms
 * @param {function} removeFrequencyTerm
 * @returns {[RawItem|undefined, React.Dispatch<React.SetStateAction<number>>]}
 */
export function useReinforcement(
  reinforce,
  freqFilter,
  setSelectedIndex,
  repetition,
  filteredTerms,
  removeFrequencyTerm
) {
  const [direction, setMove] = useState(0);
  const lastSelIdx = useRef(direction);
  const prevDirection = useRef(direction);
  const repetitionRef = useRef(repetition);
  /** @type {import("react").MutableRefObject<string|undefined>} */
  const prevReinforcedTerm = useRef(undefined);

  const frequency = useMemo(
    () =>
      filteredTerms.reduce((/** @type {string[]}*/ acc, cur) => {
        if (repetitionRef.current[cur.uid]?.rein === true) {
          return [...acc, cur.uid];
        }
        return acc;
      }, []),
    [filteredTerms]
  );

  repetitionRef.current = repetition;

  const reinforcedTerm = useMemo(() => {
    // prettier-ignore
    // console.warn("useReinforcement(" + Object.keys(TermFilterBy)[freqFilter] + ", " + frequency.length + ", " + filteredTerms.length + ")");

    if (
      filteredTerms.length === 0 ||
      (prevDirection.current === 0 && direction === 0)
    )
      return undefined;

    /** @param {number} nextIdx*/
    const goToNext = (nextIdx) => {
      // console.log("goto next");
      lastSelIdx.current = nextIdx;
      setSelectedIndex(nextIdx);
      return undefined;
    };

    const l = filteredTerms.length;
    const dir = prevDirection.current > direction ? "prev" : "next";

    let selIdx;
    if (dir === "prev") {
      const ifNegative = lastSelIdx.current - 1 < 0 ? l : 0;
      selIdx = ifNegative + ((lastSelIdx.current - 1) % l);
    } else {
      selIdx = (lastSelIdx.current + 1) % l;
    }

    // console.log(JSON.stringify({direction, selIdx}));

    // some games will come from the reinforced list
    // unless filtering from frequency list
    const reinforced =
      reinforce &&
      dir === "next" &&
      [false, false, true][Math.floor(Math.random() * 3)];

    let term;
    let fUid = "";
    if (
      freqFilter !== TermFilterBy.FREQUENCY &&
      reinforced &&
      frequency.length > 0
    ) {
      const min = 0;
      const max = frequency.length;
      const idx = Math.floor(Math.random() * (max - min) + min);
      fUid = frequency[idx];
      term = filteredTerms.find((v) => fUid === v.uid);
      // console.log("freq " + term.english);
    }

    if (reinforced && term === undefined) {
      term = goToNext(selIdx);
      // remove stale frequency uid
      if (typeof removeFrequencyTerm === "function") {
        removeFrequencyTerm(fUid);
      }
    } else if (
      (reinforced && prevReinforcedTerm.current === term.uid) ||
      !reinforced
    ) {
      term = goToNext(selIdx);
    }

    return term;
  }, [
    direction,
    reinforce,
    filteredTerms,
    freqFilter,
    frequency,
    setSelectedIndex,
    removeFrequencyTerm,
  ]);

  prevDirection.current = direction;
  prevReinforcedTerm.current = reinforcedTerm?.uid;
  return [reinforcedTerm, setMove];
}
