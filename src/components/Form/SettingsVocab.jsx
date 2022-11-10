import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import {
  ChevronUpIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@primer/octicons-react";

import {
  AutoPlaySetting,
  removeFrequencyWord,
  setVerbFormsOrder,
  setVocabularyOrdering,
  TermFilterBy,
  toggleActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyAutoPlay,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  updateVerbColSplit,
} from "../../actions/settingsAct";
import { getVocabulary } from "../../actions/vocabularyAct";

import { DEFAULT_SETTINGS } from "../../reducers/settingsRed";

import SettingsSwitch from "./SettingsSwitch";
import { SetTermGList } from "../Pages/SetTermGList";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { getStaleGroups, labelOptions } from "../../helper/gameHelper";
import { NotReady } from "./NotReady";
import VerbFormSlider from "./VerbFormSlider";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").GroupListMap} GroupListMap
 */

/**
 * @typedef {{
 * getVocabulary: typeof getVocabulary,
 * vocabulary: RawVocabulary[],
 * verbFormsOrder: string[],
 * vocabOrder: boolean,
 * vocabRomaji: boolean,
 * vocabHint: boolean,
 * vocabFilter: typeof TermFilterBy[keyof TermFilterBy],
 * vocabFreq: string[],
 * vocabReinforce: boolean,
 * vocabAutoPlay: typeof AutoPlaySetting[keyof AutoPlaySetting],
 * vocabGroups: GroupListMap,
 * autoVerbView: boolean,
 * vocabActive: string[],
 * verbColSplit: number,
 * setVocabularyOrdering: typeof setVocabularyOrdering,
 * toggleVocabularyFilter: typeof toggleVocabularyFilter,
 * toggleActiveGrp: typeof toggleActiveGrp,
 * toggleVocabularyRomaji: typeof toggleVocabularyRomaji,
 * toggleVocabularyReinforcement: typeof toggleVocabularyReinforcement,
 * removeFrequencyWord: typeof removeFrequencyWord,
 * toggleVocabularyHint: typeof toggleVocabularyHint,
 * toggleVocabularyAutoPlay: typeof toggleVocabularyAutoPlay,
 * toggleAutoVerbView: typeof toggleAutoVerbView,
 * updateVerbColSplit: typeof updateVerbColSplit,
 * setVerbFormsOrder: typeof setVerbFormsOrder
 * }} SettingsVocabProps
 */

class SettingsVocab extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {SettingsVocabProps} */
    this.props;
    if (Object.keys(this.props.vocabGroups).length === 0) {
      this.props.getVocabulary();
    }
  }

  render() {
    const {
      vocabulary,
      vocabOrder,
      verbFormsOrder,
      vocabFilter,
      vocabFreq,
      vocabGroups,
      vocabActive,
      vocabReinforce,
      vocabRomaji,
      vocabHint,
      vocabAutoPlay,
      autoVerbView,
      verbColSplit,

      removeFrequencyWord,
      setVerbFormsOrder,
      setVocabularyOrdering,
      toggleActiveGrp,
      toggleAutoVerbView,
      toggleVocabularyAutoPlay,
      toggleVocabularyFilter,
      toggleVocabularyHint,
      toggleVocabularyReinforcement,
      toggleVocabularyRomaji,
      updateVerbColSplit,
    } = this.props;

    if (vocabulary.length < 1 || Object.keys(vocabGroups).length < 1)
      return <NotReady addlStyle="vocabulary-settings" />;

    const allForms = DEFAULT_SETTINGS.vocabulary.verbFormsOrder;

    const shownForms = verbFormsOrder.reduce(
      (/** @type {string[]}*/ acc, form) => {
        if (allForms.includes(form)) {
          acc = [...acc, form];
        }

        return acc;
      },
      []
    );

    const hiddenForms = allForms.reduce((/** @type {string[]} */ acc, form) => {
      if (!shownForms.includes(form)) {
        acc = [...acc, form];
      }

      return acc;
    }, []);

    const stale = getStaleGroups(vocabGroups, vocabActive);
    if (stale.length > 0) {
      // @ts-expect-error Error.cause
      const error = new Error("Stale vocabulary active group", {
        cause: { code: "StaleVocabActiveGrp", value: stale },
      });
      throw error;
    }

    let el;
    try {
      el = (
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
              {vocabFilter === TermFilterBy.FREQUENCY &&
                vocabFreq.length === 0 && (
                  <div className="fst-italic">No words have been chosen</div>
                )}
              {vocabFilter !== TermFilterBy.FREQUENCY && (
                <SetTermGList
                  vocabGroups={vocabGroups}
                  vocabActive={vocabActive}
                  toggleTermActiveGrp={(grp) =>
                    toggleActiveGrp("vocabulary", grp)
                  }
                />
              )}
              {vocabFilter === TermFilterBy.FREQUENCY &&
                vocabFreq.length > 0 && (
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
                  disabled={vocabFilter === TermFilterBy.SPACE_REP}
                  statusText={!vocabOrder ? "Randomized" : "Alphabetic"}
                />
              </div>
              <div className="mb-2">
                <SettingsSwitch
                  active={vocabReinforce}
                  action={toggleVocabularyReinforcement}
                  disabled={vocabFilter === TermFilterBy.FREQUENCY}
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
                  active={vocabAutoPlay !== AutoPlaySetting.OFF}
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
                          <div
                            key={k}
                            className="d-flex justify-content-between"
                          >
                            <div
                              className={classNames({
                                "me-3": true,
                                "disabled-color": k === 0,
                              })}
                              onClick={() => {
                                if (k > 0) {
                                  const a = shownForms.slice(0, k - 1);
                                  const b = shownForms[k - 1];
                                  const x = shownForms[k];
                                  const c = shownForms.slice(k + 1);

                                  setVerbFormsOrder([...a, x, b, ...c]);
                                }
                              }}
                            >
                              <ChevronUpIcon
                                className="mt-1"
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

                                  setVerbFormsOrder(minusK);
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
                                className="mt-1"
                                size="small"
                                aria-label="move up"
                              />
                            </div>
                            <span className="w-100 text-start disabled-color">
                              {form}
                            </span>
                            <div
                              onClick={() => {
                                setVerbFormsOrder([
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
                      max={verbFormsOrder.length}
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
}

// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    vocabulary: state.vocabulary.value,
    vocabOrder: state.settings.vocabulary.ordered,
    vocabRomaji: state.settings.vocabulary.romaji,
    vocabHint: state.settings.vocabulary.hintEnabled,
    vocabGroups: state.vocabulary.grpObj,
    vocabActive: state.settings.vocabulary.activeGroup,
    vocabAutoPlay: state.settings.vocabulary.autoPlay,
    autoVerbView: state.settings.vocabulary.autoVerbView,
    verbColSplit: state.settings.vocabulary.verbColSplit,
    vocabFilter: state.settings.vocabulary.filter,
    vocabFreq: state.settings.vocabulary.frequency,
    vocabReinforce: state.settings.vocabulary.reinforce,
    verbFormsOrder: state.settings.vocabulary.verbFormsOrder,
  };
};

SettingsVocab.propTypes = {
  vocabulary: PropTypes.array,
  vocabOrder: PropTypes.bool,
  vocabRomaji: PropTypes.bool,
  vocabHint: PropTypes.bool,
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
  vocabAutoPlay: PropTypes.number,
  autoVerbView: PropTypes.bool,
  verbColSplit: PropTypes.number,
  vocabFilter: PropTypes.number,
  vocabFreq: PropTypes.array,
  vocabReinforce: PropTypes.bool,
  verbFormsOrder: PropTypes.array,

  getVocabulary: PropTypes.func,
  removeFrequencyWord: PropTypes.func,
  setVerbFormsOrder: PropTypes.func,
  setVocabularyOrdering: PropTypes.func,
  toggleActiveGrp: PropTypes.func,
  toggleAutoVerbView: PropTypes.func,
  toggleVocabularyAutoPlay: PropTypes.func,
  toggleVocabularyFilter: PropTypes.func,
  toggleVocabularyHint: PropTypes.func,
  toggleVocabularyReinforcement: PropTypes.func,
  toggleVocabularyRomaji: PropTypes.func,
  updateVerbColSplit: PropTypes.func,
};

export default connect(mapStateToProps, {
  getVocabulary,
  removeFrequencyWord,
  setVerbFormsOrder,
  setVocabularyOrdering,
  toggleActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyAutoPlay,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  updateVerbColSplit,
})(SettingsVocab);
