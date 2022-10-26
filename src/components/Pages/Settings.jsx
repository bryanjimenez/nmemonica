import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import { PlusCircleIcon, SyncIcon, XCircleIcon } from "@primer/octicons-react";

import {
  setHiraganaBtnN,
  toggleKanaGameWideMode,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
  toggleDarkMode,
  toggleKana,
  toggleKanaEasyMode,
  toggleDebug,
  DEBUG_OFF,
  toggleSwipe,
  toggleActiveGrp,
  DEBUG_ERROR,
} from "../../actions/settingsAct";
import { NotReady } from "../Form/NotReady";
import { SetTermGList } from "./SetTermGList";
import { getKanji } from "../../actions/kanjiAct";
import { getVocabulary } from "../../actions/vocabularyAct";
import { getPhrases } from "../../actions/phrasesAct";
import SettingsSwitch from "../Form/SettingsSwitch";
import HiraganaOptionsSlider from "../Form/HiraganaOptionsSlider";
import {
  getMemoryStorageStatus,
  setPersistentStorage,
} from "../../actions/storageAct";
import { labelOptions } from "../../helper/gameHelper";
import { JapaneseText, furiganaParseRetry } from "../../helper/JapaneseText";
import SettingsVocab from "../Form/SettingsVocab";
import SettingsPhrase from "../Form/SettingsPhrase";
import { logger } from "../../actions/consoleAct";
import { ErrorInfo } from "../../helper/ErrorInfo";

import "./Settings.css";
import "./spin.css";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").GroupListMap} GroupListMap
 * @typedef {"sectionPhrase"|"sectionVocabulary"|"sectionKanji"} Sections
 * @typedef {{ quota: number, usage: number, persistent: boolean }} MemoryDataObject
 */

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

/**
 * @typedef {{
 * spin: boolean,
 * sectionKanji: boolean,
 * sectionVocabulary: boolean,
 * sectionPhrase: boolean,
 * swVersion: string,
 * jsVersion: string,
 * bundleVersion: string,
 * hardRefreshUnavailable: boolean,
 * }} SettingsState
 */

/**
 * @typedef {{
 * darkMode: boolean,
 * memory: MemoryDataObject,
 * debug: number,
 * touchSwipe: boolean,
 * phrases: RawVocabulary[],
 * vocabulary: RawVocabulary[],
 * wideMode: boolean,
 * easyMode: boolean,
 * charSet: number,
 * choiceN: number,
 * particlesARomaji: boolean,
 * kanjiFilter: number,
 * kanjiGroups: GroupListMap,
 * kanjiActive: string[],
 * oppositesQRomaji: boolean,
 * oppositesARomaji: boolean,
 * toggleKana: typeof toggleKana,
 * toggleDarkMode: typeof toggleDarkMode,
 * setPersistentStorage: typeof setPersistentStorage,
 * getMemoryStorageStatus: typeof getMemoryStorageStatus,
 * toggleDebug: typeof toggleDebug,
 * toggleSwipe: typeof toggleSwipe,
 * getPhrases: typeof getPhrases,
 * getVocabulary: typeof getVocabulary,
 * setHiraganaBtnN: typeof setHiraganaBtnN,
 * toggleKanaGameWideMode: typeof toggleKanaGameWideMode,
 * toggleKanaEasyMode: typeof toggleKanaEasyMode,
 * setParticlesARomaji: typeof setParticlesARomaji,
 * getKanji: typeof getKanji,
 * toggleActiveGrp: typeof toggleActiveGrp,
 * setOppositesQRomaji: typeof setOppositesQRomaji,
 * setOppositesARomaji: typeof setOppositesARomaji,
 * logger: typeof logger
 * }} SettingsProps
 */

class Settings extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    this.state = {
      spin: false,
      sectionKanji: false,
      sectionVocabulary: false,
      sectionPhrase: false,
      swVersion: "",
      jsVersion: "",
      bundleVersion: "",
      hardRefreshUnavailable: false,
    };

    /** @type {SettingsProps} */
    this.props;

    this.collapseExpandToggler = this.collapseExpandToggler.bind(this);

    if (this.props.vocabulary.length === 0) {
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

    navigator.serviceWorker.controller?.postMessage({
      type: "SW_VERSION",
    });
  }

  componentWillUnmount() {
    navigator.serviceWorker.removeEventListener(
      "message",
      this.swMessageEventListener
    );
  }

  /**
   * @param {MessageEvent} event
   */
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

  /**
   * @param {RawVocabulary[]} terms
   */
  failedFuriganaList(terms) {
    return terms.reduce((/** @type {JSX.Element[]} */ a, text, i) => {
      const t = JapaneseText.parse(text);
      if (t.hasFurigana()) {
        try {
          furiganaParseRetry(t.getPronunciation(), t.getSpelling());
        } catch (e) {
          if (e instanceof ErrorInfo) {
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
      }
      return a;
    }, []);
  }

  /**
   * @param {Sections} section
   */
  collapseExpandToggler(section) {
    const icon = this.state[section] ? (
      <XCircleIcon className="clickable" size="medium" aria-label="collapse" />
    ) : (
      <PlusCircleIcon className="clickable" size="medium" aria-label="expand" />
    );

    return (
      <h2
        onClick={() => {
          this.setState((/** @type {SettingsState} */ state) => ({
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
      Object.keys(this.props.kanjiGroups).length < 1
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
            {this.state.sectionPhrase && <SettingsPhrase />}
          </div>
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Vocabulary</h2>
              {this.collapseExpandToggler("sectionVocabulary")}
            </div>
            {this.state.sectionVocabulary && <SettingsVocab />}
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
                          navigator.serviceWorker.controller?.postMessage({
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

                        navigator.serviceWorker.controller?.postMessage({
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
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    darkMode: state.settings.global.darkMode,
    touchSwipe: state.settings.global.touchSwipe,

    phrases: state.phrases.value,
    vocabulary: state.vocabulary.value,

    kanjiGroups: state.kanji.grpObj,
    kanjiFilter: state.settings.kanji.filter,
    kanjiActive: state.settings.kanji.activeGroup,

    oppositesQRomaji: state.settings.opposites.qRomaji,
    oppositesARomaji: state.settings.opposites.aRomaji,

    choiceN: state.settings.kana.choiceN,
    wideMode: state.settings.kana.wideMode,
    easyMode: state.settings.kana.easyMode,
    charSet: state.settings.kana.charSet,

    particlesARomaji: state.settings.particles.aRomaji,

    memory: state.settings.global.memory,
    debug: state.settings.global.debug,
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

  // vocabulary
  getVocabulary: PropTypes.func,
  vocabulary: PropTypes.array,

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
  toggleActiveGrp: PropTypes.func,

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

  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
  toggleDarkMode,

  getVocabulary,
  getPhrases,
  getKanji,
  toggleActiveGrp,

  setPersistentStorage,
  getMemoryStorageStatus,
  toggleDebug,
  toggleSwipe,
  logger,
})(Settings);

export { SettingsMeta };
