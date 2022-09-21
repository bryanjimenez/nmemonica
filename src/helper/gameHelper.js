import React from "react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import { AUTOPLAY_EN_JP, AUTOPLAY_JP_EN } from "../actions/settingsAct";
import { FILTER_FREQ, FILTER_GRP } from "../reducers/settingsRed";
import { shuffleArray } from "./arrayHelper";
import { audioPronunciation, JapaneseText } from "./JapaneseText";
import { JapaneseVerb } from "./JapaneseVerb";

/**
 * Goes to the next term or selects one from the frequency list
 * @param {boolean} reinforce
 * @param {number} freqFilter
 * @param {[]} frequency
 * @param {RawVocabulary[]} filteredTerms
 * @param {string} reinforcedUID
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
  if (freqFilter !== FILTER_FREQ && reinforced && frequency.length > 0) {
    const min = 0;
    const max = Math.floor(frequency.length);
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
 * @returns {string} uid
 * @param {number} selectedIndex
 * @param {number[] | undefined} alternateOrder
 * @param {RawVocabulary[]} filteredTerms
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
 * @returns {RawVocabulary} the term in the list matching the uid
 * @param {string} uid
 * @param {RawVocabulary[]} list of terms
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
 * @param {number} filterType
 * @param {RawVocabulary[]} termList word or phrase list
 * @param {string[]} frequencyList
 * @param {string[]} activeGrpList
 * @param {function} toggleFilterType
 * @returns {RawVocabulary[]} filteredPhrases
 */
export function termFilterByType(
  filterType,
  termList,
  frequencyList,
  activeGrpList,
  toggleFilterType
) {
  let filteredTerms = termList;

  if (filterType === FILTER_FREQ) {
    // frequency filtering
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
      toggleFilterType(FILTER_GRP);
    }
  } else {
    // group filtering
    // spaced repetition
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
 * @returns {boolean} whether the term is part of the activeGroup
 * @param {string[]} activeGrpList
 * @param {RawVocabulary} term
 */
export function activeGroupIncludes(activeGrpList, term) {
  return (
    term.grp &&
    activeGrpList.includes(term.grp) ||
    activeGrpList.includes(term.grp + "." + term.subGrp) ||
    (term.grp === undefined &&
      (activeGrpList.includes("undefined") ||
        activeGrpList.includes("undefined" + "." + term.subGrp)))
  );
}

/**
 * Minimum time between actions to trigger a space repetition update
 * @param {number} prevTime
 * @returns {boolean}
 */
export function minimumTimeForSpaceRepUpdate(prevTime) {
  return ~~(Date.now() - prevTime) > 1500;
}

/**
 * space repetition order
 * terms not yet viewed
 * date last viewed
 * count of views
 * @param {RawVocabulary[]} terms
 * @param {SpaceRepetitionMap} spaceRepObj
 * @returns {number[]} an array containing the indexes of terms in space repetition order
 */
export function spaceRepOrder(terms, spaceRepObj) {
  /**
   * @type {{
   * date: Date,
   * count: number,
   * uid: string,
   * index: number
   * }[]}
   */
  let playedTemp = [];
  /**
   * @type {number[]}
   */
  let unPlayed = [];
  for (const tIdx in terms) {
    const tUid = terms[tIdx].uid;

    if (spaceRepObj[tUid]) {
      const date = spaceRepObj[terms[tIdx].uid].d;
      const count = spaceRepObj[terms[tIdx].uid].c;
      playedTemp = [
        ...playedTemp,
        {
          date,
          count,
          uid: tUid,
          index: Number(tIdx),
        },
      ];
    } else {
      unPlayed = [...unPlayed, Number(tIdx)];
    }
  }

  const playedOrdered = orderBy(
    playedTemp,
    ["date", "count", "uid"],
    ["asc", "asc", "asc"]
  );

  // console.log("played");
  // console.log(JSON.stringify(playedOrdered.map((p) => ({[terms[p.index].english]:p.date,c:p.count}))));
  // console.log('unPlayed');
  // console.log(JSON.stringify(unPlayed.map((p) => ({[terms[p.index].english]:p.date}))));

  const played = playedOrdered.map((el) => el.index);

  return [...unPlayed, ...played];
}

/**
 *
 * @param {RawVocabulary[]} terms
 * @returns {*} an array containing the indexes of terms in alphabetic order
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
 *
 * @param {RawVocabulary[]} terms
 * @returns {number[]} an array containing the indexes of terms in random order
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
 * @returns {{t:string, j:JapaneseText}[]}
 * @param {RawVocabulary} rawVerb
 * @param {string[]} [order]
 */
export function getVerbFormsArray(rawVerb, order) {
  const dictionaryForm = JapaneseVerb.parse(rawVerb);

  const allAvailable = [
    { t: "-masu", j: dictionaryForm.masuForm() },
    { t: "-mashou", j: dictionaryForm.mashouForm() },
    { t: "dictionary", j: dictionaryForm },
    { t: "-nai", j: dictionaryForm.naiForm() },
    { t: "-saseru", j: dictionaryForm.saseruForm() },
    { t: "-te", j: dictionaryForm.teForm() },
    { t: "-ta", j: dictionaryForm.taForm() },
  ];

  let filtered;
  if (order && order.length > 0) {
    /**
     * @type {{t:string, j:JapaneseText}[]}
     */
    let fil = [];

    filtered = order.reduce((acc, form) => {
      const f = allAvailable.find((el) => el.t === form);
      if (f !== undefined) {
        acc = [...acc, f];
      }

      return acc;
    }, fil);
  }

  return filtered ?? allAvailable;
}

/**
 * @returns {JapaneseText}
 * @param {RawVocabulary} rawVerb
 * @param {string} targetForm
 */
export function verbToTargetForm(rawVerb, targetForm) {
  const { j: theForm } = getVerbFormsArray(rawVerb).find(
    (form) => form.t === targetForm
  );

  return theForm;
}

/**
 * decorates label with metadata info (intransitive, keigo, etc.)
 * @param {boolean} isOnBottom
 * @param {JapaneseText | JapaneseVerb} jObj
 * @param {*} inJapanese
 * @param {function} jumpToTerm
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
  if (jObj.constructor.name === JapaneseVerb.name && "isExceptionVerb" in jObj) {
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
          pairUID
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
          {indicators.reduce((a, c, i) => {
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
 * @param {function} jumpToTerm
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
  if (jObj.constructor.name === JapaneseVerb.name && "isExceptionVerb" in jObj) {
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
          pairUID
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
          {indicators.reduce((a, c, i) => {
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
export function valueLabelHelper(
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
 * Logic for building ordered array of terms for AudioItem
 * @param {boolean} prevPlayed has it been manually played
 * @param {number} autoPlay autoPlay setting
 * @param {RawVocabulary} current current Term
 * @param {RawVocabulary} previous previous Term
 * @returns {AudioQueryParams[]} array in order to be played by AudioItem
 */
export function audioWordsHelper(prevPlayed, autoPlay, current, previous) {
  const currJ = {
    tl: "ja",
    q: audioPronunciation(current),
    uid: getCacheUID(current),
  };

  let audioWords = [
    currJ,
    { tl: "en", q: current.english, uid: current.uid + ".en" },
  ];
  if (previous !== undefined && prevPlayed === false) {
    if (autoPlay === AUTOPLAY_EN_JP) {
      audioWords = [
        currJ,
        { tl: "en", q: current.english, uid: current.uid + ".en" },
        {
          tl: "ja",
          q: audioPronunciation(previous),
          uid: getCacheUID(previous),
        },
      ];
    } else if (autoPlay === AUTOPLAY_JP_EN) {
      audioWords = [
        currJ,
        currJ,
        { tl: "en", q: previous.english, uid: previous.uid + ".en" },
      ];
    }
  } else if (prevPlayed === true) {
    if (autoPlay === AUTOPLAY_JP_EN) {
      audioWords = [currJ];
    }
  }

  return audioWords;
}

/**
 * Creates the settings object for furigana toggling
 * @param {boolean} englishSideUp
 * @param {string} uid
 * @param {{[uid:string]:{f:boolean}}} settings
 * @param {function} toggleFn
 * @returns
 */
export function toggleFuriganaSettingHelper(
  englishSideUp,
  uid,
  settings,
  toggleFn
) {
  let furiganaToggable;

  // show by default unless explicitly set to false
  const show = !(settings[uid] && settings[uid].f === false);
  furiganaToggable = {
    furigana: {
      show,
      toggle:
        !englishSideUp &&
        (() => {
          toggleFn(uid);
        }),
    },
  };

  return furiganaToggable;
}
