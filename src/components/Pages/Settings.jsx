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
  toggleVocabularyRomaji,
  toggleVocabularyHint,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
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
  toggleSwipe,
  updateVerbColSplit,
  toggleActiveGrp,
} from "../../actions/settingsAct";
import { getVocabulary } from "../../actions/vocabularyAct";
import SettingsSwitch from "../Form/SettingsSwitch";
import HiraganaOptionsSlider from "../Form/HiraganaOptionsSlider";
import { PlusCircleIcon, SyncIcon, XCircleIcon } from "@primer/octicons-react";

import "./Settings.css";
import "./spin.css";
import { getPhrases } from "../../actions/phrasesAct";
import { NotReady } from "../Form/NotReady";
import { SetTermGList } from "./SetTermGList";
import { SetTermGFList } from "./SetTermGFList";
import {
  getMemoryStorageStatus,
  setPersistentStorage,
} from "../../actions/storageAct";
import { FILTER_FREQ, FILTER_REP } from "../../reducers/settingsRed";
import { labelOptions } from "../../helper/gameHelper";
import { furiganaParse, JapaneseText } from "../../helper/JapaneseText";
import VerbFormSlider from "../Form/VerbFormSlider";
import { getKanji } from "../../actions/kanjiAct";

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      spin: false,
      sectionKanji: false,
      sectionVocabulary: false,
      sectionPhrase: false,
    };

    this.collapseExpandToggler = this.collapseExpandToggler.bind(this);

    if (Object.keys(this.props.vocabGroups).length === 0) {
      this.props.getVocabulary();
    }

    if (Object.keys(this.props.kanjiGroups).length === 0) {
      this.props.getKanji();
    }

    if (this.props.phrases.length === 0) {
      this.props.getPhrases();
    }
  }

  componentDidMount() {
    this.props.getMemoryStorageStatus();
  }

  failedFuriganaList(terms) {
    return terms.reduce((a, text, i) => {
      const t = JapaneseText.parse(text.japanese);
      if (t.hasFurigana()) {
        try {
          furiganaParse(t.getPronunciation(), t.getSpelling());
        } catch (e) {
          console.log(e.data);

          const separator = <hr key={terms.length + i} />;

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

  collapseExpandToggler(section) {
    const icon = this.state[section] ? (
      <XCircleIcon className="clickable" size="medium" aria-label="collapse" />
    ) : (
      <PlusCircleIcon className="clickable" size="medium" aria-label="expand" />
    );

    return (
      <h2
        onClick={() => {
          this.setState((state) => ({
            [section]: !state[section],
          }));
        }}
      >
        {icon}
      </h2>
    );
  }

  render() {
    const pageClassName = classNames({ "mb-5": true });

    if (
      this.props.vocabulary.length < 1 ||
      this.props.phrases.length < 1 ||
      Object.keys(this.props.kanjiGroups).length < 1 ||
      Object.keys(this.props.vocabGroups).length < 1 ||
      Object.keys(this.props.phraseGroups).length < 1
    )
      return <NotReady addlStyle="main-panel" />;

    const failedFurigana = this.failedFuriganaList([
      ...this.props.phrases,
      ...this.props.vocabulary,
    ]);

    return (
      <div className="settings">
        <div className="d-flex flex-column justify-content-between pl-3 pr-3">
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Global</h2>
              <h2></h2>
            </div>
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
            <div className="d-flex justify-content-between">
              <h2>Phrases</h2>
              {this.collapseExpandToggler("sectionPhrase")}
            </div>

            {this.state.sectionPhrase && (
              <div className="outter">
                <div className="d-flex flex-row justify-content-between">
                  <div className="column-1">
                    <h4>
                      {labelOptions(this.props.phraseFilter, [
                        "Phrases Group",
                        "Frequency List",
                        "Space Repetition",
                      ])}
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
                      <SetTermGList
                        vocabGroups={this.props.phraseGroups}
                        vocabActive={this.props.phraseActive}
                        toggleTermActiveGrp={(grp) =>
                          this.props.toggleActiveGrp("phrases", grp)
                        }
                      />
                    )}
                    {this.props.phraseFilter === FILTER_FREQ &&
                      this.props.phraseFreq.length > 0 && (
                        <SetTermGFList
                          vocabGroups={this.props.phraseGroups}
                          vocabActive={this.props.phraseActive}
                          vocabFreq={this.props.phraseFreq}
                          vocabulary={this.props.phrases}
                          removeFrequencyWord={this.props.removeFrequencyPhrase}
                          toggleTermActiveGrp={(grp) =>
                            this.props.toggleActiveGrp("phrases", grp)
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
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Vocabulary</h2>
              {this.collapseExpandToggler("sectionVocabulary")}
            </div>
            {this.state.sectionVocabulary && (
              <div className="outter">
                <div className="d-flex flex-row justify-content-between">
                  <div className="column-1">
                    <h4>
                      {labelOptions(this.props.vocabFilter, [
                        "Word Group",
                        "Frequency List",
                        "Space Repetition",
                      ])}
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
                      <SetTermGList
                        vocabGroups={this.props.vocabGroups}
                        vocabActive={this.props.vocabActive}
                        toggleTermActiveGrp={(grp) =>
                          this.props.toggleActiveGrp("vocabulary", grp)
                        }
                      />
                    )}
                    {this.props.vocabFilter === FILTER_FREQ &&
                      this.props.vocabFreq.length > 0 && (
                        <SetTermGFList
                          vocabGroups={this.props.vocabGroups}
                          vocabActive={this.props.vocabActive}
                          vocabFreq={this.props.vocabFreq}
                          vocabulary={this.props.vocabulary}
                          removeFrequencyWord={this.props.removeFrequencyWord}
                          toggleTermActiveGrp={(grp) =>
                            this.props.toggleActiveGrp("vocabulary", grp)
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
                        statusText={
                          this.props.vocabSide ? "English" : "Japanese"
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
            )}
          </div>
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Kanji</h2>
              {this.collapseExpandToggler("sectionKanji")}
            </div>
            {this.state.sectionKanji && (
              <div className="outter">
                <div className="d-flex flex-row justify-content-between">
                  <div className="column-1">
                    <h4>
                      {labelOptions(this.props.kanjiFilter, [
                        "Kanji Group",
                        "Frequency List",
                        "Space Repetition",
                      ])}
                    </h4>
                    <div className="mb-2">
                      <SettingsSwitch
                        active={false}
                        action={() => {}}
                        color="default"
                        statusText={"Filter by"}
                      />
                    </div>
                    <SetTermGList
                      vocabGroups={this.props.kanjiGroups}
                      vocabActive={this.props.kanjiActive}
                      toggleTermActiveGrp={(grp) =>
                        this.props.toggleActiveGrp("kanji", grp)
                      }
                    />
                  </div>
                  <div className="column-2 setting-block"></div>
                </div>
              </div>
            )}
          </div>
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Opposites Game</h2>
            </div>
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
            <div className="d-flex justify-content-between">
              <h2>Kana Game</h2>
            </div>

            <div className="setting-block">
              <div>
                <SettingsSwitch
                  active={this.props.charSet === 0}
                  action={this.props.toggleKana}
                  statusText={labelOptions(this.props.charSet, [
                    "Hiragana",
                    "Katakana",
                    "Mixed",
                  ])}
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
            <div className="d-flex justify-content-between">
              <h2>Particles Game</h2>
            </div>
            <div className="setting-block">
              <SettingsSwitch
                active={this.props.particlesARomaji}
                action={this.props.setParticlesARomaji}
                statusText="Answer Romaji"
              />
            </div>
          </div>
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Application</h2>
            </div>
            <div className="setting-block mb-2">
              <SettingsSwitch
                active={this.props.debug > DEBUG_OFF}
                action={this.props.toggleDebug}
                color="default"
                statusText={labelOptions(this.props.debug, [
                  "Debug",
                  "Debug Error",
                  "Debug Warn",
                  "Debug",
                ])}
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
    kanjiGroups: state.kanji.grpObj,
    kanjiFilter: state.settings.kanji.filter,
    kanjiActive: state.settings.kanji.activeGroup,
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
  toggleActiveGrp: PropTypes.func,

  getKanji: PropTypes.func,
  kanjiFilter: PropTypes.number,
  kanjiGroups: PropTypes.object,
  kanjiActive: PropTypes.array,

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
  toggleVocabularyRomaji,
  toggleVocabularyHint,
  removeFrequencyWord,
  toggleVocabularyFilter,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
  getVocabulary,
  toggleVocabularyAutoPlay,
  toggleVocabularyReinforcement,
  toggleDarkMode,
  toggleAutoVerbView,
  togglePhrasesFilter,
  togglePhrasesReinforcement,
  removeFrequencyPhrase,
  getPhrases,
  getKanji,
  toggleActiveGrp,
  setPersistentStorage,
  getMemoryStorageStatus,
  toggleDebug,
  toggleSwipe,
  updateVerbColSplit,
})(Settings);

export { SettingsMeta };
