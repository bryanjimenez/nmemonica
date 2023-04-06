import { useMemo, useRef, useState } from "react";

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
 * @param {boolean} willReinforce Reinforce or not
 * @param {RawItem|undefined} frequencyTerm
 * @param {number} totalTerms
 * @param {function} setSelectedIndex
 * @returns {[RawItem|undefined, React.Dispatch<React.SetStateAction<number>>]}
 */
export function useReinforcePlay(
  willReinforce,
  frequencyTerm,
  totalTerms,
  setSelectedIndex
) {
  /** used to determine move direction */
  const [direction, setMove] = useState(0);
  const prevDirection = useRef(direction);

  /** Term index */
  const prevTermIdx = useRef(direction);

  /** @type {import("react").MutableRefObject<string|undefined>} */
  const prevReinforcedTerm = useRef(undefined);

  const reinforcedTerm = useMemo(() => {
    // prettier-ignore
    // console.warn("useReinforceLogic(" + willReinforce + ", " + JSON.stringify(frequencyTerm) + ", " + totalTerms + ")");
    if (totalTerms === 0 || (prevDirection.current === 0 && direction === 0))
      return undefined;

    /** @param {number} nextIdx*/
    const goToNext = (nextIdx) => {
      // console.log(nextIdx+": "+filteredTerms[order.current[nextIdx]].english);
      prevTermIdx.current = nextIdx;
      setSelectedIndex(nextIdx);
    };

    const l = totalTerms;
    const dir = prevDirection.current > direction ? "prev" : "next";

    let selIdx;
    if (dir === "prev") {
      const ifNegative = prevTermIdx.current - 1 < 0 ? l : 0;
      selIdx = ifNegative + ((prevTermIdx.current - 1) % l);
    } else {
      selIdx = (prevTermIdx.current + 1) % l;
    }

    // console.log(JSON.stringify({direction, selIdx}));

    if (
      willReinforce &&
      dir === "next" &&
      frequencyTerm !== undefined &&
      prevReinforcedTerm.current !== frequencyTerm.uid
    ) {
      // reinforce

      goToNext(prevTermIdx.current); // no actual move discard selIdx
      return frequencyTerm;
    } else {
      // no reinforce

      goToNext(selIdx);
      return undefined;
    }
  }, [direction, willReinforce, totalTerms, frequencyTerm, setSelectedIndex]);

  prevDirection.current = direction;
  prevReinforcedTerm.current = reinforcedTerm?.uid;
  return [reinforcedTerm, setMove];
}
