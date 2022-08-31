import React from "react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import { AUTOPLAY_EN_JP, AUTOPLAY_JP_EN } from "../actions/settingsAct";
import { gPronounceCacheIndexParam } from "../constants/paths";
import { FILTER_FREQ, FILTER_GRP } from "../reducers/settingsRed";
import { shuffleArray } from "./arrayHelper";
import { audioPronunciation, JapaneseText } from "./JapaneseText";
import { JapaneseVerb } from "./JapaneseVerb";

/**
 * Goes to the next term or selects one from the frequency list
 * @param {Boolean} reinforce
 * @param {Number} freqFilter
 * @param {Array} frequency
 * @param {Array} filteredTerms
 * @param {String} reinforcedUID
 * @param {Function} updateReinforcedUID
 * @param {Function} gotoNext
 * @param {Function} removeFrequencyTerm
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
 * @returns {String} uid
 * @param {number} selectedIndex
 * @param {number[] | undefined} alternateOrder
 * @param {Object[]} filteredTerms
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
 * @returns {Object} the term in the list matching the uid
 * @param {String} uid
 * @param {Object[]} list of terms
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
 * @param {Number} filterType
 * @param {Array} termList word or phrase list
 * @param {Array} frequencyList
 * @param {Array} activeGrpList
 * @param {Function} toggleFilterType
 * @returns {Array} filteredPhrases
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
 * @returns {Boolean} whether the term is part of the activeGroup
 * @param {String[]} activeGrpList
 * @param {{grp:String,subGrp:String}} term
 */
export function activeGroupIncludes(activeGrpList, term) {
  return (
    activeGrpList.includes(term.grp) ||
    activeGrpList.includes(term.grp + "." + term.subGrp) ||
    (term.grp === undefined &&
      (activeGrpList.includes("undefined") ||
        activeGrpList.includes("undefined" + "." + term.subGrp)))
  );
}

/**
 * Minimum time between actions to trigger a space repetition update
 * @param {Number} prevTime
 * @returns {Boolean}
 */
export function minimumTimeForSpaceRepUpdate(prevTime) {
  return ~~(Date.now() - prevTime) > 1500;
}

/**
 * space repetition order
 * terms not yet viewed
 * date last viewed
 * count of views
 * @param {Array} terms
 * @param {Object} spaceRepObj
 * @returns {number[]} an array containing the indexes of terms in space repetition order
 */
export function spaceRepOrder(terms, spaceRepObj) {
  let playedTemp = [];
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
 * @param {Array} terms
 * @returns {number[]} an array containing the indexes of terms in alphabetic order
 */
export function alphaOrder(terms) {
  // preserve terms unmodified
  let originalIndex = {};
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

  let order = [],
    eOrder = [],
    jOrder = [];
  // order in japanese
  modifiableTerms = orderBy(modifiableTerms, ["japanese"], ["asc"]);
  modifiableTerms.forEach((t, i) => {
    order = [...order, originalIndex[t.uid]];
    jOrder = [
      ...jOrder,
      {
        uid: t.uid,
        label: JapaneseText.parse(t.japanese).getPronunciation(),
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
 * @param {Array} terms
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
 * Array containing the avaiable verb forms
 * @returns {Array}
 * @param {String} rawVerb
 */
export function getVerbFormsArray(rawVerb) {
  const dictionaryForm = JapaneseVerb.parse(rawVerb);

  return [
    { t: "-masu", j: dictionaryForm.masuForm() },
    { t: "-mashou", j: dictionaryForm.mashouForm() },
    { t: "dictionary", j: dictionaryForm },
    { t: "-nai", j: dictionaryForm.naiForm() },
    { t: "-saseru", j: dictionaryForm.saseruForm() },
    { t: "-te", j: dictionaryForm.teForm() },
    { t: "-ta", j: dictionaryForm.taForm() },
  ];
}

/**
 * @returns {JapaneseText}
 * @param {String} rawVerb
 * @param {String} targetForm
 */
export function verbToTargetForm(rawVerb, targetForm) {
  const { j: theForm } = getVerbFormsArray(rawVerb).find(
    (form) => form.t === targetForm
  );

  return theForm;
}

/**
 * decorates label with metadata info (intransitive, keigo, etc.)
 * @param {JapaneseText | JapaneseVerb} jObj
 * @param {*} inJapanese
 * @returns
 */
export function indicatorHelper(jObj, inJapanese, jumpToTerm) {
  let indicators = [];

  let showAsterix = false;
  let showIntr = false;
  let pairUID;
  if (jObj.constructor.name === JapaneseVerb.name) {
    showAsterix = jObj.isExceptionVerb() || jObj.getVerbClass() === 3;
    showIntr = jObj.isIntransitive();
    pairUID = jObj.getTransitivePair() || jObj.getIntransitivePair();
  }

  const showNaAdj = jObj.isNaAdj();
  const showSlang = jObj.isSlang();
  const showKeigo = jObj.isKeigo();

  if (showIntr || pairUID) {
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
  if (showSlang) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>slang</span>,
    ];
  }
  if (showKeigo) {
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
        <span className="fs-medium">
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
 *
 * @param {Boolean} practiceSide
 * @param {HTML|String} inEnglish
 * @param {HTML|String} inJapanese
 * @param {HTML|String} eLabel
 * @param {HTML|String} jLabel
 * @returns {{{HTML|String}shownValue, {HTML|String}hiddenValue, {HTML|String}shownLabel, {HTML|String}hiddenLabel}}
 */
export function valueLabelHelper(
  practiceSide,
  inEnglish,
  inJapanese,
  eLabel,
  jLabel
) {
  let shownValue, hiddenValue, shownLabel, hiddenLabel;
  if (practiceSide) {
    shownValue = inEnglish;
    hiddenValue = inJapanese;
    shownLabel = eLabel;
    hiddenLabel = jLabel;
  } else {
    shownValue = inJapanese;
    hiddenValue = inEnglish;
    shownLabel = jLabel;
    hiddenLabel = eLabel;
  }

  return { shownValue, hiddenValue, shownLabel, hiddenLabel };
}

/**
 * For cache or indexedDB indexing. Allows to add expression term that can override specific forms of verbs
 * If the word has a pronunciation override return the spelling otherwise undefined
 * @param {*} word
 * @returns {undefined | String}
 */
export function cacheIdx(word) {
  return word.pronounce ? JapaneseText.parse(word).getSpelling() : undefined;
}

/**
 *
 * @param {Boolean} prevPlayed has it been manually played
 * @param {*} autoPlay autoPlay setting
 * @param {*} currentJ current Japanese Term
 * @param {*} currentE current English Term
 * @param {*} previous previous Term
 * @returns {[]} array in order to be played by AudioItem
 */
export function audioWordsHelper(
  prevPlayed,
  autoPlay,
  currentJ,
  currentE,
  previous
) {
  const currJ = {
    tl: "ja",
    q: audioPronunciation(currentJ),
    [gPronounceCacheIndexParam]: cacheIdx(currentJ),
  };

  let audioWords = [currJ, { tl: "en", q: currentE }];
  if (previous !== undefined && prevPlayed === false) {
    if (autoPlay === AUTOPLAY_EN_JP) {
      audioWords = [
        currJ,
        { tl: "en", q: currentE },
        {
          tl: "ja",
          q: audioPronunciation(previous),
          [gPronounceCacheIndexParam]: cacheIdx(previous),
        },
      ];
    } else if (autoPlay === AUTOPLAY_JP_EN) {
      audioWords = [currJ, currJ, { tl: "en", q: previous.english }];
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
 * @param {Boolean} englishSideUp
 * @param {String} uid
 * @param {Object} settings
 * @param {Function} toggleFn
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
