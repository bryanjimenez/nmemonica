import classNames from "classnames";
import orderBy from "lodash/orderBy";
import React from "react";

import { shuffleArray } from "./arrayHelper";
import { daysSince, minsSince } from "./consoleHelper";
import { JapaneseText } from "./JapaneseText";
import { JapaneseVerb } from "./JapaneseVerb";
import { isYoon, kanaHintBuilder } from "./kanaHelper";
import { furiganaHintBuilder } from "./kanjiHelper";
import { TermFilterBy } from "../slices/settingHelper";
import type {
  FuriganaToggleMap,
  GroupListMap,
  MetaDataObj,
  RawJapanese,
  RawKanji,
  RawPhrase,
  RawVocabulary,
  SpaceRepetitionMap,
  VerbFormArray,
} from "../typings/raw";

/**
 * Goes to the next term or selects one from the frequency list
 */
export function play<RawItem extends { uid: string }>(
  reinforce: boolean,
  freqFilter: (typeof TermFilterBy)[keyof typeof TermFilterBy],
  frequency: string[],
  filteredTerms: RawItem[],
  metadata: SpaceRepetitionMap,
  reinforcedUID: string | undefined,
  updateReinforcedUID: (uid: string) => void,
  gotoNext: () => void
) {
  // some games will come from the reinforced list
  // unless filtering from frequency list
  const reinforced = reinforce && Math.random() < 1 / 3;
  if (
    freqFilter !== TermFilterBy.FREQUENCY &&
    reinforced &&
    frequency.length > 0
  ) {
    const min = 0;
    const staleFreq = frequency.filter(
      (f) => minsSince(metadata[f]?.d) > frequency.length
    );
    const max = staleFreq.length;
    const idx = Math.floor(Math.random() * (max - min) + min);
    const vocabulary = filteredTerms.find((v) => staleFreq[idx] === v.uid);

    if (vocabulary) {
      // avoid repeating the same reinforced word
      if (reinforcedUID !== vocabulary.uid) {
        updateReinforcedUID(vocabulary.uid);
        return;
      }
    }
  }

  gotoNext();
}

export function getTermUID<Term extends { uid: string }>(
  selectedIndex: number,
  filteredTerms: Term[],
  alternateOrder?: number[]
) {
  let term;

  if (alternateOrder) {
    const index = alternateOrder[selectedIndex];
    term = filteredTerms[index];
  } else {
    term = filteredTerms[selectedIndex];
  }

  if (!term) {
    throw new Error("No term found");
  }

  return term.uid;
}

/**
 * @returns the term in the list matching the uid
 * @param uid
 * @param list of terms
 */
export function getTerm<Term extends { uid: string }>(
  uid: string,
  list: Term[]
) {
  const term = list.find((v) => uid === v.uid);

  if (!term) {
    throw new Error("No term found");
  }

  return term;
}

/**
 * Filters terms (words or phrases) list
 * by groups, frequency, or tags
 * @param filterType
 * @param termList word or phrase list
 * @param frequencyList
 * @param activeGrpList
 * @param toggleFilterType
 * @returns filteredPhrases
 */
export function termFilterByType<
  Term extends { uid: string; grp?: string; subGrp?: string; tag?: string[] }
>(
  filterType: (typeof TermFilterBy)[keyof typeof TermFilterBy],
  termList: Term[],
  frequencyList: string[] = [],
  activeGrpList: string[],
  toggleFilterType?: (override: number) => void
) {
  let filteredTerms = termList;

  if (filterType === TermFilterBy.FREQUENCY) {
    // frequency filtering
    if (!frequencyList) {
      throw new TypeError("Filter type requires frequencyList");
    }
    // if (!toggleFilterType) {
    //   throw new TypeError("Filter type requires toggleFilterType");
    // }

    if (frequencyList.length > 0) {
      if (activeGrpList.length > 0) {
        filteredTerms = termList.filter(
          (t) =>
            frequencyList.includes(t.uid) &&
            activeGroupIncludes(activeGrpList, t)
        );
      } else {
        filteredTerms = termList.filter((t) => frequencyList.includes(t.uid));
      }
    } else {
      // last frequency word was just removed
      if (typeof toggleFilterType === "function") {
        toggleFilterType(TermFilterBy.GROUP);
      }
    }
  } else if (filterType === TermFilterBy.TAGS) {
    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter((term) =>
        term.tag?.some((aTag) => activeGrpList.includes(aTag))
      );
    }
  } else {
    // group filtering
    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter((t) =>
        activeGroupIncludes(activeGrpList, t)
      );
    }
  }

  return filteredTerms;
}

/**
 * Active group filtering logic
 */
export function activeGroupIncludes<
  Term extends { grp?: string; subGrp?: string }
>(activeGrpList: string[], term: Term) {
  return (
    (term.grp !== undefined &&
      (activeGrpList.includes(term.grp) ||
        (term.subGrp !== undefined &&
          activeGrpList.includes(`${term.grp}.${term.subGrp}`)))) ||
    (term.grp === undefined &&
      (activeGrpList.includes("undefined") ||
        (term.subGrp !== undefined &&
          activeGrpList.includes(`undefined.${term.subGrp}`))))
  );
}

/**
 * Returns a list of groups that no longer are available,
 * but remain on the active groups list
 */
export function getStaleGroups(termGroups: GroupListMap, termActive: string[]) {
  const allGroups = Object.keys(termGroups).reduce<string[]>((acc, g) => {
    acc = [...acc, g, ...termGroups[g].map((sg) => g + "." + sg)];

    return acc;
  }, []);

  const stale = termActive.reduce<string[]>((acc, active) => {
    if (!allGroups.includes(active)) {
      acc = [...acc, active];
    }
    return acc;
  }, []);

  return stale;
}

/**
 * Given a SpaceRepetitionMap and a term list
 * finds stale keys, and uids in the SpaceRepetitionMap
 * returns a set of stale keys and a list of which uid the key belonged to
 */
export function getStaleSpaceRepKeys(
  repetition: SpaceRepetitionMap,
  termList: RawVocabulary[] | RawPhrase[] | RawKanji[],
  staleLabel: string
) {
  const SpaceRepetitionMapKeys: {
    [key in keyof SpaceRepetitionMap["uid"]]: null;
  } = {
    d: null,
    difficulty: null,
    nextReview: null,
    vC: null,
    f: null,
    rein: null,
    pron: null,
    tpPc: null,
    tpAcc: null,
    tpCAvg: null,
  };
  const SpaceRepKeys = new Set(Object.keys(SpaceRepetitionMapKeys));

  let OldSpaceRepKeys = new Set<string>();
  let staleInfoList: { key: string; uid: string; english: string }[] = [];
  Object.keys(repetition).forEach((srepUid) => {
    Object.keys(repetition[srepUid]).forEach((key) => {
      let staleInfo;
      if (!SpaceRepKeys.has(key)) {
        let term;
        try {
          term = getTerm<(typeof termList)[0]>(srepUid, termList);
        } catch (err) {
          term = { english: staleLabel };
        }

        staleInfo = { key, uid: srepUid, english: term.english };
      }

      if (staleInfo !== undefined) {
        OldSpaceRepKeys.add(key);
        staleInfoList = [...staleInfoList, staleInfo];
      }
    });
  });

  return { keys: OldSpaceRepKeys, list: staleInfoList };
}

/**
 * Minimum time between actions to trigger a space repetition update.
 * Prevents SpaceRepetition updates during quick scrolling.
 */
export function minimumTimeForSpaceRepUpdate(prevTime: number) {
  return ~~(Date.now() - prevTime) > 1500;
}

/**
 * Minimum time required to continue playing TimedPlay.
 * Prevents TimedPlay during quick scrolling.
 */
export function minimumTimeForTimedPlay(prevTime: number) {
  return ~~(Date.now() - prevTime) > 300;
}

/**
 * space repetition order
 * [timedPlayFailed, timedPlayMispronounced, newTerms, notTimedPlayed, timedPlayedCorrect]
 * @returns an array containing the indexes of terms in space repetition order
 */
export function spaceRepOrder(
  terms: RawVocabulary[],
  spaceRepObj: SpaceRepetitionMap
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

  for (const tIdx in terms) {
    const tUid = terms[tIdx].uid;
    const termRep = spaceRepObj[tUid];

    if (termRep !== undefined) {
      if (termRep.tpAcc === undefined) {
        notTimedTemp = [
          ...notTimedTemp,
          {
            date: termRep.d,
            views: termRep.vC,
            uid: tUid,
            index: Number(tIdx),
          },
        ];
      } else if (termRep.pron === true) {
        const staleness = getStalenessScore(
          termRep.d,
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
          termRep.d,
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
          termRep.d,
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
  }

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

/**
 * Terms in last viewed descending order
 * @param terms
 * @param spaceRepObj
 */
export function dateViewOrder(
  terms: { uid: string }[],
  spaceRepObj: SpaceRepetitionMap
) {
  interface lastSeenSortable {
    date: string;
    uid: string;
    index: number;
  }

  let notPlayed: number[] = [];
  let prevPlayedTemp: lastSeenSortable[] = [];

  for (const tIdx in terms) {
    const tUid = terms[tIdx].uid;
    const termRep = spaceRepObj[tUid];

    if (termRep?.d !== undefined) {
      prevPlayedTemp = [
        ...prevPlayedTemp,
        {
          date: termRep.d,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else {
      notPlayed = [...notPlayed, Number(tIdx)];
    }
  }

  // prettier-ignore
  const prevPlayedSort = orderBy(prevPlayedTemp, ["date", "uid"], ["asc", "asc"]);

  // console.log('unPlayed');
  // console.log(JSON.stringify(unPlayed.map((p) => ({[terms[p.index].english]:p.date}))));

  const prevPlayed = prevPlayedSort.map((el) => el.index);

  return [...notPlayed, ...prevPlayed];
}

/**
 * Below this threshold considered not memorized
 */
export const MEMORIZED_THRLD = 80;
/**
 * At or below this threshold considered incorrect
 */
export const DIFFICULTY_THRLD = 30;
/**
 * Difficulty order
 * [DecreasingDifficulty, UndefinedDifficulty, KnownTerms]
 * @param terms
 * @param spaceRepObj
 * @returns an array containing the indexes of terms in difficulty order
 */
export function difficultyOrder(
  terms: { uid: string }[],
  spaceRepObj: SpaceRepetitionMap
) {
  interface difficultySortable {
    difficulty: number;
    uid: string;
    index: number;
  }

  let undefDifficulty: number[] = [];
  let withDifficulty: difficultySortable[] = [];
  let noDifficulty: number[] = [];

  for (const tIdx in terms) {
    const tUid: string = terms[tIdx].uid;
    const termRep = spaceRepObj[tUid];

    if (termRep?.difficulty !== undefined) {
      const difficulty = Number(termRep.difficulty);
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
  }

  // prettier-ignore
  const withDifficultySort = orderBy(withDifficulty, ["difficulty", "uid"], ["asc", "asc"]);
  // const noDifficultySort = orderBy(noDifficulty, ["difficulty", "uid"], ["asc", "asc"]);

  const descDifficulty = withDifficultySort.map((el) => el.index);
  // const easyDifficulty = noDifficulty.map((el) => el.index);

  return [...descDifficulty, ...undefDifficulty, ...noDifficulty];
}
/**
 * @returns an array containing the indexes of terms in alphabetic order
 */
export function alphaOrder(terms: RawVocabulary[]) {
  // preserve terms unmodified

  let originalIndex: Record<string, number> = {};
  let modifiableTerms: RawVocabulary[] = [];
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
    const d = metadata[v.uid]?.difficulty;

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

export function labelOptions(index: number, options: string[]) {
  return options[index];
}

export function toggleOptions<T>(index: number, options: T[]) {
  const len = options.length;

  return index + 1 < len ? index + 1 : 0;
}

/**
 * Array containing the avaiable verb forms
 */
export function getVerbFormsArray(rawVerb?: RawJapanese, order?: string[]) {
  const verb = {
    dictionary: rawVerb === undefined ? undefined : JapaneseVerb.parse(rawVerb),
  };

  const allAvailable = [
    { name: "-masu", value: verb.dictionary?.masuForm() },
    { name: "-mashou", value: verb.dictionary?.mashouForm() },
    { name: "dictionary", value: verb.dictionary },
    { name: "-nai", value: verb.dictionary?.naiForm() },
    { name: "-saseru", value: verb.dictionary?.saseruForm() },
    { name: "-te", value: verb.dictionary?.teForm() },
    { name: "-ta", value: verb.dictionary?.taForm() },
    ...(verb.dictionary?.chattaForm() !== null
      ? [{ name: "-chatta", value: verb.dictionary?.chattaForm() }]
      : []),
    ...(verb.dictionary?.reruForm() !== null
      ? [{ name: "-reru", value: verb.dictionary?.reruForm() }]
      : []),
  ];

  let filtered;
  if (order && order.length > 0) {
    filtered = order.reduce<VerbFormArray>((acc, form) => {
      const f = allAvailable.find((el) => el.name === form);
      if (f !== undefined) {
        acc = [...acc, f];
      }

      return acc;
    }, []);
  }

  return filtered ?? allAvailable;
}

/**
 * @throws {Error} if the target form is not valid
 */
export function verbToTargetForm(
  rawVerb: RawJapanese,
  targetForm: string
): JapaneseText {
  const theForm = getVerbFormsArray(rawVerb).find(
    (form) => form.name === targetForm
  );

  if (!theForm) {
    throw new Error("Invalid targetForm");
  }

  return theForm.value;
}

/**
 * decorates label with metadata info (intransitive, keigo, etc.)
 */
export function japaneseLabel(
  isOnBottom: boolean,
  jObj: JapaneseText | JapaneseVerb,
  inJapanese: React.JSX.Element,
  jumpToTerm?: (uid: string) => void
) {
  const isOnTop = !isOnBottom;
  let indicators: React.JSX.Element[] = [];
  let showAsterix = false;
  let showIntr = false;
  let pairUID: string | undefined;
  if (
    jObj.constructor.name === JapaneseVerb.name &&
    "isExceptionVerb" in jObj
  ) {
    showAsterix = jObj.isExceptionVerb() || jObj.getVerbClass() === 3;
    showIntr = jObj.isIntransitive();
    pairUID = jObj.getTransitivePair() ?? jObj.getIntransitivePair();
  }

  const showNaAdj = jObj.isNaAdj();
  const showSlang = jObj.isSlang();
  const showKeigo = jObj.isKeigo();

  if (isOnTop && (showIntr || pairUID)) {
    indicators = [
      ...indicators,
      <span
        key={indicators.length + 1}
        className={classNames({
          clickable: pairUID,
          "question-color": pairUID,
        })}
        onClick={
          pairUID && jumpToTerm
            ? () => {
                jumpToTerm(pairUID);
              }
            : undefined
        }
      >
        {showIntr ? "intr" : "trans"}
      </span>,
    ];
  }
  if (isOnTop && showSlang) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>slang</span>,
    ];
  }
  if (isOnTop && showKeigo) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>keigo</span>,
    ];
  }
  if (showAsterix && indicators.length > 0) {
    indicators = [<span key={indicators.length + 1}>*</span>, ...indicators];
  }

  let inJapaneseLbl;
  if (indicators.length > 0) {
    inJapaneseLbl = (
      <span>
        {inJapanese}
        {showNaAdj && <span className="opacity-25"> {"な"}</span>}
        <span className="fs-5">
          <span> (</span>
          {indicators.reduce<React.JSX.Element[]>((a, c, i) => {
            if (i > 0 && i < indicators.length) {
              return [...a, <span key={indicators.length + i}> , </span>, c];
            } else {
              return [...a, c];
            }
          }, [])}
          <span>)</span>
        </span>
      </span>
    );
  } else if (showAsterix) {
    inJapaneseLbl = (
      <span>
        {inJapanese}
        <span> {"*"}</span>
      </span>
    );
  } else if (showNaAdj) {
    inJapaneseLbl = (
      <span>
        {inJapanese}
        <span className="opacity-25"> {"な"}</span>
      </span>
    );
  } else {
    inJapaneseLbl = inJapanese;
  }

  return inJapaneseLbl;
}

/**
 * decorates label with metadata info (intransitive, keigo, etc.)
 * @param {boolean} isOnTop
 * @param {JapaneseText | JapaneseVerb} jObj
 * @param {*} inEnglish
 * @param {function} [jumpToTerm]
 * @returns {React.JSX.Element}
 */
export function englishLabel(
  isOnTop: boolean,
  jObj: JapaneseText | JapaneseVerb,
  inEnglish: React.JSX.Element,
  jumpToTerm?: (uid: string) => void
) {
  let indicators: React.JSX.Element[] = [];
  let showIntr = false;
  let pairUID: string | undefined;
  if (
    jObj.constructor.name === JapaneseVerb.name &&
    "isExceptionVerb" in jObj
  ) {
    showIntr = jObj.isIntransitive();
    pairUID = jObj.getTransitivePair() ?? jObj.getIntransitivePair();
  }

  const showSlang = jObj.isSlang();
  const showKeigo = jObj.isKeigo();

  if (isOnTop && (showIntr || pairUID)) {
    indicators = [
      ...indicators,
      <span
        key={indicators.length + 1}
        className={classNames({
          clickable: pairUID,
          "question-color": pairUID,
        })}
        onClick={
          pairUID && jumpToTerm
            ? () => {
                jumpToTerm(pairUID);
              }
            : undefined
        }
      >
        {showIntr ? "intr" : "trans"}
      </span>,
    ];
  }
  if (isOnTop && showSlang) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>slang</span>,
    ];
  }
  if (isOnTop && showKeigo) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>keigo</span>,
    ];
  }

  let inEnglishLbl;
  if (indicators.length > 0) {
    inEnglishLbl = (
      <span>
        {inEnglish}
        <span>
          <span> (</span>
          {indicators.reduce<React.JSX.Element[]>((a, c, i) => {
            if (i > 0 && i < indicators.length) {
              return [...a, <span key={indicators.length + i}> , </span>, c];
            } else {
              return [...a, c];
            }
          }, [])}
          <span>)</span>
        </span>
      </span>
    );
  } else {
    inEnglishLbl = inEnglish;
  }

  return inEnglishLbl;
}

/**
 * Flips En > Jp or Jp > En
 */
export function labelPlacementHelper(
  practiceSide: boolean,
  inEnglish: React.JSX.Element,
  inJapanese: React.JSX.Element,
  eLabel: React.JSX.Element,
  jLabel: React.JSX.Element
) {
  let topValue, bottomValue, topLabel, bottomLabel;
  if (practiceSide) {
    topValue = inEnglish;
    bottomValue = inJapanese;
    topLabel = eLabel;
    bottomLabel = jLabel;
  } else {
    topValue = inJapanese;
    bottomValue = inEnglish;
    topLabel = jLabel;
    bottomLabel = eLabel;
  }

  return { topValue, topLabel, bottomValue, bottomLabel };
}

export function getEnglishHint(vocabulary: RawVocabulary) {
  return !vocabulary.grp || vocabulary.grp === "" ? undefined : (
    <span className="hint">
      {vocabulary.grp + (vocabulary.subGrp ? ", " + vocabulary.subGrp : "")}
    </span>
  );
}

export function getJapaneseHint(japaneseObj: JapaneseText) {
  const yoon = japaneseObj.getPronunciation().slice(1, 2);

  let jHint: React.JSX.Element | null;
  if (isYoon(yoon)) {
    jHint = japaneseObj.getHint(kanaHintBuilder, furiganaHintBuilder, 3, 2);
  } else {
    jHint = japaneseObj.getHint(kanaHintBuilder, furiganaHintBuilder, 3, 1);
  }

  return jHint;
}

/**
 * indexedDB key
 */
export function getCacheUID(word: RawVocabulary) {
  let { uid } = word;

  if (!uid) {
    console.warn(JSON.stringify(word));
    throw new Error("Missing uid");
  }

  if (word.form) {
    uid += word.form !== "dictionary" ? word.form.replace("-", ".") : "";
  }

  return uid;
}

/**
 * Creates the settings object for furigana toggling
 */
export function toggleFuriganaSettingHelper(
  uid: string,
  settings: FuriganaToggleMap,
  englishSideUp?: boolean,
  toggleFn?: (uid: string) => void
) {
  let furiganaToggable;

  // show by default unless explicitly set to false
  const show = !(settings?.[uid]?.f === false);
  furiganaToggable = {
    furigana: {
      show,
      toggle:
        (englishSideUp === false &&
          toggleFn &&
          (() => {
            toggleFn(uid);
          })) ||
        undefined,
    },
  };

  return furiganaToggable;
}

/**
 * A thenable pause
 * @param ms to pause
 * @param AbortController signal
 * @param countDownFn
 * @returns empty promise
 */
export function pause(
  ms: number,
  { signal }: { signal: AbortSignal },
  countDownFn?: (p: number, w: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const listener = () => {
      clearTimeout(timer);
      clearInterval(animation);
      reject(new Error("Aborted"));
    };

    const animation =
      typeof countDownFn === "function"
        ? setInterval(countDownFn, 200, 200, ms)
        : -1;

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", listener);
      clearInterval(animation);
      resolve();
    }, ms);

    if (signal?.aborted) {
      listener();
    }

    signal?.addEventListener("abort", listener);
  });
}

/**
 * @param n to repeat action
 * @param action
 * @param waitBeforeEach ms to wait before triggering actions
 * @param AbortController signal
 */
export function loopN<T>(
  n: number,
  action: () => Promise<T>,
  waitBeforeEach: number,
  { signal }: { signal: AbortSignal }
) {
  const loopPromise = new Promise<void>((resolve, reject) => {
    const listener = () => {
      clearTimeout(timer);

      const error = new Error("User interrupted loop.", {
        cause: { code: "UserAborted" },
      });
      reject(error);
    };

    const timer = setTimeout(() => {
      if (n > 0) {
        action()
          .then(() =>
            loopN(n - 1, action, waitBeforeEach, { signal }).then(() => {
              signal?.removeEventListener("abort", listener);
              resolve();
            })
          )
          .catch((error) => {
            reject(error);
          });
      } else {
        signal?.removeEventListener("abort", listener);
        resolve();
      }
    }, waitBeforeEach);

    if (signal?.aborted) {
      listener();
    }

    signal?.addEventListener("abort", listener);
  });

  return loopPromise;
}

/**
 * Triggers eventHandler if threshold condition is met
 * @param event
 * @param threshold
 * @param eventHandler
 */
export function motionThresholdCondition(
  event: DeviceMotionEvent,
  threshold: number,
  eventHandler: (value: number) => void
) {
  // const x = event.acceleration.x;
  const y = event.acceleration?.y;
  const z = event.acceleration?.z;
  if (y === undefined || y === null || z === undefined || z === null) {
    throw new Error("Device does not support DeviceMotionEvent", {
      cause: { code: "DeviceMotionEvent" },
    });
  } else {
    const yz = Math.sqrt(y * y + z * z);
    // const xyz = Math.sqrt(x * x + y * y + z * z);

    if (yz > threshold && typeof eventHandler === "function") {
      eventHandler(yz);
    }
  }
}

/**
 * If required request permission for DeviceMotionEvent
 */
export function getDeviceMotionEventPermission(
  onGranted: () => void,
  onError: (error: Error) => void
) {
  // @ts-expect-error DeviceMotionEvent.requestPermission
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    // @ts-expect-error DeviceMotionEvent.requestPermission
    DeviceMotionEvent.requestPermission()
      .then((permissionState: "default" | "denied" | "granted") => {
        if (permissionState === "granted") {
          onGranted();
        }
      })
      .catch(onError);
  } else {
    // handle regular non iOS 13+ devices
    onGranted();
  }
}
