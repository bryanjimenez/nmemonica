import { ThemeProvider, createTheme } from "@mui/material/styles";
import classNames from "classnames";
// import CssBaseline from '@mui/material/CssBaseline';
import { Suspense, lazy, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HashRouter, Route, Routes } from "react-router-dom";

import Console from "./components/Form/Console";
import { KanjiGameMeta } from "./components/Games/KanjiGame";
import { KanjiGridMeta } from "./components/Games/KanjiGrid";
import { OppositesGameMeta } from "./components/Games/OppositesGame";
import { ParticlesGameMeta } from "./components/Games/ParticlesGame";
import Navigation from "./components/Navigation/Navigation";
import { KanaGameMeta } from "./components/Pages/KanaGame";
import { KanjiMeta } from "./components/Pages/Kanji";
import { PhrasesMeta } from "./components/Pages/Phrases";
import { SettingsMeta } from "./components/Pages/Settings";
import { SheetMeta } from "./components/Pages/Sheet";
import { VocabularyMeta } from "./components/Pages/Vocabulary";
import { CookiePolicyMeta } from "./components/Terms/CookiePolicy";
import { PrivacyPolicyMeta } from "./components/Terms/PrivacyPolicy";
import { TermsAndConditionsMeta } from "./components/Terms/TermsAndConditions";
import { TermsNotice } from "./components/Terms/TermsNotice";
import {
  SWMsgIncoming,
  SwMessage,
  swMessageSubscribe,
  swMessageUnsubscribe,
} from "./helper/serviceWorkerHelper";
import type { AppDispatch, RootState } from "./slices";
import { localStorageSettingsInitialized, logger } from "./slices/globalSlice";
import { serviceWorkerRegistered } from "./slices/serviceWorkerSlice";
import { DebugLevel } from "./slices/settingHelper";
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

      if (data.type === SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG) {
        dispatch(
          logger(data.msg, data.lvl, SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG)
        );
      }

      // TODO: SERVICE_WORKER_NEW_TERMS_ADDED removed on hook refactor
      // else if (event.data.type === SERVICE_WORKER_NEW_TERMS_ADDED) {
      //   dispatch(serviceWorkerNewTermsAdded(event.data.msg));
      // }
    };

    if (cookies) {
      void dispatch(localStorageSettingsInitialized());

      swMessageSubscribe(swMessageHandler);

      void dispatch(serviceWorkerRegistered())
        .unwrap()
        .then((swStatus) => {
          dispatch(logger(`SW status: ${swStatus}`, DebugLevel.DEBUG));
        })
        .catch((e: Error) => {
          dispatch(logger(e.message, DebugLevel.ERROR));
          // eslint-disable-next-line no-console
          console.log("service worker not running");
          // eslint-disable-next-line no-console
          console.log(e.message);
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
  });

  /**
   * pages where cookie notification should display
   */
  const cookieNoticePages = [
    PhrasesMeta.location,
    VocabularyMeta.location,
    OppositesGameMeta.location,
    KanaGameMeta.location,
    KanjiMeta.location,
    KanjiGameMeta.location,
    KanjiGridMeta.location,
    ParticlesGameMeta.location,
    SheetMeta.location,
    // SettingsMeta.location,
    // TermsAndConditionsMeta.location,
    // CookiePolicyMeta.location,
    // PrivacyPolicyMeta.location,
  ];

  return (
    <ThemeProvider theme={muiDarkTheme}>
      <HashRouter basename="/">
        <div id="page-content" className={pClass}>
          <Console connected={true} />
          <TermsNotice showInPages={cookieNoticePages} />
          <Navigation />
          <Suspense fallback={<div />}>
            <Routes>
              <Route path="/" element={<Vocabulary />} />
              <Route
                path={TermsAndConditionsMeta.location}
                element={<TermsAndConditions />}
              />
              <Route
                path={CookiePolicyMeta.location}
                element={<CookiePolicy />}
              />
              <Route
                path={PrivacyPolicyMeta.location}
                element={<PrivacyPolicy />}
              />

              <Route path={PhrasesMeta.location} element={<Phrases />} />
              <Route path={VocabularyMeta.location} element={<Vocabulary />} />
              <Route
                path={OppositesGameMeta.location}
                element={<OppositesGame />}
              />
              <Route path={KanaGameMeta.location} element={<KanaGame />} />
              <Route path={KanjiMeta.location} element={<Kanji />} />
              <Route path={KanjiGameMeta.location} element={<KanjiGame />} />
              <Route path={KanjiGridMeta.location} element={<KanjiGrid />} />
              <Route
                path={ParticlesGameMeta.location}
                element={<ParticlesGame />}
              />
              <Route path={SheetMeta.location} element={<Sheet />} />
              <Route path={SettingsMeta.location} element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </HashRouter>
    </ThemeProvider>
  );
}
