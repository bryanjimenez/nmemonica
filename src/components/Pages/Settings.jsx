import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import {
  flipPhrasesPracticeSide,
  flipVocabularyPracticeSide,
  setHiraganaBtnN,
  toggleKanaGameWideMode,
  setVerbsOrdering,
  setVerbsMasu,
  setVocabularyOrdering,
  setPhrasesOrdering,
  togglePhrasesRomaji,
  toggleVocabularyRomaji,
  toggleVocabularyHint,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
  toggleVocabularyActiveGrp,
  toggleVocabularyAutoPlay,
  toggleDarkMode,
  toggleAutoVerbView,
  removeFrequencyWord,
  toggleVocabularyFilter,
  togglePhrasesFilter,
  removeFrequencyPhrase,
  toggleKana,
  toggleKanaEasyMode,
  toggleVocabularyReinforcement,
  togglePhrasesReinforcement,
} from "../../actions/settingsAct";
import { getVocabulary } from "../../actions/vocabularyAct";
import SettingsSwitch from "../Form/SettingsSwitch";
import HiraganaOptionsSlider from "../Form/HiraganaOptionsSlider";
import { SyncIcon, XCircleIcon } from "@primer/octicons-react";

import "./Settings.css";
import "./spin.css";
import { getPhrases } from "../../actions/phrasesAct";
import { NotReady } from "../Form/NotReady";
import { SetVocabGList } from "./SetVocabGList";
import { SetVocabGFList } from "./SetVocabGFList";

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      spin: false,
    };

    if (Object.keys(this.props.vocabGroups).length === 0) {
      this.props.getVocabulary();
    }

    if (this.props.phrases.length === 0) {
      this.props.getPhrases();
    }
  }

  render() {
    const pageClassName = classNames({ "mb-5": true });

    if (this.props.vocabulary.length < 1)
      return <NotReady addlStyle="main-panel" />;

    return (
      <div className="settings">
        <div className="d-flex flex-column justify-content-between pl-3 pr-3">
          <div className={pageClassName}>
            <h2>Global</h2>
            <div className="setting-block">
              <SettingsSwitch
                active={this.props.darkMode}
                action={this.props.toggleDarkMode}
                statusText={(this.props.darkMode ? "Dark" : "Light") + " Mode"}
              />
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Verbs</h2>
            <div className="setting-block">
              <div className="mb-2">
                <SettingsSwitch
                  active={!this.props.verbOrder}
                  action={this.props.setVerbsOrdering}
                  statusText="Random Order"
                />
              </div>
              <div>
                <SettingsSwitch
                  active={this.props.verbMasu}
                  action={this.props.setVerbsMasu}
                  color="default"
                  statusText={this.props.verbMasu ? "Masu" : "Dictionary"}
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Phrases</h2>
            <div className="outter">
              <div className="d-flex flex-row justify-content-between">
                <div className="column-1">
                  <h4>Filtering</h4>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.phraseFilter}
                      action={this.props.togglePhrasesFilter}
                      // color="default"
                      statusText="Frequency filter"
                    />
                  </div>
                  {this.props.phraseFilter &&
                    this.props.phraseFreq.length === 0 && (
                      <div className="fst-italic">
                        No phrases have been chosen
                      </div>
                    )}
                  {this.props.phraseFilter && this.props.phraseFreq.length > 0 && (
                    <div>
                      {this.props.phraseFreq.map((pUid, i) => (
                        <div
                          key={i}
                          className="p-0 pl-2 pr-2 clickable"
                          onClick={() => {
                            this.props.removeFrequencyPhrase(pUid);
                          }}
                        >
                          <span className="p-1">
                            <XCircleIcon
                              className="incorrect-color"
                              size="small"
                              aria-label="remove"
                            />
                          </span>
                          <span className="p-1">
                            {
                              (
                                this.props.phrases.find(
                                  (p) => p.uid === pUid
                                ) || { english: pUid }
                              ).english
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="column-2">
                  <div className="setting-block">
                    <div className="mb-2">
                      <SettingsSwitch
                        active={!this.props.phraseOrder}
                        action={this.props.setPhrasesOrdering}
                        statusText="Random Order"
                      />
                    </div>
                    <div className="mb-2">
                      <SettingsSwitch
                        active={this.props.phraseReinforce}
                        action={this.props.togglePhrasesReinforcement}
                        disabled={this.props.phraseFilter}
                        statusText="Reinforcement"
                      />
                    </div>
                    <div className="mb-2">
                      <SettingsSwitch
                        active={this.props.phraseRomaji}
                        action={this.props.togglePhrasesRomaji}
                        statusText="Romaji"
                      />
                    </div>
                    <div>
                      <SettingsSwitch
                        active={this.props.phraseSide}
                        action={this.props.flipPhrasesPracticeSide}
                        color="default"
                        statusText={
                          this.props.phraseSide ? "English" : "Japanese"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Vocabulary</h2>
            <div className="outter">
              <div className="d-flex flex-row justify-content-between">
                <div className="column-1">
                  <h4>Filtering</h4>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabFilter}
                      action={this.props.toggleVocabularyFilter}
                      color="default"
                      statusText={
                        this.props.vocabFilter ? "Frequency" : "Groups"
                      }
                    />
                  </div>
                  {this.props.vocabFilter &&
                    this.props.vocabFreq.length === 0 && (
                      <div className="fst-italic">
                        No words have been chosen
                      </div>
                    )}
                  {!this.props.vocabFilter && (
                    <SetVocabGList
                      vocabGroups={this.props.vocabGroups}
                      vocabActive={this.props.vocabActive}
                      toggleVocabularyActiveGrp={
                        this.props.toggleVocabularyActiveGrp
                      }
                    />
                  )}
                  {this.props.vocabFilter &&
                    this.props.vocabFreq.length > 0 && (
                      <SetVocabGFList
                        vocabGroups={this.props.vocabGroups}
                        vocabActive={this.props.vocabActive}
                        vocabFreq={this.props.vocabFreq}
                        vocabulary={this.props.vocabulary}
                        removeFrequencyWord={this.props.removeFrequencyWord}
                        toggleVocabularyActiveGrp={
                          this.props.toggleVocabularyActiveGrp
                        }
                      />
                    )}
                </div>

                <div className="column-2 setting-block">
                  <div className="mb-2">
                    <SettingsSwitch
                      active={!this.props.vocabOrder}
                      action={this.props.setVocabularyOrdering}
                      color="default"
                      statusText={
                        !this.props.vocabOrder ? "Randomized" : "Alphabetic"
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabReinforce}
                      action={this.props.toggleVocabularyReinforcement}
                      disabled={this.props.vocabFilter}
                      statusText="Reinforcement"
                    />
                  </div>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabRomaji}
                      action={this.props.toggleVocabularyRomaji}
                      statusText="Romaji"
                    />
                  </div>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabHint}
                      action={this.props.toggleVocabularyHint}
                      statusText="Hint"
                    />
                  </div>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabSide}
                      action={this.props.flipVocabularyPracticeSide}
                      color="default"
                      statusText={this.props.vocabSide ? "English" : "Japanese"}
                    />
                  </div>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabAutoPlay}
                      action={this.props.toggleVocabularyAutoPlay}
                      statusText="Auto Play"
                    />
                  </div>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.autoVerbView}
                      action={this.props.toggleAutoVerbView}
                      statusText="Auto Verb View"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Opposites Game</h2>
            <div className="setting-block">
              <div className="mb-2">
                <SettingsSwitch
                  active={this.props.oppositesQRomaji}
                  action={this.props.setOppositesQRomaji}
                  statusText="Question Romaji"
                />
              </div>
              <div>
                <SettingsSwitch
                  active={this.props.oppositesARomaji}
                  action={this.props.setOppositesARomaji}
                  statusText="Answer Romaji"
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Kana Game</h2>

            <div className="setting-block">
              <div>
                <SettingsSwitch
                  active={this.props.charSet === 0}
                  action={this.props.toggleKana}
                  statusText={
                    this.props.charSet === 0
                      ? "Hiragana"
                      : this.props.charSet === 1
                      ? "Katakana"
                      : "Mixed"
                  }
                />
              </div>
              <div className="d-flex justify-content-end p-2">
                <HiraganaOptionsSlider
                  initial={this.props.choiceN}
                  wideMode={this.props.wideMode}
                  setChoiceN={this.props.setHiraganaBtnN}
                  toggleWide={this.props.toggleKanaGameWideMode}
                />
              </div>
              <div>
                <SettingsSwitch
                  active={this.props.easyMode}
                  action={this.props.toggleKanaEasyMode}
                  disabled={this.props.charSet === 2}
                  statusText="Kana Hints"
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Particles Game</h2>
            <div className="setting-block">
              <SettingsSwitch
                active={this.props.particlesARomaji}
                action={this.props.setParticlesARomaji}
                statusText="Answer Romaji"
              />
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Application</h2>
            <div className="d-flex justify-content-end">
              <p id="hard-refresh" className="mr-2">
                Hard Refresh
              </p>
              <div
                className={classNames({ "spin-a-bit": this.state.spin })}
                style={{ height: "24px" }}
                aria-labelledby="hard-refresh"
                onClick={() => {
                  fetch("refresh").then((res) => {
                    if (res.status < 400) {
                      this.setState({
                        spin: true,
                      });
                      setTimeout(() => {
                        this.setState({
                          spin: false,
                        });
                      }, 2000);
                    }
                  });
                }}
              >
                <SyncIcon
                  className="clickable"
                  size={24}
                  aria-label="Hard Refresh"
                />
              </div>
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
    choiceN: state.settings.kana.choiceN,
    wideMode: state.settings.kana.wideMode,
    easyMode: state.settings.kana.easyMode,
    charSet: state.settings.kana.charSet,
    verbOrder: state.settings.verbs.ordered,
    verbMasu: state.settings.verbs.masu,
    phraseOrder: state.settings.phrases.ordered,
    phraseSide: state.settings.phrases.practiceSide,
    phraseRomaji: state.settings.phrases.romaji,
    vocabulary: state.vocabulary.value,
    phrases: state.phrases.value,
    phraseFreq: state.settings.phrases.frequency,
    phraseReinforce: state.settings.phrases.reinforce,
    vocabOrder: state.settings.vocabulary.ordered,
    vocabSide: state.settings.vocabulary.practiceSide,
    vocabRomaji: state.settings.vocabulary.romaji,
    vocabHint: state.settings.vocabulary.hint,
    vocabGroups: state.vocabulary.grpObj,
    vocabActive: state.settings.vocabulary.activeGroup,
    vocabAutoPlay: state.settings.vocabulary.autoPlay,
    autoVerbView: state.settings.vocabulary.autoVerbView,
    vocabFilter: state.settings.vocabulary.filter,
    vocabFreq: state.settings.vocabulary.frequency,
    vocabReinforce: state.settings.vocabulary.reinforce,
    phraseFilter: state.settings.phrases.filter,
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
  verbMasu: PropTypes.bool,
  setVerbsMasu: PropTypes.func,

  setPhrasesOrdering: PropTypes.func,
  phraseOrder: PropTypes.bool,
  phraseRomaji: PropTypes.bool,
  togglePhrasesRomaji: PropTypes.func,
  phraseSide: PropTypes.bool,
  phrases: PropTypes.array,
  getPhrases: PropTypes.func,
  phraseFilter: PropTypes.bool,
  phraseFreq: PropTypes.array,
  phraseReinforce: PropTypes.bool,
  togglePhrasesReinforcement: PropTypes.func,

  setHiraganaBtnN: PropTypes.func,
  wideMode: PropTypes.bool,
  easyMode: PropTypes.bool,
  toggleKanaGameWideMode: PropTypes.func,
  toggleKanaEasyMode: PropTypes.func,
  charSet: PropTypes.number,
  toggleKana: PropTypes.func,
  choiceN: PropTypes.number,

  particlesARomaji: PropTypes.bool,
  setParticlesARomaji: PropTypes.func,
  flipPhrasesPracticeSide: PropTypes.func,
  togglePhrasesFilter: PropTypes.func,
  removeFrequencyPhrase: PropTypes.func,

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
  toggleVocabularyFilter: PropTypes.func,
  vocabulary: PropTypes.array,
  vocabFreq: PropTypes.array,
  vocabFilter: PropTypes.bool,
  removeFrequencyWord: PropTypes.func,
  vocabAutoPlay: PropTypes.bool,
  toggleVocabularyAutoPlay: PropTypes.func,
  getVocabulary: PropTypes.func,
  autoVerbView: PropTypes.bool,
  toggleAutoVerbView: PropTypes.func,
  vocabReinforce: PropTypes.bool,
  toggleVocabularyReinforcement: PropTypes.func,

  oppositesQRomaji: PropTypes.bool,
  setOppositesQRomaji: PropTypes.func,
  oppositesARomaji: PropTypes.bool,
  setOppositesARomaji: PropTypes.func,
};

export default connect(mapStateToProps, {
  setHiraganaBtnN,
  toggleKanaGameWideMode,
  toggleKanaEasyMode,
  toggleKana,
  setVerbsOrdering,
  setVerbsMasu,
  flipPhrasesPracticeSide,
  flipVocabularyPracticeSide,
  setPhrasesOrdering,
  setVocabularyOrdering,
  togglePhrasesRomaji,
  toggleVocabularyRomaji,
  toggleVocabularyHint,
  removeFrequencyWord,
  toggleVocabularyFilter,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
  getVocabulary,
  toggleVocabularyActiveGrp,
  toggleVocabularyAutoPlay,
  toggleVocabularyReinforcement,
  toggleDarkMode,
  toggleAutoVerbView,
  togglePhrasesFilter,
  togglePhrasesReinforcement,
  removeFrequencyPhrase,
  getPhrases,
})(Settings);

export { SettingsMeta };
