/**
 * Goes to the next term or selects one from the frequency list
 * @param {*} freqFilter
 * @param {*} frequency
 * @param {*} filteredVocab
 * @param {*} reinforcedUID
 * @param {*} updateReinforcedUID
 * @param {*} gotoNext
 * @param {*} removeFrequencyTerm
 */
export function play(
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
  const reinforced = [false, false, true][Math.floor(Math.random() * 3)];
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
 * @param {*} reinforcedUID
 * @param {*} frequency
 * @param {*} selectedIndex
 * @param {*} randomOrder
 * @param {*} filteredVocab
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
