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
  toggleDebug,
  DEBUG_OFF,
  toggleSwipe,
  updateVerbColSplit,
  toggleActiveGrp,
  DEBUG_ERROR,
  setVerbFormsOrder,
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
import {
  getMemoryStorageStatus,
  setPersistentStorage,
} from "../../actions/storageAct";
import { labelOptions } from "../../helper/gameHelper";
import { JapaneseText, furiganaParseRetry } from "../../helper/JapaneseText";
import { getKanji } from "../../actions/kanjiAct";
import { SettingsVocab } from "../Form/SettingsVocab";
import { SettingsPhrase } from "../Form/SettingsPhrase";
import { logger } from "../../actions/consoleAct";

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
      dbUpgradeInfo: [],
      swVersion: "",
      jsVersion: "",
      bundleVersion: "",
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

    this.swMessageEventListener = this.swMessageEventListener.bind(this);
  }

  componentDidMount() {
    this.props.getMemoryStorageStatus();

    navigator.serviceWorker.addEventListener(
      "message",
      this.swMessageEventListener
    );

    navigator.serviceWorker.controller.postMessage({
      type: "SW_VERSION",
    });
  }

  componentWillUnmount() {
    navigator.serviceWorker.removeEventListener(
      "message",
      this.swMessageEventListener
    );
  }

  swMessageEventListener(event) {
    if (event.data.type === "DO_HARD_REFRESH") {
      const { error } = event.data;

      if (error) {
        this.props.logger(error, DEBUG_ERROR);
      }

      setTimeout(() => {
        this.setState({
          spin: false,
          hardRefreshUnavailable: error,
        });
      }, 2000);
    } else if (event.data.type === "SW_VERSION") {
      const { swVersion, jsVersion, bundleVersion } = event.data;

      this.setState({
        swVersion,
        jsVersion,
        bundleVersion,
      });
    }
  }

  failedFuriganaList(terms) {
    return terms.reduce((a, text, i) => {
      const t = JapaneseText.parse(text);
      if (t.hasFurigana()) {
        try {
          furiganaParseRetry(t.getPronunciation(), t.getSpelling());
        } catch (e) {
          const separator = <hr key={terms.length + i} />;

          const row = (
            <div key={i} className="row">
              <span className="col p-0">{t.toHTML()}</span>
              <span className="col p-0">{text.english}</span>
              <span className="col p-0 app-sm-fs-xx-small">
                <div>{e.message}</div>
                <div>{e.info ? JSON.stringify(e.info) : ""}</div>
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
        <div className="d-flex flex-column justify-content-between px-3">
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
            <SettingsPhrase
              show={this.state.sectionPhrase}
              phrases={this.props.phrases}
              phraseOrder={this.props.phraseOrder}
              phraseSide={this.props.phraseSide}
              phraseRomaji={this.props.phraseRomaji}
              phraseFreq={this.props.phraseFreq}
              phraseReinforce={this.props.phraseReinforce}
              phraseGroups={this.props.phraseGroups}
              phraseActive={this.props.phraseActive}
              phraseFilter={this.props.phraseFilter}
              setPhrasesOrdering={this.props.setPhrasesOrdering}
              togglePhrasesFilter={this.props.togglePhrasesFilter}
              toggleActiveGrp={this.props.toggleActiveGrp}
              togglePhrasesRomaji={this.props.togglePhrasesRomaji}
              togglePhrasesReinforcement={this.props.togglePhrasesReinforcement}
              removeFrequencyPhrase={this.props.removeFrequencyPhrase}
              flipPhrasesPracticeSide={this.props.flipPhrasesPracticeSide}
            />
          </div>
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Vocabulary</h2>
              {this.collapseExpandToggler("sectionVocabulary")}
            </div>
            <SettingsVocab
              show={this.state.sectionVocabulary}
              vocabulary={this.props.vocabulary}
              vocabOrder={this.props.vocabOrder}
              setVocabularyOrdering={this.props.setVocabularyOrdering}
              vocabFilter={this.props.vocabFilter}
              toggleVocabularyFilter={this.props.toggleVocabularyFilter}
              vocabFreq={this.props.vocabFreq}
              vocabGroups={this.props.vocabGroups}
              vocabActive={this.props.vocabActive}
              toggleActiveGrp={this.props.toggleActiveGrp}
              removeFrequencyWord={this.props.removeFrequencyWord}
              vocabReinforce={this.props.vocabReinforce}
              toggleVocabularyReinforcement={
                this.props.toggleVocabularyReinforcement
              }
              vocabRomaji={this.props.vocabRomaji}
              toggleVocabularyRomaji={this.props.toggleVocabularyRomaji}
              vocabHint={this.props.vocabHint}
              toggleVocabularyHint={this.props.toggleVocabularyHint}
              vocabSide={this.props.vocabSide}
              flipVocabularyPracticeSide={this.props.flipVocabularyPracticeSide}
              vocabAutoPlay={this.props.vocabAutoPlay}
              toggleVocabularyAutoPlay={this.props.toggleVocabularyAutoPlay}
              autoVerbView={this.props.autoVerbView}
              toggleAutoVerbView={this.props.toggleAutoVerbView}
              verbColSplit={this.props.verbColSplit}
              updateVerbColSplit={this.props.updateVerbColSplit}
              verbFormsOrder={this.props.verbFormsOrder}
              setVerbFormsOrder={this.props.setVerbFormsOrder}
            />
          </div>
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Kanji</h2>
              {this.collapseExpandToggler("sectionKanji")}
            </div>
            {this.state.sectionKanji && (
              <div className="outer">
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
            <div className="outer">
              <div className="d-flex flex-row justify-content-between">
                <div className="column-1">
                  <div className="setting-block mb-2 mt-2">
                    <div
                      className="d-flex flex-row justify-content-between clickable"
                      onClick={() => {
                        this.setState({
                          swVersion: "",
                          jsVersion: "",
                          bundleVersion: "",
                        });
                        setTimeout(() => {
                          navigator.serviceWorker.controller.postMessage({
                            type: "SW_VERSION",
                          });
                        }, 1000);
                      }}
                    >
                      <div className="pe-2">
                        <div>{"swVersion:"}</div>
                        <div>{"jsVersion:"}</div>
                        <div>{"bundleVersion:"}</div>
                      </div>
                      <div>
                        <div>{this.state.swVersion}</div>
                        <div>{this.state.jsVersion}</div>
                        <div>{this.state.bundleVersion}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="column-2">
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
                  <div
                    className={classNames({
                      "d-flex justify-content-end mb-2": true,
                      "disabled-color": this.state.hardRefreshUnavailable,
                    })}
                  >
                    <p id="hard-refresh" className="text-right">
                      Hard Refresh
                    </p>
                    <div
                      className={classNames({
                        "spin-a-bit": this.state.spin,
                      })}
                      style={{ height: "24px" }}
                      aria-labelledby="hard-refresh"
                      onClick={() => {
                        this.setState({
                          spin: true,
                          hardRefreshUnavailable: false,
                        });

                        setTimeout(() => {
                          if (this.state.spin) {
                            this.setState({
                              spin: false,
                              hardRefreshUnavailable: true,
                            });
                          }
                        }, 3000);

                        navigator.serviceWorker.controller.postMessage({
                          type: "DO_HARD_REFRESH",
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

                  <div className="setting-block mb-2">
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
                </div>
              </div>
            </div>

            {failedFurigana.length > 0 && (
              <div className="mb-2">
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

    phrases: state.phrases.value,
    phraseOrder: state.settings.phrases.ordered,
    phraseSide: state.settings.phrases.practiceSide,
    phraseRomaji: state.settings.phrases.romaji,
    phraseFreq: state.settings.phrases.frequency,
    phraseReinforce: state.settings.phrases.reinforce,
    phraseGroups: state.phrases.grpObj,
    phraseActive: state.settings.phrases.activeGroup,
    phraseFilter: state.settings.phrases.filter,

    vocabulary: state.vocabulary.value,
    vocabOrder: state.settings.vocabulary.ordered,
    vocabSide: state.settings.vocabulary.practiceSide,
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
  // global
  darkMode: PropTypes.bool,
  toggleDarkMode: PropTypes.func,
  memory: PropTypes.object,
  setPersistentStorage: PropTypes.func,
  getMemoryStorageStatus: PropTypes.func,
  debug: PropTypes.number,
  toggleDebug: PropTypes.func,
  touchSwipe: PropTypes.bool,
  toggleSwipe: PropTypes.func,

  // phrases
  getPhrases: PropTypes.func,
  phrases: PropTypes.array,
  phraseOrder: PropTypes.bool,
  phraseRomaji: PropTypes.bool,
  phraseSide: PropTypes.bool,
  phraseFilter: PropTypes.number,
  phraseFreq: PropTypes.array,
  phraseReinforce: PropTypes.bool,
  phraseGroups: PropTypes.object,
  phraseActive: PropTypes.array,

  togglePhrasesFilter: PropTypes.func,
  toggleActiveGrp: PropTypes.func,
  togglePhrasesRomaji: PropTypes.func,
  togglePhrasesReinforcement: PropTypes.func,

  setPhrasesOrdering: PropTypes.func,
  removeFrequencyPhrase: PropTypes.func,
  flipPhrasesPracticeSide: PropTypes.func,

  // vocabulary
  getVocabulary: PropTypes.func,
  vocabulary: PropTypes.array,
  vocabOrder: PropTypes.bool,
  setVocabularyOrdering: PropTypes.func,
  vocabFilter: PropTypes.number,
  toggleVocabularyFilter: PropTypes.func,
  vocabFreq: PropTypes.array,
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
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

  getKanji: PropTypes.func,
  kanjiFilter: PropTypes.number,
  kanjiGroups: PropTypes.object,
  kanjiActive: PropTypes.array,

  oppositesQRomaji: PropTypes.bool,
  setOppositesQRomaji: PropTypes.func,
  oppositesARomaji: PropTypes.bool,
  setOppositesARomaji: PropTypes.func,

  logger: PropTypes.func,
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
  logger,
  setVerbFormsOrder,
})(Settings);

export { SettingsMeta };
