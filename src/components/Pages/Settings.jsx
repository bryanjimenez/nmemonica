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
  toggleSwipe,
  toggleActiveGrp,
  DebugLevel,
  setMotionThreshold,
} from "../../actions/settingsAct";
import { NotReady } from "../Form/NotReady";
import { SetTermGList } from "./SetTermGList";
import { getKanji } from "../../actions/kanjiAct";
import { getVocabulary } from "../../actions/vocabularyAct";
import { getPhrases } from "../../actions/phrasesAct";
import SettingsSwitch from "../Form/SettingsSwitch";
import KanaOptionsSlider from "../Form/KanaOptionsSlider";
import {
  getMemoryStorageStatus,
  setPersistentStorage,
} from "../../actions/storageAct";
import {
  labelOptions,
  getStaleSpaceRepKeys,
  motionThresholdCondition,
  getDeviceMotionEventPermission,
} from "../../helper/gameHelper";
import { JapaneseText, furiganaParseRetry } from "../../helper/JapaneseText";
import SettingsVocab from "../Form/SettingsVocab";
import SettingsPhrase from "../Form/SettingsPhrase";
import { logger } from "../../actions/consoleAct";
import { ErrorInfo } from "../../helper/ErrorInfo";
import Console from "../Form/Console";
import { logify } from "../../helper/consoleHelper";

import "./Settings.css";
import "./spin.css";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").GroupListMap} GroupListMap
 * @typedef {"sectionPhrase"|"sectionVocabulary"|"sectionKanji"|"sectionStaleSpaceRep"} Sections
 * @typedef {{ quota: number, usage: number, persistent: boolean }} MemoryDataObject
 * @typedef {import("../Form/Console").ConsoleMessage} ConsoleMessage
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

/**
 * @typedef {Object} SettingsState
 * @property {ConsoleMessage[]} errorMsgs
 * @property {boolean} spin
 * @property {boolean} sectionKanji
 * @property {boolean} sectionVocabulary
 * @property {boolean} sectionPhrase
 * @property {boolean} sectionStaleSpaceRep
 * @property {string} swVersion
 * @property {string} jsVersion
 * @property {string} bundleVersion
 * @property {boolean} hardRefreshUnavailable
 * @property {number} shakeIntensity
 */

/**
 * @typedef {Object} SettingsProps
 * @property {boolean} darkMode
 * @property {MemoryDataObject} memory
 * @property {number} debug
 * @property {boolean} touchSwipe
 * @property {number} motionThreshold
 * @property {RawVocabulary[]} phrases
 * @property {RawVocabulary[]} vocabulary
 * @property {boolean} wideMode
 * @property {boolean} easyMode
 * @property {number} charSet
 * @property {number} choiceN
 * @property {boolean} particlesARomaji
 * @property {number} kanjiFilter
 * @property {GroupListMap} kanjiGroups
 * @property {string[]} kanjiActive
 * @property {boolean} oppositesQRomaji
 * @property {boolean} oppositesARomaji
 * @property {typeof toggleKana} toggleKana
 * @property {typeof toggleDarkMode} toggleDarkMode
 * @property {typeof setPersistentStorage} setPersistentStorage
 * @property {typeof getMemoryStorageStatus} getMemoryStorageStatus
 * @property {typeof toggleDebug} toggleDebug
 * @property {typeof toggleSwipe} toggleSwipe
 * @property {typeof setMotionThreshold} setMotionThreshold
 * @property {typeof getPhrases} getPhrases
 * @property {typeof getVocabulary} getVocabulary
 * @property {typeof setHiraganaBtnN} setHiraganaBtnN
 * @property {typeof toggleKanaGameWideMode} toggleKanaGameWideMode
 * @property {typeof toggleKanaEasyMode} toggleKanaEasyMode
 * @property {typeof setParticlesARomaji} setParticlesARomaji
 * @property {typeof getKanji} getKanji
 * @property {typeof toggleActiveGrp} toggleActiveGrp
 * @property {typeof setOppositesQRomaji} setOppositesQRomaji
 * @property {typeof setOppositesARomaji} setOppositesARomaji
 * @property {typeof logger} logger
 * @property {SpaceRepetitionMap} vRepetition
 * @property {SpaceRepetitionMap} pRepetition
 */

class Settings extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {SettingsState} */
    this.state = {
      spin: false,
      sectionKanji: false,
      sectionVocabulary: false,
      sectionPhrase: false,
      sectionStaleSpaceRep: false,
      swVersion: "",
      jsVersion: "",
      bundleVersion: "",
      hardRefreshUnavailable: false,
      errorMsgs: [],
      shakeIntensity: 0,
    };

    /** @type {SettingsProps} */
    this.props;

    /** @type {import("../../typings/raw").SetState<SettingsState>} */
    this.setState;

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
    this.motionListener = this.motionListener.bind(this);
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

    if (this.props.motionThreshold > 0) {
      getDeviceMotionEventPermission(() => {
        window.addEventListener("devicemotion", this.motionListener);
      }, this.componentDidCatch);
    }
  }

  /**
   * @param {SettingsProps} prevProps
   */
  componentDidUpdate(prevProps) {
    if (this.props.motionThreshold > 0 && prevProps.motionThreshold === 0) {
      getDeviceMotionEventPermission(() => {
        window.addEventListener("devicemotion", this.motionListener);
      }, this.componentDidCatch);
    } else if (
      this.props.motionThreshold === 0 &&
      prevProps.motionThreshold > 0
    ) {
      window.removeEventListener("devicemotion", this.motionListener);
    }
  }

  componentWillUnmount() {
    navigator.serviceWorker.removeEventListener(
      "message",
      this.swMessageEventListener
    );

    if (this.props.motionThreshold > 0) {
      window.removeEventListener("devicemotion", this.motionListener);
    }
  }

  /**
   * @param {Error} error
   */
  static getDerivedStateFromError(error) {
    const causeMsg =
      // @ts-expect-error Error.cause
      (error.cause !== undefined && [
        // @ts-expect-error Error.cause
        { msg: JSON.stringify(error.cause).replaceAll(",", ", "), css: "px-4" },
      ]) ||
      [];

    const errorMsgs = [
      { msg: error.name + ": " + error.message, css: "px-2" },
      ...causeMsg,
    ].map((e) => ({ ...e, lvl: DebugLevel.ERROR }));

    // state
    return {
      errorMsgs,
    };
  }

  /**
   * @param {Error} error
   */
  componentDidCatch(error) {
    // @ts-expect-error Error.cause
    const cause = error.cause;

    this.props.toggleDebug(DebugLevel.DEBUG);

    switch (cause?.code) {
      case "StaleVocabActiveGrp":
        {
          const stale = cause.value;
          this.props.logger("Error: " + error.message, DebugLevel.ERROR);
          this.props.logger(
            "Group " + JSON.stringify(stale) + " Removed",
            DebugLevel.ERROR
          );
          this.props.toggleActiveGrp("vocabulary", stale);
          this.setState({ errorMsgs: [] });
        }

        break;
      case "StalePhraseActiveGrp":
        {
          const stale = cause.value;
          this.props.logger("Error: " + error.message, DebugLevel.ERROR);
          this.props.logger(
            "Group " + JSON.stringify(stale) + " Removed",
            DebugLevel.ERROR
          );
          this.props.toggleActiveGrp("phrases", stale);
          this.setState({ errorMsgs: [] });
        }

        break;
      case "DeviceMotionEvent":
        {
          this.props.logger("Error: " + error.message, DebugLevel.ERROR);
          this.props.setMotionThreshold(0);
        }
        break;
    }
  }

  /**
   * @param {MessageEvent} event
   */
  swMessageEventListener(event) {
    if (event.data.type === "DO_HARD_REFRESH") {
      const { error } = event.data;

      if (error) {
        this.props.logger(error, DebugLevel.ERROR);
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
   * Handler for when device is shaken
   * @param {DeviceMotionEvent} event
   */
  motionListener(event) {
    try {
      motionThresholdCondition(event, this.props.motionThreshold, (value) => {
        this.setState({ shakeIntensity: Number(value.toFixed(2)) });
        setTimeout(() => {
          this.setState({ shakeIntensity: undefined });
        }, 300);
      });
    } catch (error) {
      if (error instanceof Error) {
        this.componentDidCatch(error);
      }
    }
  }

  /**
   * Build JSX element listing stale items
   * @param {{key:string, uid:string, english:string}[]} terms
   */
  staleSpaceRep(terms) {
    return terms.reduce((/** @type {JSX.Element[]} */ a, text, i) => {
      const separator = <hr key={terms.length + i} />;

      const row = (
        <div key={i} className="row">
          <span className="col p-0">{text.key}</span>
          <span className="col p-0">{text.english}</span>
          <span className="col p-0 app-sm-fs-xx-small">
            <div>{text.uid}</div>
          </span>
        </div>
      );

      return a.length > 0 && i < terms.length
        ? [...a, separator, row]
        : [...a, row];
    }, []);
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
    if (this.state.errorMsgs.length > 0) {
      const minState = logify(this.state);
      const minProps = logify(this.props);

      const messages = [
        ...this.state.errorMsgs,
        { msg: "props:", lvl: DebugLevel.WARN, css: "px-2" },
        { msg: minProps, lvl: DebugLevel.WARN, css: "px-4" },
        { msg: "state:", lvl: DebugLevel.WARN, css: "px-2" },
        { msg: minState, lvl: DebugLevel.WARN, css: "px-4" },
      ];

      return (
        <div>
          <div className="d-flex flex-column justify-content-around">
            <Console messages={messages} />
          </div>
        </div>
      );
    }

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

    const { keys: vKeys, list: vocabuStaleInfo } = getStaleSpaceRepKeys(
      this.props.vRepetition,
      this.props.vocabulary,
      "[Stale Vocabulary]"
    );
    const { keys: pKeys, list: phraseStaleInfo } = getStaleSpaceRepKeys(
      this.props.pRepetition,
      this.props.phrases,
      "[Stale Phrase]"
    );
    const staleSpaceRepKeys = new Set([...vKeys, ...pKeys]);

    const staleSpaceRepTerms = this.staleSpaceRep([
      ...vocabuStaleInfo,
      ...phraseStaleInfo,
    ]);

    return (
      <div className="settings">
        <div className="d-flex flex-column justify-content-between px-3">
          <div className={pageClassName}>
            <div className="d-flex justify-content-between">
              <h2>Global</h2>
              <h2></h2>
            </div>
            <div>
              <div className="d-flex flex-row justify-content-between">
                <div className="column-1 d-flex flex-column justify-content-end">
                  {this.props.motionThreshold > 0 && (
                    <div className="w-25 d-flex flex-row justify-content-between">
                      <div
                        className="clickable px-2 pb-2"
                        onClick={() => {
                          if (this.props.motionThreshold - 0.5 <= 0) {
                            this.props.setMotionThreshold(0);
                          } else {
                            this.props.setMotionThreshold(
                              this.props.motionThreshold - 0.5
                            );
                          }
                        }}
                      >
                        -
                      </div>
                      <div
                        className={classNames({
                          "px-2": true,
                          "correct-color":
                            this.state.shakeIntensity >
                              this.props.motionThreshold &&
                            this.state.shakeIntensity <=
                              this.props.motionThreshold + 1,
                          "question-color":
                            this.state.shakeIntensity >
                              this.props.motionThreshold + 1 &&
                            this.state.shakeIntensity <=
                              this.props.motionThreshold + 2,
                          "incorrect-color":
                            this.state.shakeIntensity >
                            this.props.motionThreshold + 2,
                        })}
                      >
                        {this.state.shakeIntensity ??
                          this.props.motionThreshold}
                      </div>
                      <div
                        className="clickable px-2"
                        onClick={() => {
                          this.props.setMotionThreshold(
                            this.props.motionThreshold + 0.5
                          );
                        }}
                      >
                        +
                      </div>
                    </div>
                  )}
                </div>
                <div className="column-2">
                  <div className="setting-block">
                    <SettingsSwitch
                      active={this.props.darkMode}
                      action={this.props.toggleDarkMode}
                      statusText={
                        (this.props.darkMode ? "Dark" : "Light") + " Mode"
                      }
                    />
                  </div>
                  <div className="setting-block">
                    <SettingsSwitch
                      active={this.props.touchSwipe}
                      action={this.props.toggleSwipe}
                      statusText={"Touch Swipes"}
                    />
                  </div>
                  <div className="setting-block">
                    <SettingsSwitch
                      active={this.props.motionThreshold > 0}
                      action={() => {
                        if (this.props.motionThreshold === 0) {
                          this.props.setMotionThreshold(6);
                        } else {
                          this.props.setMotionThreshold(0);
                        }
                      }}
                      statusText={"Accelerometer"}
                    />
                  </div>
                </div>
              </div>
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
                <div className="column-2"></div>
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
                <KanaOptionsSlider
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
                    active={this.props.debug > DebugLevel.OFF}
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
            {staleSpaceRepTerms.length > 0 && (
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <h5>Stale Space Repetition</h5>
                  {this.collapseExpandToggler("sectionStaleSpaceRep")}
                </div>
                <div className="px-4">
                  <span>
                    {"keys: " + JSON.stringify(Array.from(staleSpaceRepKeys))}
                  </span>
                </div>

                {this.state.sectionStaleSpaceRep && (
                  <div className="failed-spacerep-view container mt-2 p-0">
                    {staleSpaceRepTerms}
                  </div>
                )}
              </div>
            )}
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
    motionThreshold: state.settings.global.motionThreshold,

    phrases: state.phrases.value,
    pRepetition: state.settings.phrases.repetition,
    vocabulary: state.vocabulary.value,
    vRepetition: state.settings.vocabulary.repetition,

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
  motionThreshold: PropTypes.number,
  setMotionThreshold: PropTypes.func,

  // phrases
  getPhrases: PropTypes.func,
  phrases: PropTypes.array,
  pRepetition: PropTypes.object,

  // vocabulary
  getVocabulary: PropTypes.func,
  vocabulary: PropTypes.array,
  vRepetition: PropTypes.object,

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
  setMotionThreshold,
  logger,
})(Settings);

export { SettingsMeta };
