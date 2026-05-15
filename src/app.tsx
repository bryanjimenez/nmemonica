import { ThemeProvider, createTheme } from "@mui/material/styles";
import classNames from "classnames";
// import CssBaseline from '@mui/material/CssBaseline';
import { Suspense, lazy, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";

import Console from "./components/Form/Console";
import { KanjiGameNav } from "./components/Games/KanjiGame";
import { KanjiGridNav } from "./components/Games/KanjiGrid";
import { OppositesGameNav } from "./components/Games/OppositesGame";
import { ParticlesGameNav } from "./components/Games/ParticlesGame";
import Navigation from "./components/Navigation/Navigation";
import { KanaGameNav } from "./components/Pages/KanaGame";
import { KanjiNav } from "./components/Pages/Kanji";
import { PhraseNav } from "./components/Pages/Phrases";
import { SettingsNav } from "./components/Pages/Settings";
import { SheetNav } from "./components/Pages/Sheet";
import { VocabularyNav } from "./components/Pages/Vocabulary";
import { CookiePolicyNav } from "./components/Terms/CookiePolicy";
import { PrivacyPolicyNav } from "./components/Terms/PrivacyPolicy";
import { TermsAndConditionsNav } from "./components/Terms/TermsAndConditions";
import { TermsNotice } from "./components/Terms/TermsNotice";
import { DebugLevel } from "./helper/consoleHelper";
import {
  SwMessage,
  swMessageSubscribe,
  swMessageUnsubscribe,
} from "./helper/serviceWorkerHelper";
import type { AppDispatch, RootState } from "./slices";
import { initAudioContext } from "./slices/audioHelper";
import {
  appSettingsInitialized,
  appSettingsInitializedLocalStorage,
  logger,
} from "./slices/globalSlice";
import { serviceWorkerRegistered } from "./slices/serviceWorkerSlice";
import { dropAudioWorker, initAudioWorker } from "./slices/voiceSlice";
const NotFound = lazy(() => import("./components/Navigation/NotFound"));
const TermsAndConditions = lazy(
  () => import("./components/Terms/TermsAndConditions")
);
const CookiePolicy = lazy(() => import("./components/Terms/CookiePolicy"));
const PrivacyPolicy = lazy(() => import("./components/Terms/PrivacyPolicy"));
const Phrases = lazy(() => import("./components/Pages/Phrases"));
const Vocabulary = lazy(() => import("./components/Pages/Vocabulary"));
const OppositesGame = lazy(() => import("./components/Games/OppositesGame"));
const KanaGame = lazy(() => import("./components/Pages/KanaGame"));
const Kanji = lazy(() => import("./components/Pages/Kanji"));
const KanjiGame = lazy(() => import("./components/Games/KanjiGame"));
const KanjiGrid = lazy(() => import("./components/Games/KanjiGrid"));
const ParticlesGame = lazy(() => import("./components/Games/ParticlesGame"));
const Sheet = lazy(() => import("./components/Pages/Sheet"));
const Settings = lazy(() => import("./components/Pages/Settings"));
import "./css/styles.css";

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  const { darkMode, cookies } = useSelector(({ global }: RootState) => global);

  const muiDarkTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: darkMode ? "dark" : "light",
      },
    });
  }, [darkMode]);

  useEffect(() => {
    const swMessageHandler = (event: MessageEvent) => {
      const data = event.data as SwMessage;

      if (data.type === "SW") {
        dispatch(logger(data.msg, data.lvl, "SW"));
      }
    };

    if (cookies) {
      initAudioContext();

      // localStorage is fast.. avoids initial background flash
      void dispatch(appSettingsInitializedLocalStorage()).then(() => {
        void dispatch(appSettingsInitialized()).then(
          () =>
            void dispatch(serviceWorkerRegistered())
              .unwrap()
              .then((swStatus) => {
                swMessageSubscribe(swMessageHandler);

                dispatch(logger(`SW status: ${swStatus}`, DebugLevel.DEBUG));
              })
              .catch((e: Error) => {
                dispatch(logger(e.message, DebugLevel.ERROR));
                // eslint-disable-next-line no-console
                console.log("service worker not running");
                // eslint-disable-next-line no-console
                console.log(e.message);
              })
        );
      });
    } else {
      // eslint-disable-next-line no-console
      console.log("cookies are disabled");
    }
    return () => {
      if (cookies) {
        swMessageUnsubscribe(swMessageHandler);
      }
    };
  }, [dispatch, cookies]);

  const pClass = classNames({
    "d-flex flex-column": true,
    "dark-mode": darkMode,
    "no-select": true,
  });

  /**
   * pages where cookie notification should display
   */
  const cookieNoticePages = [
    PhraseNav.location,
    VocabularyNav.location,
    OppositesGameNav.location,
    KanaGameNav.location,
    KanjiNav.location,
    KanjiGameNav.location,
    KanjiGridNav.location,
    ParticlesGameNav.location,
    SheetNav.location,
    // SettingsNav.location,
    // TermsAndConditionsNav.location,
    // CookiePolicyNav.location,
    // PrivacyPolicyNav.location,
  ];

  return (
    <ThemeProvider theme={muiDarkTheme}>
      <HashRouter basename="/">
        <ByLocationWorkerLifetime />
        <div id="page-content" className={pClass}>
          <Console connected={true} />
          <TermsNotice showInPages={cookieNoticePages} />
          <Navigation />
          <Suspense fallback={<div />}>
            <Routes>
              <Route path="/" element={<Vocabulary />} />
              <Route
                path={TermsAndConditionsNav.location}
                element={<TermsAndConditions />}
              />
              <Route
                path={CookiePolicyNav.location}
                element={<CookiePolicy />}
              />
              <Route
                path={PrivacyPolicyNav.location}
                element={<PrivacyPolicy />}
              />

              <Route path={PhraseNav.location} element={<Phrases />} />
              <Route path={VocabularyNav.location} element={<Vocabulary />} />
              <Route
                path={OppositesGameNav.location}
                element={<OppositesGame />}
              />
              <Route path={KanaGameNav.location} element={<KanaGame />} />
              <Route path={KanjiNav.location} element={<Kanji />} />
              <Route path={KanjiGameNav.location} element={<KanjiGame />} />
              <Route path={KanjiGridNav.location} element={<KanjiGrid />} />
              <Route
                path={ParticlesGameNav.location}
                element={<ParticlesGame />}
              />
              <Route path={SheetNav.location} element={<Sheet />} />
              <Route path={SettingsNav.location} element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </HashRouter>
    </ThemeProvider>
  );
}

function ByLocationWorkerLifetime() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  useEffect(() => {
    switch (location.pathname) {
      // where @nmemonica/voice-ja should be initialized
      case VocabularyNav.location:
      case PhraseNav.location:
        void dispatch(initAudioWorker());
        break;

      default:
        void dispatch(dropAudioWorker());
        break;
    }
  }, [dispatch, location]);

  return null;
}
