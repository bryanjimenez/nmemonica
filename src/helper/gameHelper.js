import React from "react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import { TermFilterBy } from "../actions/settingsAct";
import { shuffleArray } from "./arrayHelper";
import { JapaneseText } from "./JapaneseText";
import { JapaneseVerb } from "./JapaneseVerb";
import { daysSince } from "./consoleHelper";
import { isYoon, kanaHintBuilder } from "./kanaHelper";
import { furiganaHintBuilder } from "./kanjiHelper";

/**
 * @typedef {import("../typings/raw").RawJapanese} RawJapanese
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../typings/raw").AudioQueryParams} AudioQueryParams
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {import("../typings/raw").VerbFormArray} VerbFormArray
 * @typedef {import("../typings/raw").FuriganaToggleMap} FuriganaToggleMap
 * @typedef {import("../typings/raw").GroupListMap} GroupListMap
 */

/**
 * Goes to the next term or selects one from the frequency list
 * @param {boolean} reinforce
 * @param {typeof TermFilterBy[keyof TermFilterBy]} freqFilter
 * @param {string[]} frequency
 * @param {RawVocabulary[]} filteredTerms
 * @param {string|undefined} reinforcedUID
 * @param {function} updateReinforcedUID
 * @param {function} gotoNext
 * @param {function} removeFrequencyTerm
 */
export function play(
  reinforce,
  freqFilter,
  frequency,
  filteredTerms,
  reinforcedUID,
  updateReinforcedUID,
  gotoNext,
  removeFrequencyTerm
) {
  // some games will come from the reinforced list
  // unless filtering from frequency list
  const reinforced =
    reinforce && [false, false, true][Math.floor(Math.random() * 3)];
  if (
    freqFilter !== TermFilterBy.FREQUENCY &&
    reinforced &&
    frequency.length > 0
  ) {
    const min = 0;
    const max = frequency.length;
    const idx = Math.floor(Math.random() * (max - min) + min);
    const vocabulary = filteredTerms.find((v) => frequency[idx] === v.uid);

    if (vocabulary) {
      if (reinforcedUID !== vocabulary.uid) {
        updateReinforcedUID(vocabulary.uid);
      } else {
        // avoid repeating the same reinforced word
        gotoNext();
      }
    } else {
      console.warn("uid no longer exists");
      removeFrequencyTerm(frequency[idx]);
      gotoNext();
    }
  } else {
    gotoNext();
  }
}

/**
 * @template {{ uid: string }} T
 * @param {number} selectedIndex
 * @param {number[] | undefined} alternateOrder
 * @param {T[]} filteredTerms
 */
export function getTermUID(selectedIndex, alternateOrder, filteredTerms) {
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
 * @template {{ uid: string }} T
 * @returns {T} the term in the list matching the uid
 * @param {string} uid
 * @param {T[]} list of terms
 */
export function getTerm(uid, list) {
  const term = list.find((v) => uid === v.uid);

  if (!term) {
    throw new Error("No term found");
  }

  return term;
}

/**
 * Filters terms (words or phrases) list
 * by groups, frequency, or space repetition
 * @template {{ uid: string, grp?: string, subGrp?: string, tag?: string[] }} T
 * @param {typeof TermFilterBy[keyof TermFilterBy]} filterType
 * @param {T[]} termList word or phrase list
 * @param {string[]?} frequencyList
 * @param {string[]} activeGrpList
 * @param {function?} toggleFilterType
 * @returns {T[]} filteredPhrases
 */
export function termFilterByType(
  filterType,
  termList,
  frequencyList = [],
  activeGrpList,
  toggleFilterType
) {
  let filteredTerms = termList;

  if (filterType === TermFilterBy.FREQUENCY) {
    // frequency filtering
    if (!frequencyList) {
      throw new TypeError("Filter type requires frequencyList");
    }
    if (!toggleFilterType) {
      throw new TypeError("Filter type requires toggleFilterType");
    }

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
      toggleFilterType(TermFilterBy.GROUP);
    }
  } else if (filterType === TermFilterBy.TAGS) {
    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter(
        (term) =>
          term.tag && term.tag.some((aTag) => activeGrpList.includes(aTag))
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
 * @template {{ grp?: string, subGrp?: string }} T
 * @param {string[]} activeGrpList
 * @param {T} term
 */
export function activeGroupIncludes(activeGrpList, term) {
  return (
    (term.grp && activeGrpList.includes(term.grp)) ||
    activeGrpList.includes(term.grp + "." + term.subGrp) ||
    (term.grp === undefined &&
      (activeGrpList.includes("undefined") ||
        activeGrpList.includes("undefined" + "." + term.subGrp)))
  );
}

/**
 * Returns a list of groups that no longer are available,
 * but remain on the active groups list
 * @param {import("../typings/raw").GroupListMap} termGroups
 * @param {string[]} termActive
 */
export function getStaleGroups(termGroups, termActive) {
  const allGroups = Object.keys(termGroups).reduce(
    (/** @type {string[]} */ acc, g) => {
      acc = [...acc, g, ...termGroups[g].map((sg) => g + "." + sg)];

      return acc;
    },
    []
  );

  const stale = termActive.reduce((/** @type {string[]} */ acc, active) => {
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
 * @param {SpaceRepetitionMap} repetition
 * @param {RawVocabulary[]|RawPhrase[]} termList
 * @param {string} staleLabel
 */
export function getStaleSpaceRepKeys(repetition, termList, staleLabel) {
  /** @type {{[key in keyof SpaceRepetitionMap["uid"]]:null}} */
  const SpaceRepetitionMapKeys = {
    d: null,
    vC: null,
    f: null,
    rein: null,
    pron: null,
    tpPc: null,
    tpAcc: null,
    tpCAvg: null,
  };
  const SpaceRepKeys = new Set(Object.keys(SpaceRepetitionMapKeys));

  /** @type {Set<string>} */
  let OldSpaceRepKeys = new Set();
  /** @type {{key:string, uid:string, english:string}[]} */
  let staleInfoList = [];
  Object.keys(repetition).forEach((srepUid) => {
    Object.keys(repetition[srepUid]).forEach((key) => {
      let staleInfo;
      if (!SpaceRepKeys.has(key)) {
        let term;
        try {
          term = getTerm(srepUid, termList);
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
 * @param {number} prevTime
 */
export function minimumTimeForSpaceRepUpdate(prevTime) {
  return ~~(Date.now() - prevTime) > 1500;
}

/**
 * Minimum time required to continue playing TimedPlay.
 * Prevents TimedPlay during quick scrolling.
 * @param {number} prevTime
 */
export function minimumTimeForTimedPlay(prevTime) {
  return ~~(Date.now() - prevTime) > 300;
}

/**
 * space repetition order
 * [timedPlayFailed, timedPlayMispronounced, newTerms, notTimedPlayed, timedPlayedCorrect]
 * @param {RawVocabulary[]} terms
 * @param {SpaceRepetitionMap} spaceRepObj
 * @returns an array containing the indexes of terms in space repetition order
 */
export function spaceRepOrder(terms, spaceRepObj) {
  /** @typedef {{staleness: number, correctness: number, uid: string, index: number}} timedPlayedSortable */
  /** @typedef {{date: string, views: number, uid: string, index: number}} notTimedPlayedSortable */

  /** @type {timedPlayedSortable[]} */
  let failedTemp = [];
  /** @type {timedPlayedSortable[]} */
  let misPronTemp = [];
  /** @type {number[]} */
  let notPlayed = [];
  /** @type {notTimedPlayedSortable[]} */
  let notTimedTemp = [];
  /** @type {timedPlayedSortable[]} */
  let timedTemp = [];

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
 * @param {string} date Last viewed
 * @param {number} accuracy Correct/Times played
 * @param {number} [views] Times viewed
 */
export function getStalenessScore(date, accuracy, views = 1) {
  let staleness = Number.MAX_SAFE_INTEGER;
  if (date !== undefined && accuracy > 0 && views > 0) {
    staleness = daysSince(date) * (1 / accuracy) * (1 / views);
  }

  return staleness;
}

/**
 * Correctness score based on times played and average answer time.
 * @param {number} [count] Times played
 * @param {number} [average] Answer (ms) average
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
 * @param {RawVocabulary[]} terms
 * @param {SpaceRepetitionMap} spaceRepObj
 */
export function dateViewOrder(terms, spaceRepObj) {
  /** @typedef {{date: string, uid: string, index: number}} lastSeenSortable */

  /** @type {number[]} */
  let notPlayed = [];
  /** @type {lastSeenSortable[]} */
  let prevPlayedTemp = [];

  for (const tIdx in terms) {
    const tUid = terms[tIdx].uid;
    const termRep = spaceRepObj[tUid];

    if (termRep !== undefined && termRep.d !== undefined) {
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
  const prevPlayedSort = orderBy(prevPlayedTemp, ["date", "uid"], ["asc", "asc", "asc"]);

  // console.log('unPlayed');
  // console.log(JSON.stringify(unPlayed.map((p) => ({[terms[p.index].english]:p.date}))));

  const prevPlayed = prevPlayedSort.map((el) => el.index);

  return [...notPlayed, ...prevPlayed];
}
/**
 *
 * @param {RawVocabulary[]} terms
 * @returns an array containing the indexes of terms in alphabetic order
 */
export function alphaOrder(terms) {
  // preserve terms unmodified
  /**
   * @type {{[uid:string]:number}}
   */
  let originalIndex = {};
  /**
   * @type {RawVocabulary[]}
   */
  let modifiableTerms = [];
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

  /**
   * @type {number[]}
   */
  let order = [],
    /**
     * @type {{uid:string,label:string,idx:number}[]}
     */
    eOrder = [],
    /**
     * @type {{uid:string,label:string,idx:number}[]}
     */
    jOrder = [];

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
 * @param {any[]} terms
 * @returns an array containing the indexes of terms in random order
 */
export function randomOrder(terms) {
  const order = terms.map((v, i) => i);

  shuffleArray(order);

  return order;
}

/**
 *
 * @param {number} index
 * @param {string[]} options
 * @returns
 */
export function labelOptions(index, options) {
  return options[index];
}

/**
 *
 * @param {number} index
 * @param {*[]} options
 * @returns
 */
export function toggleOptions(index, options) {
  const len = options.length;

  return index + 1 < len ? index + 1 : 0;
}

/**
 * Array containing the avaiable verb forms
 * @returns {VerbFormArray}
 * @param {RawJapanese} rawVerb
 * @param {string[]} [order]
 */
export function getVerbFormsArray(rawVerb, order) {
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
    filtered = order.reduce((/** @type {VerbFormArray} */ acc, form) => {
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
 * @param {RawJapanese} rawVerb
 * @param {string} targetForm
 */
export function verbToTargetForm(rawVerb, targetForm) {
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
 * @param {boolean} isOnBottom
 * @param {JapaneseText | JapaneseVerb} jObj
 * @param {*} inJapanese
 * @param {function} [jumpToTerm]
 * @returns {JSX.Element}
 */
export function japaneseLabel(isOnBottom, jObj, inJapanese, jumpToTerm) {
  const isOnTop = !isOnBottom;
  /**
   * @type {JSX.Element[]}
   */
  let indicators = [];

  let showAsterix = false;
  let showIntr = false;
  /**
   * @type {string|undefined}
   */
  let pairUID;
  if (
    jObj.constructor.name === JapaneseVerb.name &&
    "isExceptionVerb" in jObj
  ) {
    showAsterix = jObj.isExceptionVerb() || jObj.getVerbClass() === 3;
    showIntr = jObj.isIntransitive();
    pairUID = jObj.getTransitivePair() || jObj.getIntransitivePair();
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
          {indicators.reduce((/** @type {JSX.Element[]}*/ a, c, i) => {
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
 * @returns {JSX.Element}
 */
export function englishLabel(isOnTop, jObj, inEnglish, jumpToTerm) {
  /**
   * @type {JSX.Element[]}
   */
  let indicators = [];

  let showIntr = false;
  /**
   * @type {string|undefined}
   */
  let pairUID;
  if (
    jObj.constructor.name === JapaneseVerb.name &&
    "isExceptionVerb" in jObj
  ) {
    showIntr = jObj.isIntransitive();
    pairUID = jObj.getTransitivePair() || jObj.getIntransitivePair();
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
          {indicators.reduce((/** @type {JSX.Element[]}*/ a, c, i) => {
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
 * @param {boolean} practiceSide
 * @param {JSX.Element} inEnglish
 * @param {JSX.Element} inJapanese
 * @param {JSX.Element} eLabel
 * @param {JSX.Element} jLabel
 */
export function labelPlacementHelper(
  practiceSide,
  inEnglish,
  inJapanese,
  eLabel,
  jLabel
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

/**
 * @param {RawVocabulary} vocabulary
 */
export function getEnglishHint(vocabulary) {
  return !vocabulary.grp || vocabulary.grp === "" ? undefined : (
    <span className="hint">
      {vocabulary.grp + (vocabulary.subGrp ? ", " + vocabulary.subGrp : "")}
    </span>
  );
}

/**
 *
 * @param {JapaneseText} japaneseObj
 */
export function getJapaneseHint(japaneseObj) {
  const yoon = japaneseObj.getPronunciation().slice(1, 2);

  let jHint;
  if (isYoon(yoon)) {
    jHint = japaneseObj.getHint(kanaHintBuilder, furiganaHintBuilder, 3, 2);
  } else {
    jHint = japaneseObj.getHint(kanaHintBuilder, furiganaHintBuilder, 3, 1);
  }

  return jHint;
}

/**
 * indexedDB key
 * @param {RawVocabulary} word
 * @returns {string}
 */
export function getCacheUID(word) {
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
 * @param {string} uid
 * @param {FuriganaToggleMap} settings
 * @param {boolean} [englishSideUp]
 * @param {function} [toggleFn]
 * @returns
 */
export function toggleFuriganaSettingHelper(
  uid,
  settings,
  englishSideUp,
  toggleFn
) {
  let furiganaToggable;

  // show by default unless explicitly set to false
  const show = !(settings[uid] && settings[uid].f === false);
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
 * @param {number} ms to pause
 * @param {{signal: AbortSignal}} AbortController signal
 * @param {function} [countDownFn]
 * @returns {Promise<void>} empty promise
 */
export function pause(ms, { signal }, countDownFn) {
  return new Promise((resolve, reject) => {
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
 * @template T
 * @param {number} n to repeat action
 * @param {()=>Promise<T>} action
 * @param {number} waitBeforeEach ms to wait before triggering actions
 * @param {{signal: AbortSignal}} AbortController signal
 */
export function loopN(n, action, waitBeforeEach, { signal }) {
  /**
   * @type {Promise<void>}
   */
  const loopPromise = new Promise((resolve, reject) => {
    const listener = () => {
      clearTimeout(timer);
      // @ts-expect-error Error.cause
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
 * @param {HTMLAudioElement} audio
 * @return {Promise<void>}
 */
export function fadeOut(audio) {
  return new Promise((resolve) => {
    const fade = () => {
      if (audio.volume < 0.000001) {
        clearInterval(i);
        // audio.pause();
        resolve();
      } else {
        if (audio.volume > 0.7) {
          audio.volume *= 0.95;
        } else {
          audio.volume *= Math.pow(audio.volume, Math.pow(audio.volume, -1));
        }
      }
    };

    const i = setInterval(fade, 20);
  });
}

/**
 * Triggers eventHandler if threshold condition is met
 * @param {DeviceMotionEvent} event
 * @param {number} threshold
 * @param {(value:number)=>void} eventHandler
 */
export function motionThresholdCondition(event, threshold, eventHandler) {
  // const x = event.acceleration.x;
  const y = event.acceleration?.y;
  const z = event.acceleration?.z;
  if (y === undefined || y === null || z === undefined || z === null) {
    // @ts-expect-error Error.cause
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
 * @param {function} onGranted
 * @param {function} onError
 */
export function getDeviceMotionEventPermission(onGranted, onError) {
  // @ts-expect-error DeviceMotionEvent.requestPermission
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    // @ts-expect-error DeviceMotionEvent.requestPermission
    DeviceMotionEvent.requestPermission()
      .then((/** @type {"default"|"denied"|"granted"}*/ permissionState) => {
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
