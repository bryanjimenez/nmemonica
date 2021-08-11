/**
 * Goes to the next term or selects one from the frequency list
 * @param {Boolean} reinforce
 * @param {Boolean} freqFilter
 * @param {Array} frequency
 * @param {Array} filteredVocab
 * @param {String} reinforcedUID
 * @param {Function} updateReinforcedUID
 * @param {Function} gotoNext
 * @param {Function} removeFrequencyTerm
 */
export function play(
  reinforce,
  freqFilter,
  frequency,
  filteredVocab,
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
    const vocabulary = filteredVocab.filter((v) => frequency[idx] === v.uid)[0];

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
 * @param {Array} filteredVocab
 * @returns the term (word or phrase)
 */
export function getTerm(
  reinforcedUID,
  frequency,
  selectedIndex,
  randomOrder,
  filteredVocab
) {
  let term;
  if (reinforcedUID) {
    term = filteredVocab.filter((v) => reinforcedUID === v.uid)[0];
  } else {
    if (randomOrder) {
      const index = randomOrder[selectedIndex];
      term = filteredVocab[index];
    } else {
      term = filteredVocab[selectedIndex];
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
export function termFrequencyGroupFilter(
  isFreqFiltered,
  termList,
  frequencyList,
  activeGrpList,
  toggleFilterType
) {
  let filteredTerms = termList;

  if (isFreqFiltered) {
    // frequency filtering
    if (frequencyList.length > 0) {
      if (activeGrpList.length > 0) {
        filteredTerms = termList.filter(
          (p) => frequencyList.includes(p.uid) && activeGrpList.includes(p.grp)
        );
      } else {
        filteredTerms = termList.filter((p) => frequencyList.includes(p.uid));
      }
    } else {
      // last frequency word was just removed
      toggleFilterType();
    }
  } else {
    // group filtering
    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter(
        (w) =>
          activeGrpList.includes(w.grp) ||
          activeGrpList.includes(w.grp + "." + w.subGrp)
      );
    }
  }

  return filteredTerms;
}
