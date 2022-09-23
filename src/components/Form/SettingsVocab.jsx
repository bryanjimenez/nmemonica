import React from "react";
import PropTypes from "prop-types";
import { AUTOPLAY_OFF } from "../../actions/settingsAct";
import {
  DEFAULT_SETTINGS,
  FILTER_FREQ,
  FILTER_REP,
} from "../../reducers/settingsRed";
import SettingsSwitch from "./SettingsSwitch";
import { SetTermGList } from "../Pages/SetTermGList";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { labelOptions } from "../../helper/gameHelper";
import { NotReady } from "./NotReady";
import VerbFormSlider from "./VerbFormSlider";
import {
  ChevronUpIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import classNames from "classnames";

export function SettingsVocab(props) {
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

  const allForms = DEFAULT_SETTINGS.vocabulary.verbFormsOrder;

  const shownForms = props.verbFormsOrder.map((form) =>
    allForms.find((el) => el === form)
  );
  const hiddenForms = allForms.reduce((acc, cur) => {
    if (!shownForms.includes(cur)) {
      acc = [...acc, cur];
    }

    return acc;
  }, []);

  let el;
  try {
    el = show && (
      <div className="outer">
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
              <div className="mb-2">
                <div className="d-flex flex-row justify-content-end">
                  <div>
                    {[
                      shownForms.map((form, k) => (
                        <div key={k} className="d-flex justify-content-between">
                          <div
                            className={classNames({
                              "me-3": true,
                              "d-none": k === 0,
                            })}
                            onClick={() => {
                              if (k > 0) {
                                const a = shownForms.slice(0, k - 1);
                                const b = shownForms[k - 1];
                                const x = shownForms[k];
                                const c = shownForms.slice(k + 1);

                                props.setVerbFormsOrder([...a, x, b, ...c]);
                              }
                            }}
                          >
                            <ChevronUpIcon
                              classname="mt-1"
                              size="small"
                              aria-label="move up"
                            />
                          </div>
                          <span className="w-100 text-start">{form}</span>

                          <div
                            onClick={() => {
                              if (shownForms.length > 1) {
                                const minusK = [
                                  ...shownForms.slice(0, k),
                                  ...shownForms.slice(k + 1),
                                ];

                                props.setVerbFormsOrder(minusK);
                              }
                            }}
                          >
                            <XCircleIcon
                              className={classNames({
                                "mt-1 ms-3": true,
                                "incorrect-color": shownForms.length > 1,
                                "disabled-color": shownForms.length === 1,
                              })}
                              size="small"
                              aria-label="remove"
                            />
                          </div>
                        </div>
                      )),
                      hiddenForms.map((form, k) => (
                        <div
                          key={shownForms.length + k}
                          className="d-flex justify-content-between"
                        >
                          <div className="me-3 transparent-color">
                            <ChevronUpIcon
                              classname="mt-1"
                              size="small"
                              aria-label="move up"
                            />
                          </div>
                          <span className="w-100 text-start disabled-color">
                            {form}
                          </span>
                          <div
                            onClick={() => {
                              props.setVerbFormsOrder([
                                ...shownForms,
                                hiddenForms[k],
                              ]);
                            }}
                          >
                            <PlusCircleIcon
                              className="mt-1 ms-3"
                              size="small"
                              aria-label="add"
                            />
                          </div>
                        </div>
                      )),
                    ]}
                  </div>
                </div>
              </div>
            )}
            {autoVerbView && (
              <div>
                <div className="d-flex justify-content-end p-2">
                  <VerbFormSlider
                    initial={verbColSplit}
                    setChoiceN={updateVerbColSplit}
                    max={props.verbFormsOrder.length}
                    statusText="Column layout"
                  />
                </div>
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
  verbFormsOrder: PropTypes.array,
  setVerbFormsOrder: PropTypes.func,
};
