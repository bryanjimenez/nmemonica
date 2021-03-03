import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import {
  flipPhrasesPracticeSide,
  flipVocabularyPracticeSide,
  setHiraganaBtnN,
  toggleHiraganaWideMode,
  setVerbsOrdering,
  setVocabularyOrdering,
  setPhrasesOrdering,
  togglePhrasesRomaji,
  toggleVocabularyRomaji,
  toggleVocabularyHint,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
  toggleVocabularyActiveGrp,
  toggleDarkMode,
} from "../../actions/settingsAct";
import HiraganaSettings from "../Form/HiraganaSettings";
import Toggle from "../Form/Toggle";
import { getVocabulary } from "../../actions/vocabularyAct";
import { GroupItem } from "../Form/GroupItem";

import "./Settings.css";

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

class Settings extends Component {
  constructor(props) {
    super(props);

    if (Object.keys(this.props.vocabGroups).length === 0) {
      this.props.getVocabulary();
    }
  }

  render() {
    const pageClassName = classNames({ "mb-5": true });
    return (
      <div className="settings">
        <div className="d-flex flex-column justify-content-between pl-3 pr-3 h-100">
          <div className={pageClassName}>
            <h2>Global</h2>
            <div className="setting-block">
              <Toggle
                active={this.props.darkMode}
                action={this.props.toggleDarkMode}
                statusText="Mode"
                activeText="Dark"
                inactiveText="Light"
              />
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Verbs</h2>
            <div className="setting-block">
              <Toggle
                active={this.props.verbOrder}
                action={this.props.setVerbsOrdering}
                statusText="List"
                activeText="Ordered"
                inactiveText="Random"
              />
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Phrases</h2>
            <div className="setting-block">
              <div className="mb-2">
                <Toggle
                  active={this.props.phraseOrder}
                  action={this.props.setPhrasesOrdering}
                  statusText="List"
                  activeText="Ordered"
                  inactiveText="Random"
                />
              </div>
              <div className="mb-2">
                <Toggle
                  active={this.props.phraseRomaji}
                  action={this.props.togglePhrasesRomaji}
                  statusText="Romaji"
                  activeText="Shown"
                  inactiveText="Hidden"
                />
              </div>
              <div>
                <Toggle
                  active={this.props.phraseSide}
                  action={this.props.flipPhrasesPracticeSide}
                  statusText="Side"
                  activeText="English"
                  inactiveText="Japanese"
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Vocabulary</h2>
            <div className="outter d-flex flex-row justify-content-between">
              <div>
                <h5>Groups</h5>
                <div>
                  {Object.keys(this.props.vocabGroups).map((g, i) => {
                    const grpActive = this.props.vocabActive.includes(g);

                    return (
                      <div key={i}>
                        <GroupItem
                          key={i}
                          active={this.props.vocabActive.includes(g)}
                          onClick={() => {
                            this.props.toggleVocabularyActiveGrp(g);
                          }}
                        >
                          {g}
                        </GroupItem>

                        {!grpActive &&
                          this.props.vocabGroups[g].map((s, i) => (
                            <GroupItem
                              key={i}
                              addlStyle="ml-3"
                              active={this.props.vocabActive.includes(
                                g + "." + s
                              )}
                              onClick={() => {
                                this.props.toggleVocabularyActiveGrp(
                                  g + "." + s
                                );
                              }}
                            >
                              {s}
                            </GroupItem>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="setting-block">
                <div className="mb-2">
                  <Toggle
                    active={this.props.vocabOrder}
                    action={this.props.setVocabularyOrdering}
                    statusText="List"
                    activeText="Ordered"
                    inactiveText="Random"
                  />
                </div>
                <div className="mb-2">
                  <Toggle
                    active={this.props.vocabRomaji}
                    action={this.props.toggleVocabularyRomaji}
                    statusText="Romaji"
                    activeText="Shown"
                    inactiveText="Hidden"
                  />
                </div>
                <div className="mb-2">
                  <Toggle
                    active={this.props.vocabHint}
                    action={this.props.toggleVocabularyHint}
                    statusText="Hint"
                    activeText="Shown"
                    inactiveText="Hidden"
                  />
                </div>
                <div>
                  <Toggle
                    active={this.props.vocabSide}
                    action={this.props.flipVocabularyPracticeSide}
                    statusText="Side"
                    activeText="English"
                    inactiveText="Japanese"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Opposites</h2>
            <div className="setting-block">
              <div className="mb-2">
                <Toggle
                  active={this.props.oppositesQRomaji}
                  action={this.props.setOppositesQRomaji}
                  statusText="Q romaji"
                  activeText="Shown"
                  inactiveText="Hidden"
                />
              </div>
              <div>
                <Toggle
                  active={this.props.oppositesARomaji}
                  action={this.props.setOppositesARomaji}
                  statusText="A romaji"
                  activeText="Shown"
                  inactiveText="Hidden"
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>HiraganaGame</h2>
            <div className="setting-block">
              <div className="mb-2 w-50" style={{ marginLeft: "auto" }}>
                <HiraganaSettings
                  active={!this.props.wideMode}
                  action={this.props.setHiraganaBtnN}
                  initial={this.props.choiceN}
                  activeText="WideMode ON_"
                  inactiveText="WideMode OFF"
                  initial2={this.props.wideMode}
                  action2={this.props.toggleHiraganaWideMode}
                  min={4}
                  max={16}
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>ParticlesGame</h2>
            <div className="setting-block">
              <Toggle
                active={this.props.particlesARomaji}
                action={this.props.setParticlesARomaji}
                statusText="A romaji"
                activeText="Shown"
                inactiveText="Hidden"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    darkMode: state.settings.global.darkMode,
    choiceN: state.settings.hiragana.choiceN,
    wideMode: state.settings.hiragana.wideMode,
    verbOrder: state.settings.verbs.ordered,
    phraseOrder: state.settings.phrases.ordered,
    phraseSide: state.settings.phrases.practiceSide,
    phraseRomaji: state.settings.phrases.romaji,
    vocabOrder: state.settings.vocabulary.ordered,
    vocabSide: state.settings.vocabulary.practiceSide,
    vocabRomaji: state.settings.vocabulary.romaji,
    vocabHint: state.settings.vocabulary.hint,
    vocabGroups: state.vocabulary.grpObj,
    vocabActive: state.settings.vocabulary.activeGroup,
    oppositesQRomaji: state.settings.opposites.qRomaji,
    oppositesARomaji: state.settings.opposites.aRomaji,
    particlesARomaji: state.settings.particles.aRomaji,
  };
};

Settings.propTypes = {
  darkMode: PropTypes.bool,
  toggleDarkMode: PropTypes.func,
  verbOrder: PropTypes.bool,
  setVerbsOrdering: PropTypes.func,

  setPhrasesOrdering: PropTypes.func,
  phraseOrder: PropTypes.bool,
  phraseRomaji: PropTypes.bool,
  togglePhrasesRomaji: PropTypes.func,
  phraseSide: PropTypes.bool,

  setHiraganaBtnN: PropTypes.func,
  wideMode: PropTypes.bool,
  toggleHiraganaWideMode: PropTypes.func,
  choiceN: PropTypes.number,

  particlesARomaji: PropTypes.bool,
  setParticlesARomaji: PropTypes.func,
  flipPhrasesPracticeSide: PropTypes.func,

  vocabOrder: PropTypes.bool,
  toggleVocabularyHint: PropTypes.func,
  setVocabularyOrdering: PropTypes.func,
  vocabRomaji: PropTypes.bool,
  toggleVocabularyRomaji: PropTypes.func,
  vocabSide: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func,
  vocabHint: PropTypes.bool,
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
  toggleVocabularyActiveGrp: PropTypes.func,

  oppositesQRomaji: PropTypes.bool,
  setOppositesQRomaji: PropTypes.func,
  oppositesARomaji: PropTypes.bool,
  setOppositesARomaji: PropTypes.func,

  getVocabulary: PropTypes.func,
};

export default connect(mapStateToProps, {
  setHiraganaBtnN,
  toggleHiraganaWideMode,
  setVerbsOrdering,
  flipPhrasesPracticeSide,
  flipVocabularyPracticeSide,
  setPhrasesOrdering,
  setVocabularyOrdering,
  togglePhrasesRomaji,
  toggleVocabularyRomaji,
  toggleVocabularyHint,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
  getVocabulary,
  toggleVocabularyActiveGrp,
  toggleDarkMode,
})(Settings);

export { SettingsMeta };
