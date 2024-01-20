import { PlusCircleIcon, SyncIcon, XCircleIcon } from "@primer/octicons-react";
import classNames from "classnames";
import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { buildAction } from "../../helper/eventHandlerHelper";
import {
  getDeviceMotionEventPermission,
  getStaleSpaceRepKeys,
  labelOptions,
  motionThresholdCondition,
} from "../../helper/gameHelper";
import { JapaneseText, furiganaParseRetry } from "../../helper/JapaneseText";
import { useConnectKana } from "../../hooks/useConnectKana";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import {
  debugToggled,
  getMemoryStorageStatus,
  logger,
  setMotionThreshold,
  setPersistentStorage,
  setSwipeThreshold,
  toggleDarkMode,
} from "../../slices/globalSlice";
import {
  setKanaBtnN,
  toggleKana,
  toggleKanaEasyMode,
  toggleKanaGameWideMode,
} from "../../slices/kanaSlice";
import {
  getKanji,
  setKanjiBtnN,
  setKanjiMemorizedThreshold,
  toggleKanjiFadeInAnswers,
  toggleKanjiOrdering,
} from "../../slices/kanjiSlice";
import {
  setOppositesARomaji,
  setOppositesQRomaji,
  toggleOppositeFadeInAnswers,
} from "../../slices/oppositeSlice";
import {
  setParticlesARomaji,
  toggleParticleFadeInAnswers,
} from "../../slices/particleSlice";
import { getPhrase, togglePhraseActiveGrp } from "../../slices/phraseSlice";
import {
  DebugLevel,
  KanaType,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import {
  getVocabulary,
  toggleVocabularyActiveGrp,
} from "../../slices/vocabularySlice";
import type { RawVocabulary } from "../../typings/raw";
import ChoiceNumberSlider from "../Form/ChoiceNumberSlider";
import type { ConsoleMessage } from "../Form/Console";
import { DifficultySubFilter } from "../Form/DifficultySubFilter";
import { NotReady } from "../Form/NotReady";
import SettingsSwitch from "../Form/SettingsSwitch";
import "../../css/Settings.css";
import "../../css/spin.css";
import SimpleListMenu from "../Form/SimpleListMenu";
const SettingsKanji = lazy(() => import("../Form/SettingsKanji"));
const SettingsPhrase = lazy(() => import("../Form/SettingsPhrase"));
const SettingsVocab = lazy(() => import("../Form/SettingsVocab"));

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

// FIXME: getDerivedStateFromError

function /*static*/ getDerivedStateFromError(error: Error) {
  const causeMsg =
    (error.cause !== undefined && [
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

function componentDidCatch(dispatch: AppDispatch, error: Error) {
  const cause = error.cause as { code: string; value: unknown };

  dispatch(debugToggled(DebugLevel.DEBUG));

  switch (cause?.code) {
    case "StaleVocabActiveGrp":
      {
        const stale = cause.value as string;
        dispatch(logger("Error: " + error.message, DebugLevel.ERROR));
        dispatch(
          logger(
            "Group " + JSON.stringify(stale) + " Removed",
            DebugLevel.ERROR
          )
        );
        dispatch(toggleVocabularyActiveGrp(stale));
        // FIXME: componentDidCatch setState
        // this.setState({ errorMsgs: [] });
      }

      break;
    case "StalePhraseActiveGrp":
      {
        const stale = cause.value as string;
        dispatch(logger("Error: " + error.message, DebugLevel.ERROR));
        dispatch(
          logger(
            "Group " + JSON.stringify(stale) + " Removed",
            DebugLevel.ERROR
          )
        );
        dispatch(togglePhraseActiveGrp(stale));
        // FIXME: componentDidCatch setState
        // this.setState({ errorMsgs: [] });
      }

      break;
    case "DeviceMotionEvent":
      {
        dispatch(logger("Error: " + error.message, DebugLevel.ERROR));
        dispatch(setMotionThreshold(0));
      }
      break;
  }
}

/**
 * Build JSX element listing stale items
 */
function staleSpaceRep(terms: { key: string; uid: string; english: string }[]) {
  return terms.reduce<React.JSX.Element[]>((a, text, i) => {
    const separator = <hr key={`stale-meta-${text.uid}`} />;

    const row = (
      <div key={text.uid} className="row">
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

function failedFuriganaList(terms: RawVocabulary[]) {
  return terms.reduce<React.JSX.Element[]>((a, text, i) => {
    const t = JapaneseText.parse(text);
    if (t.hasFurigana()) {
      try {
        furiganaParseRetry(t.getPronunciation(), t.getSpelling());
      } catch (e) {
        if (e instanceof Error && "cause" in e) {
          const errData = e.cause as { code: string; info: unknown };
          if (errData.code === "ParseError" || errData.code === "InputError") {
            const separator = <hr key={`parse-err-sep-${text.uid}`} />;

            const row = (
              <div key={`parse-err-${text.uid}`} className="row">
                <span className="col p-0">
                  {t.toHTML({ showError: false })}
                </span>
                <span className="col p-0">{text.english}</span>
                <span className="col p-0 app-sm-fs-xx-small">
                  <div>{e.message}</div>
                  <div>{errData.info ? JSON.stringify(errData.info) : ""}</div>
                </span>
              </div>
            );

            return a.length > 0 && i < terms.length - 1
              ? [...a, separator, row]
              : [...a, row];
          }
        }
      }
    }
    return a;
  }, []);
}

function buildMotionListener(
  dispatch: AppDispatch,
  motionThreshold: number,
  setShakeIntensity: React.Dispatch<React.SetStateAction<number | undefined>>
) {
  /**
   * Handler for when device is shaken
   */
  return function listener(event: DeviceMotionEvent) {
    try {
      motionThresholdCondition(event, motionThreshold, (value) => {
        setShakeIntensity(Number(value.toFixed(2)));
        setTimeout(() => {
          setShakeIntensity(undefined);
        }, 300);
      });
    } catch (error) {
      if (error instanceof Error) {
        componentDidCatch(dispatch, error);
      }
    }
  };
}

function collapseExpandToggler(
  name: boolean,
  toggleSection: (arg0: (arg1: boolean) => boolean) => void
) {
  const icon = name ? (
    <XCircleIcon className="clickable" size="medium" aria-label="collapse" />
  ) : (
    <PlusCircleIcon className="clickable" size="medium" aria-label="expand" />
  );

  return <h2 onClick={() => toggleSection((t) => !t)}>{icon}</h2>;
}

/**
 * Classnames for page sections
 */
const pageClassName = classNames({ "mb-5": true });

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>();
  const motionListener = useRef<
    ReturnType<typeof buildMotionListener> | undefined
  >(undefined);

  const {
    darkMode,
    swipeThreshold,
    motionThreshold,
    memory,
    debug,

    oppositesQRomaji,
    oppositesARomaji,
    oppositeFadeInAnswers,

    particlesARomaji,
    particleFadeInAnswer,
  } = useConnectSetting();

  const { vocabList: vocabulary, repetition: vRepetition } =
    useConnectVocabulary();
  const { phraseList: phrases, repetition: pRepetition } = useConnectPhrase();
  const {
    kanjiList: kanji,
    orderType: kanjiOrder,
    repetition: kRepetition,
    kanjiTagObj: kanjiTags,
    fadeInAnswers: kanjiFadeInAnswers,
    choiceN: kanjiChoiceN,
  } = useConnectKanji();
  const { charSet, easyMode, wideMode, choiceN } = useConnectKana();

  const { memoThreshold } = useConnectKanji();

  const [spin, setSpin] = useState(false);

  const [sectionKanji, setSectionKanji] = useState(false);
  const [sectionVocabulary, setSectionVocabulary] = useState(false);
  const [sectionPhrase, setSectionPhrase] = useState(false);
  const [sectionStaleSpaceRep, setSectionStaleSpaceRep] = useState(false);
  const [swVersion, setSwVersion] = useState("");
  const [jsVersion, setJsVersion] = useState("");
  const [bundleVersion, setBundleVersion] = useState("");
  const [hardRefreshUnavailable, setHardRefreshUnavailable] = useState(false);
  const [errorMsgs, setErrorMsgs] = useState<ConsoleMessage[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState<number|undefined>(0);

  useEffect(
    () => {
      void dispatch(getMemoryStorageStatus());

      if (vocabulary.length === 0) {
        void dispatch(getVocabulary());
      }

      if (kanjiTags.length === 0) {
        void dispatch(getKanji());
      }

      if (phrases.length === 0) {
        void dispatch(getPhrase());
      }

      navigator.serviceWorker.addEventListener(
        "message",
        swMessageEventListener
      );

      navigator.serviceWorker.controller?.postMessage({
        type: "SW_VERSION",
      });

      return () => {
        navigator.serviceWorker.removeEventListener(
          "message",
          swMessageEventListener
        );

        if (motionListener.current) {
          window.removeEventListener("devicemotion", motionListener.current);
        }
      };
    },
    [
      /** On mount and dismount */
    ]
  );

  useEffect(() => {
    if (motionThreshold > 0 && motionListener.current === undefined) {
      motionListener.current = buildMotionListener(
        dispatch,
        motionThreshold,
        setShakeIntensity
      );

      getDeviceMotionEventPermission(
        () => {
          if (motionListener.current)
            window.addEventListener("devicemotion", motionListener.current);
        },
        (error: Error) => componentDidCatch(dispatch, error)
      );
    } else if (motionThreshold === 0 && motionListener.current !== undefined) {
      window.removeEventListener("devicemotion", motionListener.current);
      motionListener.current = undefined;
    } else {
      if (motionListener.current)
        window.removeEventListener("devicemotion", motionListener.current);

      motionListener.current = buildMotionListener(
        dispatch,
        motionThreshold,
        setShakeIntensity
      );

      getDeviceMotionEventPermission(
        () => {
          if (motionListener.current)
            window.addEventListener("devicemotion", motionListener.current);
        },
        (error: Error) => componentDidCatch(dispatch, error)
      );
    }
  }, [dispatch, motionThreshold]);

  const swMessageEventListener = useCallback(
    (event: MessageEvent) => {
      const { type, error } = event.data as { type: string; error: string };
      if (type === "DO_HARD_REFRESH") {
        if (error) {
          dispatch(logger(error, DebugLevel.ERROR));
        }

        setTimeout(() => {
          setSpin(false);
          setHardRefreshUnavailable(true);
        }, 2000);
      } else if (type === "SW_VERSION") {
        interface VersionInfo {
          swVersion: string;
          jsVersion: string;
          bundleVersion: string;
        }
        const { swVersion, jsVersion, bundleVersion } =
          event.data as VersionInfo;

        setSwVersion(swVersion);
        setJsVersion(jsVersion);
        setBundleVersion(bundleVersion);
      }
    },
    [dispatch]
  );

  const { keys: vKeys, list: vocabuStaleInfo } = useMemo(
    () => getStaleSpaceRepKeys(vRepetition, vocabulary, "[Stale Vocabulary]"),
    [vocabulary, vRepetition]
  );
  const { keys: pKeys, list: phraseStaleInfo } = useMemo(
    () => getStaleSpaceRepKeys(pRepetition, phrases, "[Stale Phrase]"),
    [phrases, pRepetition]
  );
  const { keys: kKeys, list: kanjiStaleInfo } = useMemo(
    () => getStaleSpaceRepKeys(kRepetition, kanji, "[Stale Kanji]"),
    [kanji, kRepetition]
  );

  // TODO: refactor out use lazy
  const failedFurigana = useMemo(
    () => failedFuriganaList([...phrases, ...vocabulary]),
    [vocabulary, phrases]
  );

  const staleSpaceRepKeys = useMemo(
    () => new Set([...vKeys, ...pKeys, ...kKeys]),
    [vKeys, pKeys, kKeys]
  );

  const staleSpaceRepTerms = useMemo(
    () =>
      staleSpaceRep([
        ...vocabuStaleInfo,
        ...phraseStaleInfo,
        ...kanjiStaleInfo,
      ]),
    [vocabuStaleInfo, phraseStaleInfo, kanjiStaleInfo]
  );

  // FIXME: errorMsgs component
  // if (errorMsgs.length > 0) {
  //   const minState = logify(this.state);
  //   const minProps = logify(this.props);

  //   const messages = [
  //     ...errorMsgs,
  //     { msg: "props:", lvl: DebugLevel.WARN, css: "px-2" },
  //     { msg: minProps, lvl: DebugLevel.WARN, css: "px-4" },
  //     { msg: "state:", lvl: DebugLevel.WARN, css: "px-2" },
  //     { msg: minState, lvl: DebugLevel.WARN, css: "px-4" },
  //   ];

  //   return (
  //     <div>
  //       <div className="d-flex flex-column justify-content-around">
  //         <Console messages={messages} />
  //       </div>
  //     </div>
  //   );
  // }

  if (vocabulary.length < 1 || phrases.length < 1 || kanjiTags.length < 1)
    return <NotReady addlStyle="main-panel" />;

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
                <div
                  className={classNames({
                    "w-25 d-flex flex-row justify-content-between": true,
                    invisible: swipeThreshold === 0,
                  })}
                >
                  <div
                    className="clickable px-2 pb-2"
                    onClick={() => {
                      if (swipeThreshold - 1 <= 0) {
                        dispatch(setSwipeThreshold(0));
                      } else {
                        dispatch(setSwipeThreshold(swipeThreshold - 1));
                      }
                    }}
                  >
                    -
                  </div>
                  <div className="px-2">{swipeThreshold}</div>
                  <div
                    className="clickable px-2"
                    onClick={() =>
                      dispatch(setSwipeThreshold(swipeThreshold + 1))
                    }
                  >
                    +
                  </div>
                </div>

                <div
                  className={classNames({
                    "w-25 d-flex flex-row justify-content-between": true,
                    invisible: motionThreshold === 0,
                  })}
                >
                  <div
                    className="clickable px-2 pb-2"
                    onClick={() => {
                      if (motionThreshold - 0.5 <= 0) {
                        dispatch(setMotionThreshold(0));
                      } else {
                        dispatch(setMotionThreshold(motionThreshold - 0.5));
                      }
                    }}
                  >
                    -
                  </div>
                  <div
                    className={classNames({
                      "px-2": true,
                      "correct-color":
                        shakeIntensity && (
                        shakeIntensity > motionThreshold &&
                        shakeIntensity <= motionThreshold + 1),
                      "question-color":
                        shakeIntensity && (
                        shakeIntensity > motionThreshold + 1 &&
                        shakeIntensity <= motionThreshold + 2),
                      "incorrect-color": shakeIntensity && shakeIntensity > motionThreshold + 2,
                    })}
                  >
                    {shakeIntensity ?? motionThreshold}
                  </div>
                  <div
                    className="clickable px-2"
                    onClick={() => {
                      dispatch(setMotionThreshold(motionThreshold + 0.5));
                    }}
                  >
                    +
                  </div>
                </div>
              </div>
              <div className="column-2">
                <div className="setting-block">
                  <SettingsSwitch
                    active={darkMode}
                    action={buildAction(dispatch, toggleDarkMode)}
                    statusText={(darkMode ? "Dark" : "Light") + " Mode"}
                  />
                </div>
                <div className="setting-block">
                  <SettingsSwitch
                    active={swipeThreshold > 0}
                    action={() => {
                      swipeThreshold > 0
                        ? dispatch(setSwipeThreshold(0))
                        : dispatch(setSwipeThreshold(1));
                    }}
                    statusText={"Touch Swipes"}
                  />
                </div>
                <div className="setting-block">
                  <SettingsSwitch
                    active={motionThreshold > 0}
                    action={() => {
                      if (motionThreshold === 0) {
                        dispatch(setMotionThreshold(6));
                      } else {
                        dispatch(setMotionThreshold(0));
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
            {collapseExpandToggler(sectionPhrase, setSectionPhrase)}
          </div>
          {sectionPhrase && (
            <Suspense
              fallback={
                <NotReady addlStyle="phrases-settings" text="Loading..." />
              }
            >
              <SettingsPhrase />
            </Suspense>
          )}
        </div>
        <div className={pageClassName}>
          <div className="d-flex justify-content-between">
            <h2>Vocabulary</h2>
            {collapseExpandToggler(sectionVocabulary, setSectionVocabulary)}
          </div>
          {sectionVocabulary && (
            <Suspense
              fallback={
                <NotReady addlStyle="vocabulary-settings" text="Loading..." />
              }
            >
              <SettingsVocab />
            </Suspense>
          )}
        </div>
        <div className={pageClassName}>
          <div className="d-flex justify-content-between">
            <h2>Kanji</h2>
            {collapseExpandToggler(sectionKanji, setSectionKanji)}
          </div>
          {sectionKanji && (
            <Suspense
              fallback={
                <NotReady addlStyle="kanji-settings" text="Loading..." />
              }
            >
              <SettingsKanji />
            </Suspense>
          )}
        </div>
        <div className={pageClassName}>
          <div className="d-flex justify-content-between">
            <h2>Opposites Game</h2>
          </div>
          <div className="setting-block">
            <div className="mb-2">
              <SettingsSwitch
                active={oppositesQRomaji}
                action={buildAction(dispatch, setOppositesQRomaji)}
                statusText="Question Romaji"
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={oppositesARomaji}
                action={buildAction(dispatch, setOppositesARomaji)}
                statusText="Answer Romaji"
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={oppositeFadeInAnswers}
                action={buildAction(dispatch, toggleOppositeFadeInAnswers)}
                statusText="Fade in answers"
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
                active={charSet === KanaType.HIRAGANA}
                action={buildAction(dispatch, toggleKana)}
                statusText={labelOptions(charSet, [
                  "Hiragana",
                  "Katakana",
                  "Mixed",
                ])}
              />
            </div>
            <div className="d-flex justify-content-end p-2">
              <ChoiceNumberSlider
                initial={choiceN}
                setChoiceN={buildAction(dispatch, setKanaBtnN)}
                wideMode={wideMode}
                wideN={31}
                toggleWide={buildAction(dispatch, toggleKanaGameWideMode)}
              />
            </div>
            <div>
              <SettingsSwitch
                active={easyMode}
                action={buildAction(dispatch, toggleKanaEasyMode)}
                statusText="Kana Hints"
              />
            </div>
          </div>
        </div>
        <div className={pageClassName}>
          <div className="d-flex justify-content-between">
            <h2>Kanji Game</h2>
          </div>

          <div className="d-flex flex-row justify-content-between">
            <div className="column-1" />
            <div className="column-2">
              <div className="mb-2">
                <SimpleListMenu
                  title={"Sort by:"}
                  options={TermSortByLabel}
                  allowed={[
                    TermSortBy.DIFFICULTY,
                    TermSortBy.RANDOM,
                    TermSortBy.VIEW_DATE,
                  ]}
                  initial={kanjiOrder.current}
                  onChange={buildAction(dispatch, toggleKanjiOrdering)}
                />

                {kanjiOrder.current === TermSortBy.DIFFICULTY && (
                  <DifficultySubFilter
                    memoThreshold={memoThreshold}
                    setThreshold={buildAction(
                      dispatch,
                      setKanjiMemorizedThreshold
                    )}
                  />
                )}
              </div>
              <div className="d-flex justify-content-end p-2 text-end">
                <ChoiceNumberSlider
                  initial={kanjiChoiceN}
                  setChoiceN={buildAction(dispatch, setKanjiBtnN)}
                />
              </div>
              <div className="d-flex justify-content-end p-2">
                <SettingsSwitch
                  active={kanjiFadeInAnswers}
                  action={buildAction(dispatch, toggleKanjiFadeInAnswers)}
                  statusText="Fade in answers"
                />
              </div>
            </div>
          </div>
        </div>
        <div className={pageClassName}>
          <div className="d-flex justify-content-between">
            <h2>Particles Game</h2>
          </div>
          <div className="setting-block">
            <SettingsSwitch
              active={particlesARomaji}
              action={buildAction(dispatch, setParticlesARomaji)}
              statusText="Answer Romaji"
            />
            <div className="mb-2">
              <SettingsSwitch
                active={particleFadeInAnswer}
                action={buildAction(dispatch, toggleParticleFadeInAnswers)}
                statusText="Fade in answers"
              />
            </div>
          </div>
        </div>
        <div className={pageClassName}>
          <div className="d-flex justify-content-between">
            <h2>Application</h2>
          </div>
          <div className="d-flex flex-column flex-sm-row justify-content-between">
            <div className="column-1">
              <div className="setting-block mb-2 mt-2">
                <div
                  className="d-flex flex-row w-50 w-sm-100 justify-content-between clickable"
                  onClick={() => {
                    setSwVersion("");
                    setJsVersion("");
                    setBundleVersion("");
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
                    <div>{swVersion}</div>
                    <div>{jsVersion}</div>
                    <div>{bundleVersion}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="column-2">
              <div className="setting-block mb-2">
                <SettingsSwitch
                  active={debug > DebugLevel.OFF}
                  action={buildAction(dispatch, debugToggled)}
                  color="default"
                  statusText={labelOptions(debug, [
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
                  "disabled-color": hardRefreshUnavailable,
                })}
              >
                <p id="hard-refresh" className="text-right">
                  Hard Refresh
                </p>
                <div
                  className={classNames({
                    "spin-a-bit": spin,
                  })}
                  style={{ height: "24px" }}
                  aria-labelledby="hard-refresh"
                  onClick={() => {
                    setSpin(true);
                    setHardRefreshUnavailable(false);

                    setTimeout(() => {
                      if (spin) {
                        setSpin(false);
                        setHardRefreshUnavailable(true);
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
                  active={memory.persistent}
                  action={buildAction(dispatch, setPersistentStorage)}
                  disabled={memory.persistent}
                  color="default"
                  statusText={
                    memory.persistent
                      ? `Persistent ${~~(memory.usage / 1024 / 1024)}
                        /
                        ${~~(memory.quota / 1024 / 1024)}
                        MB`
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
                {collapseExpandToggler(
                  sectionStaleSpaceRep,
                  setSectionStaleSpaceRep
                )}
              </div>
              <div className="px-4">
                <span>
                  {"keys: " + JSON.stringify(Array.from(staleSpaceRepKeys))}
                </span>
              </div>

              {sectionStaleSpaceRep && (
                <Suspense
                  fallback={<NotReady addlStyle="failed-spacerep-view" />}
                >
                  <div className="failed-spacerep-view container mt-2 p-0">
                    {staleSpaceRepTerms}
                  </div>
                </Suspense>
              )}
            </div>
          )}
          {failedFurigana.length > 0 && (
            <div className="mb-2">
              <h5>Failed Furigana Parse</h5>
              <Suspense
                fallback={<NotReady addlStyle="failed-furigana-view" />}
              >
                <div className="failed-furigana-view container mt-2 p-0">
                  {failedFurigana}
                </div>
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { SettingsMeta };
