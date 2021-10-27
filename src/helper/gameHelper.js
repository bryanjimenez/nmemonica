import orderBy from "lodash/orderBy";
import { FILTER_FREQ, FILTER_GRP } from "../reducers/settingsRed";
import { shuffleArray } from "./arrayHelper";
import { JapaneseText } from "./JapaneseText";

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
 * Retrieves term (word or phrase) based on the selectedIndex or reinforcedUID. Takes into account ordering.
 * @param {String} reinforcedUID
 * @param {Array} frequency
 * @param {Number} selectedIndex
 * @param {number[] | undefined} alternateOrder
 * @param {Array} filteredTerms
 * @returns the term (word or phrase)
 */
export function getTerm(
  reinforcedUID,
  frequency,
  selectedIndex,
  alternateOrder,
  filteredTerms
) {
  let term;
  if (reinforcedUID) {
    term = filteredTerms.find((v) => reinforcedUID === v.uid);
  } else {
    if (alternateOrder) {
      const index = alternateOrder[selectedIndex];
      term = filteredTerms[index];
    } else {
      term = filteredTerms[selectedIndex];
    }
  }

  if (frequency) {
    term.reinforce = frequency.includes(term.uid);
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
            (activeGrpList.includes(t.grp) ||
              activeGrpList.includes(t.grp + "." + t.subGrp))
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
      filteredTerms = termList.filter(
        (t) =>
          activeGrpList.includes(t.grp) ||
          activeGrpList.includes(t.grp + "." + t.subGrp)
      );
    }
  }

  return filteredTerms;
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

  const playedOrdered = orderBy(playedTemp, ["date", "count", "uid"], ["asc", "asc", "asc"]);

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
