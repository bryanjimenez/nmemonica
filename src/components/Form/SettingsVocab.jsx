import {
  ChevronUpIcon,
  PlusCircleIcon,
  SortAscIcon,
  SortDescIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";

import {
  initialState as VOCABULARY_INIT,
  getVocabulary,
  removeFrequencyWord,
  setMemorizedThreshold,
  setVerbFormsOrder,
  toggleAutoVerbView,
  toggleVocabularyActiveGrp,
  toggleVocabularyBareKanji,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyOrdering,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  updateVerbColSplit,
} from "../../slices/vocabularySlice";

import { Slider } from "@mui/material";
import { getStaleGroups } from "../../helper/gameHelper";
import {
  TermFilterBy,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { SetTermGList } from "../Pages/SetTermGList";
import { NotReady } from "./NotReady";
import SettingsSwitch from "./SettingsSwitch";
import SimpleListMenu from "./SimpleListMenu";
import VerbFormSlider from "./VerbFormSlider";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").GroupListMap} GroupListMap
 * @typedef {import("../Pages/Settings").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {typeof import("../../slices/settingHelper").TermSortBy} SortTypes
 */

/**
 * @typedef {Object} SettingsVocabProps
 * @property {typeof getVocabulary} getVocabulary
 * @property {RawVocabulary[]} vocabulary
 * @property {string[]} verbFormsOrder
 * @property {SortTypes[keyof SortTypes]} vocabOrder
 * @property {boolean} vocabRomaji
 * @property {boolean} showBareKanji
 * @property {boolean} vocabHint
 * @property {typeof TermFilterBy[keyof TermFilterBy]} vocabFilter
 * @property {number} memoThreshold Threshold describing how far memorized a word is
 * @property {SpaceRepetitionMap} vocabRep
 * @property {boolean} vocabReinforce
 * @property {GroupListMap} vocabGroups
 * @property {boolean} autoVerbView
 * @property {string[]} vocabActive
 * @property {number} verbColSplit
 * @property {typeof toggleVocabularyOrdering} toggleVocabularyOrdering
 * @property {typeof toggleVocabularyFilter} toggleVocabularyFilter
 * @property {typeof toggleVocabularyActiveGrp} toggleVocabularyActiveGrp
 * @property {typeof toggleVocabularyRomaji} toggleVocabularyRomaji
 * @property {typeof toggleVocabularyReinforcement} toggleVocabularyReinforcement
 * @property {typeof removeFrequencyWord} removeFrequencyWord
 * @property {typeof toggleVocabularyHint} toggleVocabularyHint
 * @property {typeof toggleAutoVerbView} toggleAutoVerbView
 * @property {typeof updateVerbColSplit} updateVerbColSplit
 * @property {typeof setVerbFormsOrder} setVerbFormsOrder
 * @property {typeof toggleVocabularyBareKanji} toggleVocabularyBareKanji
 * @property {typeof setMemorizedThreshold} setMemorizedThreshold
 */

class SettingsVocab extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {SettingsVocabProps} */
    this.props;

    this.initialMemoThreshold = Math.abs(this.props.memoThreshold);

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
      vocabRep,
      vocabGroups,
      vocabActive,
      vocabReinforce,
      vocabRomaji,
      showBareKanji,
      vocabHint,
      autoVerbView,
      verbColSplit,

      removeFrequencyWord,
      setVerbFormsOrder,
      toggleVocabularyOrdering,
      toggleVocabularyActiveGrp,
      toggleAutoVerbView,
      toggleVocabularyFilter,
      toggleVocabularyHint,
      toggleVocabularyReinforcement,
      toggleVocabularyRomaji,
      updateVerbColSplit,
      toggleVocabularyBareKanji,
    } = this.props;

    const vocabFreq = Object.keys(vocabRep).filter(
      (k) => vocabRep[k]?.rein === true
    );

    if (vocabulary.length < 1 || Object.keys(vocabGroups).length < 1)
      return <NotReady addlStyle="vocabulary-settings" />;

    const allForms = VOCABULARY_INIT.setting.verbFormsOrder;

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
              <SimpleListMenu
                flip={true}
                title={"Filter by:"}
                options={[
                  "Word Group",
                  "Frequency List",
                  // "NOT_USED_Tags",
                ]}
                initial={vocabFilter}
                onChange={toggleVocabularyFilter}
              />
              {vocabFilter === TermFilterBy.GROUP && (
                <SetTermGList
                  termsGroups={vocabGroups}
                  termsActive={vocabActive}
                  toggleTermActiveGrp={toggleVocabularyActiveGrp}
                />
              )}
              {vocabFilter === TermFilterBy.FREQUENCY &&
                vocabFreq.length === 0 && (
                  <div className="fst-italic">No words have been chosen</div>
                )}
              {vocabFilter === TermFilterBy.FREQUENCY &&
                vocabFreq.length > 0 && (
                  <SetTermGFList
                    termsActive={vocabActive}
                    termsFreq={vocabFreq}
                    terms={vocabulary}
                    removeFrequencyTerm={removeFrequencyWord}
                    toggleTermActiveGrp={toggleVocabularyActiveGrp}
                  />
                )}
            </div>

            <div className="column-2 setting-block">
              <SimpleListMenu
                title={"Sort by:"}
                options={TermSortByLabel}
                initial={vocabOrder}
                onChange={toggleVocabularyOrdering}
              />

              {vocabOrder === TermSortBy.DIFFICULTY && (
                <div className="d-flex justify-content-end">
                  <Slider
                    defaultValue={this.initialMemoThreshold}
                    track={
                      this.props.memoThreshold < 0 ? "inverted" : undefined
                    }
                    onChangeCommitted={(e, newValue) => {
                      const sign = this.props.memoThreshold < 0 ? -1 : 1;
                      if(typeof newValue === "number"){
                        this.props.setMemorizedThreshold(sign * newValue);
                      }
                    }}
                    valueLabelDisplay="auto"
                  />

                  <div
                    className="mt-2 ms-3 "
                    onClick={() => {
                      const inv = -1 * this.props.memoThreshold;
                      this.props.setMemorizedThreshold(inv);
                    }}
                  >
                    {this.props.memoThreshold < 0 ? (
                      <SortDescIcon />
                    ) : (
                      <SortAscIcon />
                    )}
                  </div>
                </div>
              )}

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
                  active={showBareKanji}
                  action={toggleVocabularyBareKanji}
                  statusText="English+Kanji"
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
                            <div className="me-3 invisible">
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

const mapStateToProps = (/** @type {RootState} */ state) => {
  return {
    vocabulary: state.vocabulary.value,
    vocabGroups: state.vocabulary.grpObj,

    vocabOrder: state.vocabulary.setting.ordered,
    vocabRomaji: state.vocabulary.setting.romaji,
    showBareKanji: state.vocabulary.setting.bareKanji,
    vocabHint: state.vocabulary.setting.hintEnabled,
    vocabActive: state.vocabulary.setting.activeGroup,
    autoVerbView: state.vocabulary.setting.autoVerbView,
    verbColSplit: state.vocabulary.setting.verbColSplit,
    vocabFilter: state.vocabulary.setting.filter,
    memoThreshold: state.vocabulary.setting.memoThreshold,
    vocabRep: state.vocabulary.setting.repetition,
    vocabReinforce: state.vocabulary.setting.reinforce,
    verbFormsOrder: state.vocabulary.setting.verbFormsOrder,
  };
};

SettingsVocab.propTypes = {
  vocabulary: PropTypes.array,
  vocabGroups: PropTypes.object,

  vocabOrder: PropTypes.number,
  vocabRomaji: PropTypes.bool,
  showBareKanji: PropTypes.bool,
  vocabHint: PropTypes.bool,
  vocabActive: PropTypes.array,
  autoVerbView: PropTypes.bool,
  verbColSplit: PropTypes.number,
  vocabFilter: PropTypes.number,
  memoThreshold: PropTypes.number,
  vocabRep: PropTypes.object,
  vocabReinforce: PropTypes.bool,
  verbFormsOrder: PropTypes.array,

  getVocabulary: PropTypes.func,
  removeFrequencyWord: PropTypes.func,
  setVerbFormsOrder: PropTypes.func,
  toggleVocabularyOrdering: PropTypes.func,
  toggleVocabularyActiveGrp: PropTypes.func,
  toggleAutoVerbView: PropTypes.func,
  toggleVocabularyFilter: PropTypes.func,
  toggleVocabularyHint: PropTypes.func,
  toggleVocabularyReinforcement: PropTypes.func,
  toggleVocabularyRomaji: PropTypes.func,
  updateVerbColSplit: PropTypes.func,
  toggleVocabularyBareKanji: PropTypes.func,
  setMemorizedThreshold: PropTypes.func,
};

export default connect(mapStateToProps, {
  getVocabulary,
  removeFrequencyWord,
  setVerbFormsOrder,
  toggleVocabularyOrdering,
  toggleVocabularyActiveGrp,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  updateVerbColSplit,
  toggleVocabularyBareKanji,
  setMemorizedThreshold,
})(SettingsVocab);
