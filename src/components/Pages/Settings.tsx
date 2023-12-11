import { Button, TextField } from "@mui/material";
import {
  PlusCircleIcon,
  SyncIcon,
  UndoIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  audioServicePath,
  dataServiceEndpoint,
  dataServicePath,
  pronounceEndoint,
} from "../../../environment.development";
import { buildAction } from "../../helper/eventHandlerHelper";
import {
  getDeviceMotionEventPermission,
  labelOptions,
  motionThresholdCondition,
} from "../../helper/gameHelper";
import {
  type AppEndpoints,
  swMessageDoHardRefresh,
  swMessageGetVersions,
  swMessageSetLocalServiceEndpoint,
  swMessageSubscribe,
  swMessageUnsubscribe,
} from "../../helper/serviceWorkerHelper";
import { useSWMessageVersionEventHandler } from "../../helper/useServiceWorkerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { useSubscribe } from "../../hooks/useSubscribe";
import type { AppDispatch, RootState } from "../../slices";
import {
  debugToggled,
  getMemoryStorageStatus,
  logger,
  setLocalServiceURL,
  setMotionThreshold,
  setPersistentStorage,
  setSwipeThreshold,
  toggleDarkMode,
} from "../../slices/globalSlice";
import { clearKanji } from "../../slices/kanjiSlice";
import { clearOpposites } from "../../slices/oppositeSlice";
import { clearParticleGame } from "../../slices/particleSlice";
import { clearPhrases, togglePhraseActiveGrp } from "../../slices/phraseSlice";
import { DebugLevel } from "../../slices/settingHelper";
import { clearVersions, getVersions } from "../../slices/versionSlice";
import {
  clearVocabulary,
  toggleVocabularyActiveGrp,
} from "../../slices/vocabularySlice";
import { NotReady } from "../Form/NotReady";
import SettingsSwitch from "../Form/SettingsSwitch";
import "../../css/Settings.css";
import "../../css/spin.css";
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

  const { darkMode, swipeThreshold, motionThreshold, memory, debug } =
    useConnectSetting();

  const localServiceURL = useSelector(
    ({ global }: RootState) => global.localServiceURL
  );

  const [spin, setSpin] = useState(false);

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
  const [hardRefreshUnavailable, setHardRefreshUnavailable] = useState(false);
  // const [errorMsgs, setErrorMsgs] = useState<ConsoleMessage[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState<number | undefined>(0);

  const [userInputError, setUserInputError] = useState(false);
  const serviceAddress = useRef(localServiceURL);
  const { registerCB } = useSubscribe(dispatch, serviceAddress);

  useEffect(
    () => {
      void dispatch(getMemoryStorageStatus());

      swMessageSubscribe(swMessageEventListenerCB);
      swMessageGetVersions();

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
    dispatch,
    setSpin,
    setHardRefreshUnavailable,
    setSwVersion,
    setJsVersion,
    setBundleVersion
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
            {collapseExpandToggler(sectionOpposites, setSectionOpposites)}
          </div>
          {sectionOpposites && (
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
          <div className="d-flex justify-content-between">
            <h2>Kana Game</h2>
            {collapseExpandToggler(sectionKana, setSectionKana)}
          </div>
          {sectionKana && (
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
          <div className="d-flex justify-content-between">
            <h2>Kanji Game</h2>
            {collapseExpandToggler(sectionKanjiGame, setSectionKanjiGame)}
          </div>
          {sectionKanjiGame && (
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
          <div className="d-flex justify-content-between">
            <h2>Particles Game</h2>
            {collapseExpandToggler(sectionParticle, setSectionParticle)}
          </div>
          {sectionParticle && (
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
          <div className="d-flex justify-content-between">
            <h2>Study Stats</h2>
            {collapseExpandToggler(sectionStats, setSectionStats)}
          </div>
          {sectionStats && (
            <Suspense
              fallback={
                <NotReady addlStyle="stats-settings" text="Loading..." />
              }
            >
              <SettingsStats />
            </Suspense>
          )}
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
                      swMessageGetVersions();
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

                    swMessageDoHardRefresh();
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
              <div className="setting-block mb-2">
                <div className="d-flex flex-row p-2">
                  <TextField
                    error={userInputError}
                    size="small"
                    label="Service Endpoint Override"
                    variant="outlined"
                    defaultValue={localServiceURL}
                    onChange={(event) => {
                      serviceAddress.current = event.target.value;
                    }}
                    onBlur={(event) => {
                      // TODO: validate user input service (token?)
                      const serviceUrl = event.target.value;
                      let validInput = true;

                      if (
                        !serviceUrl.toLowerCase().startsWith("https://") ||
                        !new RegExp(/:\d{1,5}$/).test(serviceUrl) ||
                        serviceUrl.length > 35 ||
                        serviceUrl.length < 13
                      ) {
                        validInput = false;
                      }

                      const appEndpoints: AppEndpoints = {
                        data: serviceUrl + dataServicePath,
                        media: serviceUrl + audioServicePath,
                      };

                      if (serviceUrl === "") {
                        validInput = true;
                        appEndpoints.data = dataServiceEndpoint;
                        appEndpoints.media = pronounceEndoint;
                      }

                      if (validInput) {
                        void swMessageSetLocalServiceEndpoint(
                          appEndpoints
                        ).then(() => {
                          dispatch(clearVersions());
                          void dispatch(getVersions());
                        });

                        // clear saved states of data
                        dispatch(clearVocabulary());
                        dispatch(clearPhrases());
                        dispatch(clearKanji());
                        dispatch(clearParticleGame());
                        dispatch(clearOpposites());

                        dispatch(setLocalServiceURL(serviceUrl));
                      }

                      setUserInputError(!validInput);
                    }}
                  />
                </div>

                <div className="d-flex flex-row p-2">
                  <div className="px-1">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={userInputError}
                    >
                      Update
                    </Button>
                  </div>
                  <div className="px-1">
                    <Button
                      variant="outlined"
                      onClick={registerCB}
                      size="small"
                      disabled={userInputError}
                    >
                      Subscribe
                    </Button>
                  </div>

                  <div className="px-1">
                    <Button
                      variant="contained"
                      size="small"
                      disabled={userInputError}
                    >
                      <Link to={"/sheet"} className="text-decoration-none">
                        Sheets <UndoIcon />
                      </Link>
                    </Button>
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
