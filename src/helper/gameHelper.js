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
