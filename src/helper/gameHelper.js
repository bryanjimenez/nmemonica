import { orderBy } from "lodash";
import { FILTER_FREQ, FILTER_GRP, FILTER_REP } from "../reducers/settingsRed";

/**
 * Goes to the next term or selects one from the frequency list
 * @param {Boolean} reinforce
 * @param {Boolean} freqFilter
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
  if (!freqFilter && reinforced && frequency.length > 0) {
    const min = 0;
    const max = Math.floor(frequency.length);
    const idx = Math.floor(Math.random() * (max - min) + min);
    const vocabulary = filteredTerms.filter((v) => frequency[idx] === v.uid)[0];

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
 * Retrieves term (word or phrase) based on the selectedIndex or reinforcedUID. Takes into account random ordering.
 * @param {String} reinforcedUID
 * @param {Array} frequency
 * @param {Number} selectedIndex
 * @param {Array} randomOrder
 * @param {Array} filteredTerms
 * @returns the term (word or phrase)
 */
export function getTerm(
  reinforcedUID,
  frequency,
  selectedIndex,
  randomOrder,
  filteredTerms
) {
  let term;
  if (reinforcedUID) {
    term = filteredTerms.filter((v) => reinforcedUID === v.uid)[0];
  } else {
    if (randomOrder) {
      const index = randomOrder[selectedIndex];
      term = filteredTerms[index];
    } else {
      term = filteredTerms[selectedIndex];
    }
  }

  term.reinforce = frequency.includes(term.uid);
  return term;
}

/**
 * Filters terms (words or phrases) list down by groups or frequency list
 * @param {Boolean} isFreqFiltered
 * @param {Array} termList word or phrase list
 * @param {Array} frequencyList
 * @param {Array} activeGrpList
 * @param {Function} toggleFilterType toggle between frequency or group filtering
 * @returns {Array} filteredPhrases
 */
export function termFilterByType(
  isFreqFiltered,
  termList,
  frequencyList,
  spaceRepObj,
  activeGrpList,
  toggleFilterType
) {
  let filteredTerms = termList;
  let spaceRepOrder;

  if (isFreqFiltered === FILTER_FREQ) {
    // frequency filtering
    if (frequencyList.length > 0) {
      if (activeGrpList.length > 0) {
        filteredTerms = termList.filter(
          (v) => frequencyList.includes(v.uid) && activeGrpList.includes(v.grp)
        );
      } else {
        filteredTerms = termList.filter((v) => frequencyList.includes(v.uid));
      }
    } else {
      // last frequency word was just removed
      toggleFilterType(FILTER_GRP);
    }
  } else if (isFreqFiltered === FILTER_GRP) {
    // group filtering
    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter(
        (w) =>
          activeGrpList.includes(w.grp) ||
          activeGrpList.includes(w.grp + "." + w.subGrp)
      );
    }
  } else if (isFreqFiltered === FILTER_REP) {
    // spaced repetition

    const spaceRepList = Object.keys(spaceRepObj).map((k) => ({
      ...spaceRepObj[k],
      uid: k,
    }));
    orderBy(spaceRepList, ["d", "c"], ["acs", "acs"]);

    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter(
        (w) =>
          activeGrpList.includes(w.grp) ||
          activeGrpList.includes(w.grp + "." + w.subGrp)
      );
    }

    let played = [];
    let unPlayed = [];
    for (const vIdx in filteredTerms) {
      const orderIdx = spaceRepList.findIndex(
        (el) => el.uid === filteredTerms[vIdx].uid
      );
      if (orderIdx > -1) {
        played = [...played, { o: orderIdx, u: vIdx }];
      } else {
        unPlayed = [...unPlayed, vIdx];
      }
    }

    played = orderBy(played, ["o"], ["acs"]).map((el) => el.u);

    spaceRepOrder = [...unPlayed, ...played];
  }

  return { terms: filteredTerms, spaceRepOrder };
}
