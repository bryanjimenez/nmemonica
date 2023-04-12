import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { getPhrase } from "../../slices/phraseSlice";
import {
  removeFrequencyPhrase,
  togglePhrasesOrdering,
  togglePhrasesRomaji,
} from "../../slices/settingSlice";
import {
  TermFilterBy,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import SettingsSwitch from "./SettingsSwitch";
import { SetTermGList } from "../Pages/SetTermGList";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { getStaleGroups, labelOptions } from "../../helper/gameHelper";
import { NotReady } from "./NotReady";
import {
  toggleActiveGrp,
  togglePhrasesFilter,
  togglePhrasesReinforcement,
} from "../../slices/settingSlice";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").GroupListMap} GroupListMap
 * @typedef {import("../Pages/Settings").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {typeof import("../../slices/settingHelper").TermSortBy} SortTypes
 */

/**
 * @typedef {Object} SettingsPhraseProps
 * @property {typeof getPhrase} getPhrase
 * @property {RawVocabulary[]} phrases
 * @property {SortTypes[keyof SortTypes]} phraseOrder
 * @property {boolean} phraseRomaji
 * @property {typeof TermFilterBy[keyof TermFilterBy]} phraseFilter
 * @property {SpaceRepetitionMap} phraseRep
 * @property {boolean} phraseReinforce
 * @property {GroupListMap} phraseGroups
 * @property {string[]} phraseActive
 * @property {typeof togglePhrasesOrdering} togglePhrasesOrdering
 * @property {typeof togglePhrasesFilter} togglePhrasesFilter
 * @property {typeof toggleActiveGrp} toggleActiveGrp
 * @property {typeof togglePhrasesRomaji} togglePhrasesRomaji
 * @property {typeof togglePhrasesReinforcement} togglePhrasesReinforcement
 * @property {typeof removeFrequencyPhrase} removeFrequencyPhrase
 */

class SettingsPhrase extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {SettingsPhraseProps} */
    this.props;
    if (this.props.phrases.length === 0) {
      this.props.getPhrase();
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
      togglePhrasesOrdering,
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
                  "NOT_USED_Tags",
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
              {phraseFilter === TermFilterBy.GROUP && (
                <SetTermGList
                  termsGroups={phraseGroups}
                  termsActive={phraseActive}
                  toggleTermActiveGrp={(grp) => toggleActiveGrp("phrases", grp)}
                />
              )}
              {phraseFilter === TermFilterBy.FREQUENCY &&
                phraseFreq.length === 0 && (
                  <div className="fst-italic">No phrases have been chosen</div>
                )}
              {phraseFilter === TermFilterBy.FREQUENCY &&
                phraseFreq.length > 0 && (
                  <SetTermGFList
                    termsActive={phraseActive}
                    termsFreq={phraseFreq}
                    terms={phrases}
                    removeFrequencyTerm={removeFrequencyPhrase}
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
                    active={phraseOrder === TermSortBy.RANDOM}
                    action={togglePhrasesOrdering}
                    color="default"
                    statusText={labelOptions(phraseOrder, TermSortByLabel)}
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

const mapStateToProps = (/** @type {RootState} */ state) => {
  return {
    phrases: state.phrases.value,
    phraseGroups: state.phrases.grpObj,
    phraseOrder: state.settingsHK.phrases.ordered,
    phraseRomaji: state.settingsHK.phrases.romaji,
    phraseReinforce: state.settingsHK.phrases.reinforce,
    phraseActive: state.settingsHK.phrases.activeGroup,
    phraseFilter: state.settingsHK.phrases.filter,
    phraseRep: state.settingsHK.phrases.repetition,
  };
};

SettingsPhrase.propTypes = {
  phrases: PropTypes.array,
  phraseGroups: PropTypes.object,
  phraseOrder: PropTypes.number,
  phraseRomaji: PropTypes.bool,
  phraseReinforce: PropTypes.bool,
  phraseActive: PropTypes.array,
  phraseFilter: PropTypes.number,
  phraseRep: PropTypes.object,

  getPhrase: PropTypes.func,
  togglePhrasesOrdering: PropTypes.func,
  togglePhrasesFilter: PropTypes.func,
  toggleActiveGrp: PropTypes.func,
  togglePhrasesRomaji: PropTypes.func,

  togglePhrasesReinforcement: PropTypes.func,
  removeFrequencyPhrase: PropTypes.func,
};

export default connect(mapStateToProps, {
  getPhrase,
  togglePhrasesFilter,
  toggleActiveGrp,
  removeFrequencyPhrase,
  togglePhrasesOrdering,
  togglePhrasesReinforcement,
  togglePhrasesRomaji,
})(SettingsPhrase);
