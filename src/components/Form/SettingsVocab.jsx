import React from "react";
import PropTypes from "prop-types";
import { AUTOPLAY_OFF } from "../../actions/settingsAct";
import { FILTER_FREQ, FILTER_REP } from "../../reducers/settingsRed";
import SettingsSwitch from "./SettingsSwitch";
import { SetTermGList } from "../Pages/SetTermGList";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { labelOptions } from "../../helper/gameHelper";
import { NotReady } from "./NotReady";
import VerbFormSlider from "./VerbFormSlider";

export function SettingsVocab(props) {
  // const css = classNames({
  //   [props.addlStyle]: props.addlStyle && true,
  //   "p-0 pl-2 pr-2": true,
  //   "font-weight-bold": props.active,
  // });

  const {
    show,
    vocabulary,
    vocabOrder,
    setVocabularyOrdering,
    vocabFilter,
    toggleVocabularyFilter,
    vocabFreq,
    vocabGroups,
    vocabActive,
    toggleActiveGrp,
    removeFrequencyWord,
    vocabReinforce,
    toggleVocabularyReinforcement,
    vocabRomaji,
    toggleVocabularyRomaji,
    vocabHint,
    toggleVocabularyHint,
    vocabSide,
    flipVocabularyPracticeSide,
    vocabAutoPlay,
    toggleVocabularyAutoPlay,
    autoVerbView,
    toggleAutoVerbView,
    verbColSplit,
    updateVerbColSplit,
  } = props;

  if (vocabulary.length < 1 || Object.keys(vocabGroups).length < 1)
    return <NotReady addlStyle="main-panel" />;

  let el;
  try {
    el = show && (
      <div className="outter">
        <div className="d-flex flex-row justify-content-between">
          <div className="column-1">
            <h4>
              {labelOptions(vocabFilter, [
                "Word Group",
                "Frequency List",
                "Space Repetition",
              ])}
            </h4>
            <div className="mb-2">
              <SettingsSwitch
                active={vocabFilter % 2 === 0}
                action={toggleVocabularyFilter}
                color="default"
                statusText={"Filter by"}
              />
            </div>
            {vocabFilter === FILTER_FREQ && vocabFreq.length === 0 && (
              <div className="fst-italic">No words have been chosen</div>
            )}
            {vocabFilter !== FILTER_FREQ && (
              <SetTermGList
                vocabGroups={vocabGroups}
                vocabActive={vocabActive}
                toggleTermActiveGrp={(grp) =>
                  toggleActiveGrp("vocabulary", grp)
                }
              />
            )}
            {vocabFilter === FILTER_FREQ && vocabFreq.length > 0 && (
              <SetTermGFList
                vocabGroups={vocabGroups}
                vocabActive={vocabActive}
                vocabFreq={vocabFreq}
                vocabulary={vocabulary}
                removeFrequencyWord={removeFrequencyWord}
                toggleTermActiveGrp={(grp) =>
                  toggleActiveGrp("vocabulary", grp)
                }
              />
            )}
          </div>

          <div className="column-2 setting-block">
            <div className="mb-2">
              <SettingsSwitch
                active={!vocabOrder}
                action={setVocabularyOrdering}
                color="default"
                disabled={vocabFilter === FILTER_REP}
                statusText={!vocabOrder ? "Randomized" : "Alphabetic"}
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={vocabReinforce}
                action={toggleVocabularyReinforcement}
                disabled={vocabFilter === FILTER_FREQ}
                statusText="Reinforcement"
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={vocabRomaji}
                action={toggleVocabularyRomaji}
                statusText="Romaji"
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={vocabHint}
                action={toggleVocabularyHint}
                statusText="Hint"
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={vocabSide}
                action={flipVocabularyPracticeSide}
                color="default"
                statusText={vocabSide ? "English" : "Japanese"}
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={vocabAutoPlay !== AUTOPLAY_OFF}
                action={toggleVocabularyAutoPlay}
                statusText={labelOptions(vocabAutoPlay, [
                  "Auto Play [ ]",
                  "Auto Play [EN,JP]",
                  "Auto Play [JP,EN]",
                ])}
              />
            </div>

            <div className="mb-2">
              <SettingsSwitch
                active={autoVerbView}
                action={toggleAutoVerbView}
                statusText="Auto Verb View"
              />
            </div>
            {autoVerbView && (
              <div className="d-flex justify-content-end p-2">
                <VerbFormSlider
                  initial={verbColSplit}
                  setChoiceN={updateVerbColSplit}
                  statusText="Column layout"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (e) {
    el = (
      <div>
        {JSON.stringify({
          verbColSplit,
          updateVerbColSplit,
        })}
      </div>
    );
  }

  return el;
}

SettingsVocab.propTypes = {
  show: PropTypes.bool,
  vocabulary: PropTypes.array,
  vocabOrder: PropTypes.bool,
  setVocabularyOrdering: PropTypes.func,
  vocabFilter: PropTypes.number,
  toggleVocabularyFilter: PropTypes.func,
  vocabFreq: PropTypes.array,
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
  toggleActiveGrp: PropTypes.func,
  removeFrequencyWord: PropTypes.func,
  vocabReinforce: PropTypes.bool,
  toggleVocabularyReinforcement: PropTypes.func,
  vocabRomaji: PropTypes.bool,
  toggleVocabularyRomaji: PropTypes.func,
  vocabHint: PropTypes.bool,
  toggleVocabularyHint: PropTypes.func,
  vocabSide: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func,
  vocabAutoPlay: PropTypes.number,
  toggleVocabularyAutoPlay: PropTypes.func,
  autoVerbView: PropTypes.bool,
  toggleAutoVerbView: PropTypes.func,
  verbColSplit: PropTypes.number,
  updateVerbColSplit: PropTypes.func,
};
