import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { getPhrases } from "../../actions/phrasesAct";
import {
  removeFrequencyPhrase,
  setPhrasesOrdering,
  TermFilterBy,
  toggleActiveGrp,
  togglePhrasesFilter,
  togglePhrasesReinforcement,
  togglePhrasesRomaji,
} from "../../actions/settingsAct";

import SettingsSwitch from "./SettingsSwitch";
import { SetTermGList } from "../Pages/SetTermGList";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { getStaleGroups, labelOptions } from "../../helper/gameHelper";
import { NotReady } from "./NotReady";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").GroupListMap} GroupListMap
 * @typedef {import("../Pages/Settings").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * @typedef {{
 * getPhrases: typeof getPhrases,
 * phrases: RawVocabulary[],
 * phraseOrder: boolean,
 * phraseRomaji: boolean,
 * phraseFilter: typeof TermFilterBy[keyof TermFilterBy],
 * phraseRep: SpaceRepetitionMap,
 * phraseReinforce: boolean,
 * phraseGroups: GroupListMap,
 * phraseActive: string[],
 * setPhrasesOrdering: typeof setPhrasesOrdering,
 * togglePhrasesFilter: typeof togglePhrasesFilter,
 * toggleActiveGrp: typeof toggleActiveGrp,
 * togglePhrasesRomaji: typeof togglePhrasesRomaji,
 * togglePhrasesReinforcement: typeof togglePhrasesReinforcement,
 * removeFrequencyPhrase: typeof removeFrequencyPhrase,
 * }} SettingsPhraseProps
 */

class SettingsPhrase extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {SettingsPhraseProps} */
    this.props;
    if (this.props.phrases.length === 0) {
      this.props.getPhrases();
    }
  }

  render() {
    const {
      phrases,
      phraseOrder,
      phraseRomaji,
      phraseRep,
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
    } = this.props;

    const phraseFreq = Object.keys(phraseRep).filter(
      (k) => phraseRep[k]?.rein === true
    );

    if (phrases.length < 1 || Object.keys(phraseGroups).length < 1)
      return <NotReady addlStyle="phrases-settings" />;

    const stale = getStaleGroups(phraseGroups, phraseActive);
    if (stale.length > 0) {
      // @ts-expect-error Error.cause
      const error = new Error("Stale phrases active group", {
        cause: { code: "StalePhraseActiveGrp", value: stale },
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
              {phraseFilter === TermFilterBy.FREQUENCY &&
                phraseFreq.length === 0 && (
                  <div className="fst-italic">No phrases have been chosen</div>
                )}

              {phraseFilter !== TermFilterBy.FREQUENCY && (
                <SetTermGList
                  vocabGroups={phraseGroups}
                  vocabActive={phraseActive}
                  toggleTermActiveGrp={(grp) => toggleActiveGrp("phrases", grp)}
                />
              )}
              {phraseFilter === TermFilterBy.FREQUENCY &&
                phraseFreq.length > 0 && (
                  <SetTermGFList
                    vocabGroups={phraseGroups}
                    vocabActive={phraseActive}
                    vocabFreq={phraseFreq}
                    vocabulary={phrases}
                    removeFrequencyWord={removeFrequencyPhrase}
                    toggleTermActiveGrp={(grp) =>
                      toggleActiveGrp("phrases", grp)
                    }
                  />
                )}
            </div>
            <div className="column-2">
              <div className="setting-block">
                <div className="mb-2">
                  <SettingsSwitch
                    active={!phraseOrder}
                    action={setPhrasesOrdering}
                    disabled={phraseFilter === TermFilterBy.SPACE_REP}
                    statusText="Random Order"
                  />
                </div>
                <div className="mb-2">
                  <SettingsSwitch
                    active={phraseReinforce}
                    action={togglePhrasesReinforcement}
                    disabled={phraseFilter === TermFilterBy.FREQUENCY}
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
}

// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    phrases: state.phrases.value,
    phraseGroups: state.phrases.grpObj,
    phraseOrder: state.settings.phrases.ordered,
    phraseRomaji: state.settings.phrases.romaji,
    phraseReinforce: state.settings.phrases.reinforce,
    phraseActive: state.settings.phrases.activeGroup,
    phraseFilter: state.settings.phrases.filter,
    phraseRep: state.settings.phrases.repetition,
  };
};

SettingsPhrase.propTypes = {
  phrases: PropTypes.array,
  phraseGroups: PropTypes.object,
  phraseOrder: PropTypes.bool,
  phraseRomaji: PropTypes.bool,
  phraseReinforce: PropTypes.bool,
  phraseActive: PropTypes.array,
  phraseFilter: PropTypes.number,
  phraseRep: PropTypes.object,

  getPhrases: PropTypes.func,
  setPhrasesOrdering: PropTypes.func,
  togglePhrasesFilter: PropTypes.func,
  toggleActiveGrp: PropTypes.func,
  togglePhrasesRomaji: PropTypes.func,

  togglePhrasesReinforcement: PropTypes.func,
  removeFrequencyPhrase: PropTypes.func,
};

export default connect(mapStateToProps, {
  getPhrases,
  togglePhrasesFilter,
  toggleActiveGrp,
  removeFrequencyPhrase,
  setPhrasesOrdering,
  togglePhrasesReinforcement,
  togglePhrasesRomaji,
})(SettingsPhrase);
