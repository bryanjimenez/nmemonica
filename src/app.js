import classNames from "classnames";
import React, { Suspense, lazy, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
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
import { VocabularyMeta } from "./components/Pages/Vocabulary";
import { localStorageSettingsInitialized, logger } from "./slices/globalSlice";
import { serviceWorkerRegistered } from "./slices/serviceWorkerSlice";
import { getVersions } from "./slices/versionSlice";
import "./styles.css";
import { SERVICE_WORKER_LOGGER_MSG } from "./constants/actionNames";
const NotFound = lazy(() => import("./components/Navigation/NotFound"));
const Phrases = lazy(() => import("./components/Pages/Phrases"));
const Vocabulary = lazy(() => import("./components/Pages/Vocabulary"));
const OppositesGame = lazy(() => import("./components/Games/OppositesGame"));
const KanaGame = lazy(() => import("./components/Pages/KanaGame"));
const Kanji = lazy(() => import("./components/Pages/Kanji"));
const KanjiGame = lazy(() => import("./components/Games/KanjiGame"));
const KanjiGrid = lazy(() => import("./components/Games/KanjiGrid"));
const ParticlesGame = lazy(() => import("./components/Games/ParticlesGame"));
const Settings = lazy(() => import("./components/Pages/Settings"));

export default function App() {
  const dispatch = /** @type {AppDispatch} */ (useDispatch());

  useEffect(() => {
    dispatch(getVersions());
    dispatch(localStorageSettingsInitialized());
    dispatch(serviceWorkerRegistered()).then(() => {
      if ("serviceWorker" in navigator) {
        // set event listener
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === SERVICE_WORKER_LOGGER_MSG) {
            dispatch(
              logger(event.data.msg, event.data.lvl, SERVICE_WORKER_LOGGER_MSG)
            );
          }
          // TODO: SERVICE_WORKER_NEW_TERMS_ADDED removed on hook refactor
          // else if (event.data.type === SERVICE_WORKER_NEW_TERMS_ADDED) {
          //   dispatch(serviceWorkerNewTermsAdded(event.data.msg));
          // }
        });
      }
    });
  }, []);

  const global = useSelector((/** @type {RootState}*/ { global }) => global);
  const { darkMode } = global;

  const pClass = classNames({
    "d-flex flex-column": true,
    "dark-mode": darkMode,
  });

  return (
    <Router basename="/">
      <div id="page-content" className={pClass}>
        <Console connected={true} />
        <Navigation />
        <Suspense fallback={<div />}>
          <Routes>
            <Route path="/" element={<Vocabulary />} />
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
            <Route path={SettingsMeta.location} element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}
