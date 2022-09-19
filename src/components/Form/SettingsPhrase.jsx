import React from "react";
import PropTypes from "prop-types";
import { FILTER_FREQ, FILTER_REP } from "../../reducers/settingsRed";
import SettingsSwitch from "./SettingsSwitch";
import { SetTermGList } from "../Pages/SetTermGList";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { labelOptions } from "../../helper/gameHelper";
import { NotReady } from "./NotReady";

export function SettingsPhrase(props) {
  const {
    show,
    phrases,
    phraseOrder,
    phraseSide,
    phraseRomaji,
    phraseFreq,
    phraseReinforce,
    phraseGroups,
    phraseActive,
    phraseFilter,
    togglePhrasesFilter,
    toggleActiveGrp,
    removeFrequencyPhrase,
    setPhrasesOrdering,
    togglePhrasesReinforcement,
    togglePhrasesRomaji,
    flipPhrasesPracticeSide,
  } = props;

  if (phrases.length < 1 || Object.keys(phraseGroups).length < 1)
    return <NotReady addlStyle="main-panel" />;

  let el;
  try {
    el = show && (
      <div className="outer">
        <div className="d-flex flex-row justify-content-between">
          <div className="column-1">
            <h4>
              {labelOptions(phraseFilter, [
                "Phrases Group",
                "Frequency List",
                "Space Repetition",
              ])}
            </h4>
            <div className="mb-2">
              <SettingsSwitch
                active={phraseFilter % 2 === 0}
                action={togglePhrasesFilter}
                color="default"
                statusText={"Filter by"}
              />
            </div>
            {phraseFilter === FILTER_FREQ && phraseFreq.length === 0 && (
              <div className="fst-italic">No phrases have been chosen</div>
            )}

            {phraseFilter !== FILTER_FREQ && (
              <SetTermGList
                vocabGroups={phraseGroups}
                vocabActive={phraseActive}
                toggleTermActiveGrp={(grp) => toggleActiveGrp("phrases", grp)}
              />
            )}
            {phraseFilter === FILTER_FREQ && phraseFreq.length > 0 && (
              <SetTermGFList
                vocabGroups={phraseGroups}
                vocabActive={phraseActive}
                vocabFreq={phraseFreq}
                vocabulary={phrases}
                removeFrequencyWord={removeFrequencyPhrase}
                toggleTermActiveGrp={(grp) => toggleActiveGrp("phrases", grp)}
              />
            )}
          </div>
          <div className="column-2">
            <div className="setting-block">
              <div className="mb-2">
                <SettingsSwitch
                  active={!phraseOrder}
                  action={setPhrasesOrdering}
                  disabled={phraseFilter === FILTER_REP}
                  statusText="Random Order"
                />
              </div>
              <div className="mb-2">
                <SettingsSwitch
                  active={phraseReinforce}
                  action={togglePhrasesReinforcement}
                  disabled={phraseFilter === FILTER_FREQ}
                  statusText="Reinforcement"
                />
              </div>
              <div className="mb-2">
                <SettingsSwitch
                  active={phraseRomaji}
                  action={togglePhrasesRomaji}
                  statusText="Romaji"
                />
              </div>
              <div>
                <SettingsSwitch
                  active={phraseSide}
                  action={flipPhrasesPracticeSide}
                  color="default"
                  statusText={phraseSide ? "English" : "Japanese"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    el = <div>{JSON.stringify(e)}</div>;
  }

  return el;
}

SettingsPhrase.propTypes = {
  show: PropTypes.bool,
  phrases: PropTypes.array,

  phraseOrder: PropTypes.bool,
  phraseRomaji: PropTypes.bool,
  phraseSide: PropTypes.bool,
  phraseFilter: PropTypes.number,
  phraseFreq: PropTypes.array,
  phraseReinforce: PropTypes.bool,
  phraseGroups: PropTypes.object,
  phraseActive: PropTypes.array,

  setPhrasesOrdering: PropTypes.func,
  togglePhrasesFilter: PropTypes.func,
  toggleActiveGrp: PropTypes.func,
  togglePhrasesRomaji: PropTypes.func,

  togglePhrasesReinforcement: PropTypes.func,
  removeFrequencyPhrase: PropTypes.func,
  flipPhrasesPracticeSide: PropTypes.func,
};
