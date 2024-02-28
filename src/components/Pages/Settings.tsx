import { InfoIcon, PlusCircleIcon, XCircleIcon } from "@primer/octicons-react";
import classNames from "classnames";
import React, {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import { allowedCookies } from "../../helper/cookieHelper";
import { buildAction } from "../../helper/eventHandlerHelper";
import {
  getDeviceMotionEventPermission,
  motionThresholdCondition,
} from "../../helper/gameHelper";
import {
  swMessageGetVersions,
  swMessageSubscribe,
  swMessageUnsubscribe,
} from "../../helper/serviceWorkerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { useSWMessageVersionEventHandler } from "../../hooks/useServiceWorkerHelper";
import type { AppDispatch } from "../../slices";
import {
  debugToggled,
  logger,
  setMotionThreshold,
  setSwipeThreshold,
  toggleDarkMode,
} from "../../slices/globalSlice";
import { togglePhraseActiveGrp } from "../../slices/phraseSlice";
import { DebugLevel } from "../../slices/settingHelper";
import { toggleVocabularyActiveGrp } from "../../slices/vocabularySlice";
import { NotReady } from "../Form/NotReady";
import SettingsCookies from "../Form/SettingsCookies";
import SettingsSwitch from "../Form/SettingsSwitch";
import "../../css/Settings.css";
import "../../css/spin.css";
import { PrivacyPolicyMeta } from "../Terms/PrivacyPolicy";
import { TermsAndConditionsMeta } from "../Terms/TermsAndConditions";
const SettingsKanji = lazy(() => import("../Form/SettingsKanji"));
const SettingsPhrase = lazy(() => import("../Form/SettingsPhrase"));
const SettingsVocab = lazy(() => import("../Form/SettingsVocab"));
const SettingsOppositeGame = lazy(() => import("../Form/SettingsGOpposite"));
const SettingsKanaGame = lazy(() => import("../Form/SettingsGKana"));
const SettingsKanjiGame = lazy(() => import("../Form/SettingsGKanji"));
const SettingsParticleGame = lazy(() => import("../Form/SettingsGParticle"));
const SettingsStats = lazy(() => import("../Form/SettingsStats"));

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

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

export function collapseExpandToggler(
  name: boolean,
  toggleSection: (arg0: (arg1: boolean) => boolean) => void,
  disabled?: boolean
) {
  const icon = name ? (
    <XCircleIcon className="clickable" size="medium" aria-label="collapse" />
  ) : (
    <PlusCircleIcon className="clickable" size="medium" aria-label="expand" />
  );

  return (
    <h2
      onClick={disabled === true ? () => toggleSection((t) => !t) : undefined}
    >
      {icon}
    </h2>
  );
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

  const { cookies, darkMode, swipeThreshold, motionThreshold } =
    useConnectSetting();

  const [sectionTerms, setSectionTerms] = useState(false);

  const [sectionKanji, setSectionKanji] = useState(false);
  const [sectionVocabulary, setSectionVocabulary] = useState(false);
  const [sectionPhrase, setSectionPhrase] = useState(false);
  const [sectionOpposites, setSectionOpposites] = useState(false);
  const [sectionKana, setSectionKana] = useState(false);
  const [sectionKanjiGame, setSectionKanjiGame] = useState(false);
  const [sectionParticle, setSectionParticle] = useState(false);
  const [sectionStats, setSectionStats] = useState(false);

  const [swVersion, setSwVersion] = useState("");
  const [jsVersion, setJsVersion] = useState("");
  const [bundleVersion, setBundleVersion] = useState("");
  // const [errorMsgs, setErrorMsgs] = useState<ConsoleMessage[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState<number | undefined>(0);

  useEffect(
    () => {
      swMessageSubscribe(swMessageEventListenerCB);
      void swMessageGetVersions();

      return () => {
        swMessageUnsubscribe(swMessageEventListenerCB);

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
      // turned on
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
      // turned off
      window.removeEventListener("devicemotion", motionListener.current);
      motionListener.current = undefined;
    } else if (motionThreshold === 0 && motionListener.current === undefined) {
      // Initialization point or
      // DeviceMotionEvent is not supported
      // stop ..
    } else {
      // changed
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

  const swMessageEventListenerCB = useSWMessageVersionEventHandler(
    setSwVersion,
    setJsVersion,
    setBundleVersion
  );

  const hash =
    swVersion !== ""
      ? "." +
        swVersion.slice(-3) +
        jsVersion.slice(-3) +
        bundleVersion.slice(-3)
      : "";

  const version = process.env.APP_VERSION + hash;
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

  const clickableSectionClass = classNames({
    "d-flex justify-content-between": true,
    "disabled-color": !cookies,
  });

  const important = !useMemo(allowedCookies, []);
  const theTerms = (
    <div className={classNames({ "mb-5": !important, "mb-2": important })}>
      <div className="d-flex justify-content-between">
        <h2>
          <InfoIcon size={20} className="pb-2" />
          Guidelines
        </h2>
        {!important &&
          collapseExpandToggler(sectionTerms, setSectionTerms, true)}
      </div>

      {(important || sectionTerms) && (
        <div>
          <h3 className="mt-3 mb-1">Terms and Conditions</h3>
          <div className="text-end">
            <p>
              Read our{" "}
              <Link to={TermsAndConditionsMeta.location}>
                Terms and Conditions
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {(important || sectionTerms) && (
        <div>
          <h3 className="mt-3 mb-1">Privacy Policy</h3>
          <div className="text-end">
            <p>
              Read our{" "}
              <Link to={PrivacyPolicyMeta.location}>Privacy Policy</Link>.
            </p>
          </div>
        </div>
      )}

      {(important || sectionTerms) && <SettingsCookies />}
    </div>
  );

  return (
    <div className="settings">
      <div className="d-flex flex-column justify-content-between px-3">
        {important && theTerms}
        <div className={pageClassName}>
          <div
            className={classNames({
              "pt-5": true,
              "d-flex justify-content-between": true,
              "disabled-color": !cookies,
            })}
          ></div>
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
                        shakeIntensity &&
                        shakeIntensity > motionThreshold &&
                        shakeIntensity <= motionThreshold + 1,
                      "question-color":
                        shakeIntensity &&
                        shakeIntensity > motionThreshold + 1 &&
                        shakeIntensity <= motionThreshold + 2,
                      "incorrect-color":
                        shakeIntensity && shakeIntensity > motionThreshold + 2,
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
                    disabled={!cookies}
                    active={darkMode}
                    action={buildAction(dispatch, toggleDarkMode)}
                    statusText={(darkMode ? "Dark" : "Light") + " Mode"}
                  />
                </div>
                <div className="setting-block">
                  <SettingsSwitch
                    disabled={!cookies}
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
                    disabled={!cookies}
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
          <div className={clickableSectionClass}>
            <h2>Phrases</h2>
            {collapseExpandToggler(sectionPhrase, setSectionPhrase, cookies)}
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
          <div className={clickableSectionClass}>
            <h2>Vocabulary</h2>
            {collapseExpandToggler(
              sectionVocabulary,
              setSectionVocabulary,
              cookies
            )}
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
          <div className={clickableSectionClass}>
            <h2>Kanji</h2>
            {collapseExpandToggler(sectionKanji, setSectionKanji, cookies)}
          </div>
          {cookies && sectionKanji && (
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
          <div className={clickableSectionClass}>
            <h2>Opposites Game</h2>
            {collapseExpandToggler(
              sectionOpposites,
              setSectionOpposites,
              cookies
            )}
          </div>
          {cookies && sectionOpposites && (
            <Suspense
              fallback={
                <NotReady addlStyle="opposites-settings" text="Loading..." />
              }
            >
              <SettingsOppositeGame />
            </Suspense>
          )}
        </div>
        <div className={pageClassName}>
          <div className={clickableSectionClass}>
            <h2>Kana Game</h2>
            {collapseExpandToggler(sectionKana, setSectionKana, cookies)}
          </div>
          {cookies && sectionKana && (
            <Suspense
              fallback={
                <NotReady addlStyle="kana-settings" text="Loading..." />
              }
            >
              <SettingsKanaGame />
            </Suspense>
          )}
        </div>

        <div className={pageClassName}>
          <div className={clickableSectionClass}>
            <h2>Kanji Game</h2>
            {collapseExpandToggler(
              sectionKanjiGame,
              setSectionKanjiGame,
              cookies
            )}
          </div>
          {cookies && sectionKanjiGame && (
            <Suspense
              fallback={
                <NotReady addlStyle="kanji-game-settings" text="Loading..." />
              }
            >
              <SettingsKanjiGame />
            </Suspense>
          )}
        </div>

        <div className={pageClassName}>
          <div className={clickableSectionClass}>
            <h2>Particles Game</h2>
            {collapseExpandToggler(
              sectionParticle,
              setSectionParticle,
              cookies
            )}
          </div>
          {cookies && sectionParticle && (
            <Suspense
              fallback={
                <NotReady addlStyle="particle-settings" text="Loading..." />
              }
            >
              <SettingsParticleGame />
            </Suspense>
          )}
        </div>

        <div className={pageClassName}>
          <div className={clickableSectionClass}>
            <h2>Study Stats</h2>
            {collapseExpandToggler(sectionStats, setSectionStats, cookies)}
          </div>
          {cookies && sectionStats && (
            <Suspense
              fallback={
                <NotReady addlStyle="stats-settings" text="Loading..." />
              }
            >
              <SettingsStats />
            </Suspense>
          )}
        </div>

        {!important && theTerms}

        <div className={pageClassName}>
          <div className={clickableSectionClass}>
            <h2>About Nmemonica</h2>
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
                      void swMessageGetVersions();
                    }, 1000);
                  }}
                >
                  <div className="pe-2">
                    <div>{"Version:"}</div>
                  </div>
                  <div>
                    <div>{version}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SettingsMeta };
