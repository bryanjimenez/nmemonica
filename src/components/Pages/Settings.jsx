import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import {
  flipPhrasesPracticeSide,
  flipVocabularyPracticeSide,
  setHiraganaBtnN,
  toggleKanaGameWideMode,
  setVocabularyOrdering,
  setPhrasesOrdering,
  togglePhrasesRomaji,
  togglePhrasesActiveGrp,
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
  AUTOPLAY_OFF,
  toggleDebug,
  DEBUG_OFF,
  DEBUG_ERROR,
  DEBUG_WARN,
  toggleSwipe,
  updateVerbColSplit,
} from "../../actions/settingsAct";
import { getVocabulary } from "../../actions/vocabularyAct";
import SettingsSwitch from "../Form/SettingsSwitch";
import HiraganaOptionsSlider from "../Form/HiraganaOptionsSlider";
import { SyncIcon } from "@primer/octicons-react";

import "./Settings.css";
import "./spin.css";
import { getPhrases } from "../../actions/phrasesAct";
import { NotReady } from "../Form/NotReady";
import { SetVocabGList } from "./SetVocabGList";
import { SetVocabGFList } from "./SetVocabGFList";
import {
  getMemoryStorageStatus,
  setPersistentStorage,
} from "../../actions/storageAct";
import {
  FILTER_FREQ,
  FILTER_GRP,
  FILTER_REP,
} from "../../reducers/settingsRed";
import { labelOptions } from "../../helper/gameHelper";
import { furiganaParse, JapaneseText } from "../../helper/JapaneseText";
import VerbFormSlider from "../Form/VerbFormSlider";

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

  componentDidMount() {
    this.props.getMemoryStorageStatus();
  }

  failedFuriganaList(terms) {
    const separator = <hr />;

    return terms.reduce((a, text, i) => {
      const t = JapaneseText.parse(text.japanese);
      if (t.hasFurigana()) {
        try {
          furiganaParse(t.getPronunciation(), t.getSpelling());
        } catch (e) {
          console.log(e.data);

          const row = (
            <div key={i} className="row">
              <span className="col p-0">{t.toHTML()}</span>
              <span className="col p-0">{text.english}</span>
              <span className="col p-0 fs-xx-small">
                {e.data ? JSON.stringify(e.data) : ""}
              </span>
            </div>
          );

          return a.length > 0 && i < terms.length - 1
            ? [...a, separator, row]
            : [...a, row];
        }
      }
      return a;
    }, []);
  }

  render() {
    const pageClassName = classNames({ "mb-5": true });

    if (this.props.vocabulary.length < 1)
      return <NotReady addlStyle="main-panel" />;

    const failedFurigana = this.failedFuriganaList([
      ...this.props.phrases,
      ...this.props.vocabulary,
    ]);

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
            <div className="setting-block">
              <SettingsSwitch
                active={this.props.touchSwipe}
                action={this.props.toggleSwipe}
                statusText={"Touch Swipes"}
              />
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Phrases</h2>
            <div className="outter">
              <div className="d-flex flex-row justify-content-between">
                <div className="column-1">
                  <h4>
                    {this.props.phraseFilter === FILTER_GRP
                      ? "Word Group"
                      : this.props.phraseFilter === FILTER_FREQ
                      ? "Frequency List"
                      : "Space Repetition"}
                  </h4>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.phraseFilter % 2 === 0}
                      action={this.props.togglePhrasesFilter}
                      color="default"
                      statusText={"Filter by"}
                    />
                  </div>
                  {this.props.phraseFilter === FILTER_FREQ &&
                    this.props.phraseFreq.length === 0 && (
                      <div className="fst-italic">
                        No phrases have been chosen
                      </div>
                    )}

                  {this.props.phraseFilter !== FILTER_FREQ && (
                    <SetVocabGList
                      vocabGroups={this.props.phraseGroups}
                      vocabActive={this.props.phraseActive}
                      toggleVocabularyActiveGrp={
                        this.props.togglePhrasesActiveGrp
                      }
                    />
                  )}
                  {this.props.phraseFilter === FILTER_FREQ &&
                    this.props.phraseFreq.length > 0 && (
                      <SetVocabGFList
                        vocabGroups={this.props.phraseGroups}
                        vocabActive={this.props.phraseActive}
                        vocabFreq={this.props.phraseFreq}
                        vocabulary={this.props.phrases}
                        removeFrequencyWord={this.props.removeFrequencyPhrase}
                        toggleVocabularyActiveGrp={
                          this.props.togglePhrasesActiveGrp
                        }
                      />
                    )}
                </div>
                <div className="column-2">
                  <div className="setting-block">
                    <div className="mb-2">
                      <SettingsSwitch
                        active={!this.props.phraseOrder}
                        action={this.props.setPhrasesOrdering}
                        disabled={this.props.phraseFilter === FILTER_REP}
                        statusText="Random Order"
                      />
                    </div>
                    <div className="mb-2">
                      <SettingsSwitch
                        active={this.props.phraseReinforce}
                        action={this.props.togglePhrasesReinforcement}
                        disabled={this.props.phraseFilter === FILTER_FREQ}
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
                    <div className="mb-2">
                      <SettingsSwitch
                        active={this.props.vocabAutoPlay !== AUTOPLAY_OFF}
                        action={this.props.toggleVocabularyAutoPlay}
                        statusText={labelOptions(this.props.vocabAutoPlay, [
                          "Auto Play [ ]",
                          "Auto Play [EN,JP]",
                          "Auto Play [JP,EN]",
                        ])}
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
                  <h4>
                    {this.props.vocabFilter === FILTER_GRP
                      ? "Word Group"
                      : this.props.vocabFilter === FILTER_FREQ
                      ? "Frequency List"
                      : "Space Repetition"}
                  </h4>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabFilter % 2 === 0}
                      action={this.props.toggleVocabularyFilter}
                      color="default"
                      statusText={"Filter by"}
                    />
                  </div>
                  {this.props.vocabFilter === FILTER_FREQ &&
                    this.props.vocabFreq.length === 0 && (
                      <div className="fst-italic">
                        No words have been chosen
                      </div>
                    )}
                  {this.props.vocabFilter !== FILTER_FREQ && (
                    <SetVocabGList
                      vocabGroups={this.props.vocabGroups}
                      vocabActive={this.props.vocabActive}
                      toggleVocabularyActiveGrp={
                        this.props.toggleVocabularyActiveGrp
                      }
                    />
                  )}
                  {this.props.vocabFilter === FILTER_FREQ &&
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
                      disabled={this.props.vocabFilter === FILTER_REP}
                      statusText={
                        !this.props.vocabOrder ? "Randomized" : "Alphabetic"
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.vocabReinforce}
                      action={this.props.toggleVocabularyReinforcement}
                      disabled={this.props.vocabFilter === FILTER_FREQ}
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
                      active={this.props.vocabAutoPlay !== AUTOPLAY_OFF}
                      action={this.props.toggleVocabularyAutoPlay}
                      statusText={labelOptions(this.props.vocabAutoPlay, [
                        "Auto Play [ ]",
                        "Auto Play [EN,JP]",
                        "Auto Play [JP,EN]",
                      ])}
                    />
                  </div>

                  <div className="mb-2">
                    <SettingsSwitch
                      active={this.props.autoVerbView}
                      action={this.props.toggleAutoVerbView}
                      statusText="Auto Verb View"
                    />
                  </div>
                  {this.props.autoVerbView && (
                    <div className="d-flex justify-content-end p-2">
                      <VerbFormSlider
                        initial={this.props.verbColSplit}
                        setChoiceN={this.props.updateVerbColSplit}
                        statusText="Column layout"
                      />
                    </div>
                  )}
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
            <div className="setting-block mb-2">
              <SettingsSwitch
                active={this.props.debug > DEBUG_OFF}
                action={this.props.toggleDebug}
                color="default"
                statusText={
                  this.props.debug === DEBUG_OFF
                    ? "Debug"
                    : this.props.debug === DEBUG_ERROR
                    ? "Debug Error"
                    : this.props.debug === DEBUG_WARN
                    ? "Debug Warn"
                    : "Debug"
                }
              />
            </div>

            <div className="d-flex justify-content-end mb-2">
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

            <div className="setting-block">
              <SettingsSwitch
                active={this.props.memory.persistent}
                action={this.props.setPersistentStorage}
                disabled={this.props.memory.persistent}
                color="default"
                statusText={
                  this.props.memory.persistent
                    ? "Persistent " +
                      ~~(this.props.memory.usage / 1024 / 1024) +
                      "/" +
                      ~~(this.props.memory.quota / 1024 / 1024) +
                      "MB"
                    : "Persistent off"
                }
              />
            </div>
            {failedFurigana.length > 0 && (
              <div className="">
                <h5>Failed Furigana Parse</h5>

                <div className="failed-furigana-view container mt-2 p-0">
                  {failedFurigana}
                </div>
              </div>
            )}
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
    phraseOrder: state.settings.phrases.ordered,
    phraseSide: state.settings.phrases.practiceSide,
    phraseRomaji: state.settings.phrases.romaji,
    vocabulary: state.vocabulary.value,
    phrases: state.phrases.value,
    phraseFreq: state.settings.phrases.frequency,
    phraseReinforce: state.settings.phrases.reinforce,
    phraseGroups: state.phrases.grpObj,
    phraseActive: state.settings.phrases.activeGroup,
    vocabOrder: state.settings.vocabulary.ordered,
    vocabSide: state.settings.vocabulary.practiceSide,
    vocabRomaji: state.settings.vocabulary.romaji,
    vocabHint: state.settings.vocabulary.hint,
    vocabGroups: state.vocabulary.grpObj,
    vocabActive: state.settings.vocabulary.activeGroup,
    vocabAutoPlay: state.settings.vocabulary.autoPlay,
    autoVerbView: state.settings.vocabulary.autoVerbView,
    verbColSplit: state.settings.vocabulary.verbColSplit,
    vocabFilter: state.settings.vocabulary.filter,
    vocabFreq: state.settings.vocabulary.frequency,
    vocabReinforce: state.settings.vocabulary.reinforce,
    phraseFilter: state.settings.phrases.filter,
    oppositesQRomaji: state.settings.opposites.qRomaji,
    oppositesARomaji: state.settings.opposites.aRomaji,
    particlesARomaji: state.settings.particles.aRomaji,
    memory: state.settings.global.memory,
    debug: state.settings.global.debug,
    touchSwipe: state.settings.global.touchSwipe,
  };
};

Settings.propTypes = {
  darkMode: PropTypes.bool,
  toggleDarkMode: PropTypes.func,
  memory: PropTypes.object,
  setPersistentStorage: PropTypes.func,
  getMemoryStorageStatus: PropTypes.func,
  debug: PropTypes.number,
  toggleDebug: PropTypes.func,
  touchSwipe: PropTypes.bool,
  toggleSwipe: PropTypes.func,

  setPhrasesOrdering: PropTypes.func,
  phraseOrder: PropTypes.bool,
  phraseRomaji: PropTypes.bool,
  togglePhrasesRomaji: PropTypes.func,
  phraseSide: PropTypes.bool,
  phrases: PropTypes.array,
  getPhrases: PropTypes.func,
  phraseFilter: PropTypes.number,
  phraseFreq: PropTypes.array,
  phraseReinforce: PropTypes.bool,
  togglePhrasesReinforcement: PropTypes.func,
  phraseGroups: PropTypes.object,
  phraseActive: PropTypes.array,
  togglePhrasesActiveGrp: PropTypes.func,

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
  vocabFilter: PropTypes.number,
  removeFrequencyWord: PropTypes.func,
  vocabAutoPlay: PropTypes.number,
  toggleVocabularyAutoPlay: PropTypes.func,
  getVocabulary: PropTypes.func,
  autoVerbView: PropTypes.bool,
  toggleAutoVerbView: PropTypes.func,
  vocabReinforce: PropTypes.bool,
  toggleVocabularyReinforcement: PropTypes.func,
  verbColSplit: PropTypes.number,
  updateVerbColSplit: PropTypes.func,

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
  flipPhrasesPracticeSide,
  flipVocabularyPracticeSide,
  setPhrasesOrdering,
  setVocabularyOrdering,
  togglePhrasesRomaji,
  togglePhrasesActiveGrp,
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
  setPersistentStorage,
  getMemoryStorageStatus,
  toggleDebug,
  toggleSwipe,
  updateVerbColSplit,
})(Settings);

export { SettingsMeta };
