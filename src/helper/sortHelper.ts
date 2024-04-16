import orderBy from "lodash/orderBy";
import type { MetaDataObj } from "nmemonica";

import { shuffleArray } from "./arrayHelper";
import { daysSince } from "./consoleHelper";
import { JapaneseText } from "./JapaneseText";

/**
 * Below this threshold considered memorized
 */
export const MEMORIZED_THRLD = 20;
/**
 * Above this threshold considred very difficult
 */
export const DIFFICULTY_THRLD = 70;

export function difficultyOrder(
  terms: { uid: string }[],
  spaceRepObj: Record<string, MetaDataObj | undefined>
) {
  interface difficultySortable {
    difficulty: number;
    uid: string;
    index: number;
  }

  let undefDifficulty: number[] = [];
  let withDifficulty: difficultySortable[] = [];
  let noDifficulty: number[] = [];

  terms.forEach((term, tIdx) => {
    const tUid = term.uid;
    const termRep = spaceRepObj[tUid];

    if (termRep?.difficultyP !== undefined) {
      const difficulty = Number(termRep.difficultyP);
      if (difficulty < MEMORIZED_THRLD) {
        withDifficulty = [
          ...withDifficulty,
          {
            difficulty,
            uid: tUid,
            index: Number(tIdx),
          },
        ];
      } else {
        // noDifficulty = [
        //   ...noDifficulty,
        //   {
        //     difficulty,
        //     uid: tUid,
        //     index: Number(tIdx),
        //   },
        // ];
        noDifficulty = [...noDifficulty, Number(tIdx)];
      }
    } else {
      undefDifficulty = [...undefDifficulty, Number(tIdx)];
    }
  });

  // prettier-ignore
  const withDifficultySort = orderBy(withDifficulty, ["difficulty", "uid"], ["asc", "asc"]);
  // const noDifficultySort = orderBy(noDifficulty, ["difficulty", "uid"], ["asc", "asc"]);

  const descDifficulty = withDifficultySort.map((el) => el.index);
  // const easyDifficulty = noDifficulty.map((el) => el.index);

  return [...descDifficulty, ...undefDifficulty, ...noDifficulty];
}

/**
 * Applies a difficulty threshold filter on a list of terms
 * @param threshold difficulty threshold (negative thresholds below, positive above)
 * @param termList list of terms
 * @param metadata record of term metadata
 */
export function difficultySubFilter<T extends { uid: string }>(
  threshold: number,
  termList: T[],
  metadata: Record<string, MetaDataObj | undefined>
) {
  return termList.filter((v) => {
    const dT = threshold;
    const d = metadata[v.uid]?.difficultyP;

    let showUndefMemoV = false;
    let showV = false;
    if (d === undefined) {
      showUndefMemoV =
        dT < 0 ? -1 * dT > DIFFICULTY_THRLD : dT < DIFFICULTY_THRLD;
    } else {
      showV = dT < 0 ? d < -1 * dT : d > dT;
    }

    return showUndefMemoV || showV;
  });
}

/**
 * @returns an array containing the indexes of terms in alphabetic order
 */
export function alphaOrder<
  T extends { uid: string; english: string; japanese: string },
>(terms: T[]) {
  // preserve terms unmodified

  let originalIndex: Record<string, number> = {};
  let modifiableTerms: { uid: string; japanese: string; english: string }[] =
    [];
  terms.forEach((t, i) => {
    originalIndex[t.uid] = i;

    modifiableTerms = [
      ...modifiableTerms,
      {
        uid: t.uid,
        japanese: t.japanese,
        english: t.english,
      },
    ];
  });

  let order: number[] = [],
    eOrder: { uid: string; label: string; idx: number }[] = [],
    jOrder: { uid: string; label: string; idx: number }[] = [];

  // order in japanese
  modifiableTerms = orderBy(modifiableTerms, ["japanese"], ["asc"]);
  modifiableTerms.forEach((t, i) => {
    order = [...order, originalIndex[t.uid]];
    jOrder = [
      ...jOrder,
      {
        uid: t.uid,
        label: JapaneseText.parse(t).getPronunciation(),
        idx: -1,
      },
    ];
    eOrder = [
      ...eOrder,
      { uid: t.uid, label: t.english.toLowerCase(), idx: i },
    ];
  });

  // order in english
  eOrder = orderBy(eOrder, ["label"], ["asc"]);
  eOrder.forEach((e, i) => {
    jOrder[e.idx] = { ...jOrder[e.idx], idx: i };
  });

  // console.log(JSON.stringify(order))
  // console.log(JSON.stringify(jOrder.map(j=>j.uid)))
  // console.log(JSON.stringify(eOrder.map(e=>e.uid)))

  return { order, jOrder, eOrder };
}

/**
 * @returns an array containing the indexes of terms in random order
 */
export function randomOrder<T>(terms: T[]) {
  const order = terms.map((v, i) => i);

  shuffleArray(order);

  return order;
}

/**
 * Terms in last viewed descending order
 * @param terms
 * @param metaRecord
 */
export function dateViewOrder(
  terms: { uid: string }[],
  metaRecord: Record<string, MetaDataObj | undefined>
) {
  interface lastSeenSortable {
    lastView: string;
    uid: string;
    index: number;
  }

  // interface recallSortable {
  //   percentOverdueCalc: number;
  //   uid: string;
  //   index: number;
  // }

  let notViewed: number[] = [];
  let prevViewedTemp: lastSeenSortable[] = [];
  // let spaceRepTemp: recallSortable[] = [];

  terms.forEach((term, tIdx) => {
    const tUid = term.uid;
    const oMeta = metaRecord[tUid];

    if (oMeta?.lastView !== undefined) {
      prevViewedTemp = [
        ...prevViewedTemp,
        {
          lastView: oMeta.lastView,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else {
      notViewed = [...notViewed, Number(tIdx)];
    }
  });

  // prettier-ignore
  const prevViewedSort = orderBy(prevViewedTemp, ["lastView", "uid"], ["asc", "asc"]);

  const prevViewed = prevViewedSort.map((el) => el.index);

  return [...notViewed, ...prevViewed];
}

/**
 * Staleness score based on last viewed date and accuracy
 * @param date Last viewed
 * @param accuracy Correct/Times played
 * @param views Times viewed
 */
export function getStalenessScore(date: string, accuracy: number, views = 1) {
  let staleness = Number.MAX_SAFE_INTEGER;
  if (date !== undefined && accuracy > 0 && views > 0) {
    staleness = daysSince(date) * (1 / accuracy) * (1 / views);
  }

  return staleness;
}

/**
 * Correctness score based on times played and average answer time.
 * @param count Times played
 * @param average Answer (ms) average
 */
export function getCorrectnessScore(count = 0, average = 0) {
  let correctness = Number.MIN_SAFE_INTEGER;
  if (count > 0 && average > 0) {
    correctness = count * (1 / average);
  }

  return correctness;
}
