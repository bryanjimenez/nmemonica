import orderBy from "lodash/orderBy";

import { shuffleArray } from "./arrayHelper";
import { daysSince } from "./consoleHelper";
import { JapaneseText } from "./JapaneseText";
import { getPercentOverdue } from "./recallHelper";
import { MetaDataObj } from "../typings/raw";

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
  T extends { uid: string; english: string; japanese: string }
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
    /*
    if (oMeta?.lastReview && oMeta.daysBetweenReviews && oMeta.accuracyP) {
      // a space repetition item
      // won't be sorted by lastView
      const daysSinceReview = daysSince(oMeta.lastReview);
      const percentOverdueCalc = getPercentOverdue({
        accuracy: oMeta.accuracyP/100,
        daysSinceReview,
        daysBetweenReviews: oMeta.daysBetweenReviews,
      });

      spaceRepTemp = [
        ...spaceRepTemp,
        {
          percentOverdueCalc,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else */
    if (oMeta?.lastView !== undefined) {
      // regular non-space-rep items
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
  // prettier-ignore
  // const prevSpaceRepSort = orderBy(spaceRepTemp, ["percentOverdueCalc", "uid"], ["desc", "asc"]);

  const prevViewed = prevViewedSort.map((el) => el.index);
  // const prevSpaceRepd = prevSpaceRepSort.map((el) => el.index);

  return [...notViewed, ...prevViewed/*, ...prevSpaceRepd*/];
}

/**
 * space repetition order
 * [timedPlayFailed, timedPlayMispronounced, newTerms, notTimedPlayed, timedPlayedCorrect]
 * @returns an array containing the indexes of terms in space repetition order
 */
export function spaceRepOrder<T extends { uid: string }>(
  terms: T[],
  spaceRepObj: Record<string, MetaDataObj | undefined>
) {
  interface timedPlayedSortable {
    staleness: number;
    correctness: number;
    uid: string;
    index: number;
  }
  interface notTimedPlayedSortable {
    date: string;
    views: number;
    uid: string;
    index: number;
  }

  let failedTemp: timedPlayedSortable[] = [];
  let misPronTemp: timedPlayedSortable[] = [];
  let notPlayed: number[] = [];
  let notTimedTemp: notTimedPlayedSortable[] = [];
  let timedTemp: timedPlayedSortable[] = [];

  terms.forEach((term, tIdx) => {
    const tUid = term.uid;
    const termRep = spaceRepObj[tUid];

    if (termRep !== undefined) {
      if (termRep.tpAcc === undefined) {
        notTimedTemp = [
          ...notTimedTemp,
          {
            date: termRep.lastView,
            views: termRep.vC,
            uid: tUid,
            index: Number(tIdx),
          },
        ];
      } else if (termRep.pron === true) {
        const staleness = getStalenessScore(
          termRep.lastView,
          termRep.tpAcc,
          termRep.vC
        );
        const correctness = getCorrectnessScore(termRep.tpPc, termRep.tpCAvg);

        misPronTemp = [
          ...misPronTemp,
          {
            staleness,
            correctness,
            uid: tUid,
            index: Number(tIdx),
          },
        ];
      } else if (termRep.tpAcc >= 0.65) {
        const staleness = getStalenessScore(
          termRep.lastView,
          termRep.tpAcc,
          termRep.vC
        );
        const correctness = getCorrectnessScore(termRep.tpPc, termRep.tpCAvg);

        timedTemp = [
          ...timedTemp,
          {
            staleness,
            correctness,
            uid: tUid,
            index: Number(tIdx),
          },
        ];
      } else if (termRep.tpAcc < 0.65) {
        const staleness = getStalenessScore(
          termRep.lastView,
          termRep.tpAcc,
          termRep.vC
        );
        const correctness = getCorrectnessScore(termRep.tpPc, termRep.tpCAvg);

        failedTemp = [
          ...failedTemp,
          {
            staleness,
            correctness,
            uid: tUid,
            index: Number(tIdx),
          },
        ];
      }
    } else {
      notPlayed = [...notPlayed, Number(tIdx)];
    }
  });

  // prettier-ignore
  const failedSort = orderBy(failedTemp, ["staleness", "correctness", "uid"], ["desc", "asc", "asc"]);
  // prettier-ignore
  const misPronSort = orderBy(misPronTemp, ["staleness", "correctness", "uid"], ["desc", "asc", "asc"]);

  // prettier-ignore
  const notTimedSort = orderBy(notTimedTemp, ["date", "views", "uid"], ["asc", "asc", "asc"]);
  // prettier-ignore
  const timedSort = orderBy(timedTemp, ["staleness", "correctness", "uid"], ["desc", "asc", "asc"]);

  // console.log("failed");
  // console.log(JSON.stringify(failedOrdered.map((p) => ({[terms[p.index].english]:p.accuracy, u:terms[p.index].uid, c:p.correctAvg}))));
  // console.log("played");
  // console.log(JSON.stringify(playedOrdered.map((p) => ({[terms[p.index].english]:p.date,c:p.count}))));
  // console.log('unPlayed');
  // console.log(JSON.stringify(unPlayed.map((p) => ({[terms[p.index].english]:p.date}))));
  // console.log("timed");
  // console.log(JSON.stringify(timedOrdered.map((p) => ({[terms[p.index].english]:p.accuracy, c:p.correctAvg}))));

  const failed = failedSort.map((el) => el.index);
  const misPron = misPronSort.map((el) => el.index);

  const notTimed = notTimedSort.map((el) => el.index);
  const timed = timedSort.map((el) => el.index);

  return [...failed, ...misPron, ...notPlayed, ...notTimed, ...timed];
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
