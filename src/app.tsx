import { ThemeProvider, createTheme } from "@mui/material/styles";
import classNames from "classnames";
// import CssBaseline from '@mui/material/CssBaseline';
import { Suspense, lazy, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HashRouter, Route, Routes } from "react-router-dom";

import Console from "./components/Form/Console";
import { KanjiGameMeta, properCase } from "./components/Games/KanjiGame";
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
import { clearKanji, getKanji } from "./slices/kanjiSlice";
import { clearOpposites } from "./slices/oppositeSlice";
import { clearParticleGame } from "./slices/particleSlice";
import { clearPhrases, getPhrase } from "./slices/phraseSlice";
import { serviceWorkerRegistered } from "./slices/serviceWorkerSlice";
import { DebugLevel } from "./slices/settingHelper";
import { clearVersions, getVersions } from "./slices/versionSlice";
import { clearVocabulary, getVocabulary } from "./slices/vocabularySlice";
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
          if (swStatus === "activated") {
            void dispatch(getVersions());
          }

          // wait for old->new service worker change
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            void navigator.serviceWorker.ready
              .then(() => {
                dispatch(logger(`SW controllerchange`, DebugLevel.DEBUG));

                dispatch(clearVersions());

                // clear versions
                return dispatch(getVersions()).then(() =>
                  Promise.all([
                    dispatch(clearPhrases()),
                    dispatch(clearParticleGame()),
                    dispatch(clearVocabulary()),
                    dispatch(clearOpposites()),
                    dispatch(clearKanji()),
                  ])
                );
              })
              .then(() =>
                // get cached versions
                Promise.all([
                  dispatch(getPhrase()).unwrap(),
                  dispatch(getVocabulary()).unwrap(),
                  dispatch(getKanji()).unwrap(),
                ])
              )
              .then(([phrase, vocabulary, kanji]) => {
                const dataset = { phrase, vocabulary, kanji };

                for (const k in dataset) {
                  const name = k as keyof typeof dataset;
                  const { version } = dataset[name];
                  if (version === "0") {
                    dispatch(
                      logger(
                        `${properCase(k)} v:${version}`,
                        version === "0" ? DebugLevel.ERROR : DebugLevel.DEBUG
                      )
                    );
                  }
                }
              })
              .catch((e) => {
                if (e instanceof Error) {
                  dispatch(logger(e.message, DebugLevel.ERROR));
                }
              });
          });
        })
        .catch((e: Error) => {
          dispatch(logger(e.message, DebugLevel.ERROR));
          // eslint-disable-next-line no-console
          console.log("service worker not running");
          // eslint-disable-next-line no-console
          console.log(e.message);

          // get uncached versions
          void dispatch(getVersions());
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

  return (
    <ThemeProvider theme={muiDarkTheme}>
      <HashRouter basename="/">
        <div id="page-content" className={pClass}>
          <Console connected={true} />
          <TermsNotice />
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
