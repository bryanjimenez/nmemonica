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
} from "../../actions/settingsAct";
import { getVocabulary } from "../../actions/vocabularyAct";
import { GroupItem } from "../Form/GroupItem";
import SettingsSwitch from "../Form/SettingsSwitch";
import HiraganaOptionsSlider from "../Form/HiraganaOptionsSlider";
import { SyncIcon } from "@primer/octicons-react";

import "./Settings.css";
import "./spin.css";

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
  }

  render() {
    const pageClassName = classNames({ "mb-5": true });
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
                  statusText={this.props.phraseSide ? "English" : "Japanese"}
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Vocabulary</h2>
            <div className="outter">
              <div className="d-flex flex-row justify-content-between">
                <div className="column-1">
                  <h5>Groups</h5>
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

                <div className="column-2 setting-block">
                  <div className="mb-2">
                    <SettingsSwitch
                      active={!this.props.vocabOrder}
                      action={this.props.setVocabularyOrdering}
                      statusText="Random Order"
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
            <h2>Hiragana Game</h2>

            <div className="setting-block">
              <div className="d-flex justify-content-end">
                <HiraganaOptionsSlider
                  initial={this.props.choiceN}
                  wideMode={this.props.wideMode}
                  setChoiceN={this.props.setHiraganaBtnN}
                  toggleWide={this.props.toggleHiraganaWideMode}
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
    choiceN: state.settings.hiragana.choiceN,
    wideMode: state.settings.hiragana.wideMode,
    verbOrder: state.settings.verbs.ordered,
    verbMasu: state.settings.verbs.masu,
    phraseOrder: state.settings.phrases.ordered,
    phraseSide: state.settings.phrases.practiceSide,
    phraseRomaji: state.settings.phrases.romaji,
    vocabOrder: state.settings.vocabulary.ordered,
    vocabSide: state.settings.vocabulary.practiceSide,
    vocabRomaji: state.settings.vocabulary.romaji,
    vocabHint: state.settings.vocabulary.hint,
    vocabGroups: state.vocabulary.grpObj,
    vocabActive: state.settings.vocabulary.activeGroup,
    vocabAutoPlay: state.settings.vocabulary.autoPlay,
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
  vocabAutoPlay: PropTypes.bool,
  toggleVocabularyAutoPlay: PropTypes.func,

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
  setVerbsMasu,
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
  toggleVocabularyAutoPlay,
  toggleDarkMode,
})(Settings);

export { SettingsMeta };
