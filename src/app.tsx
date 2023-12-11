import classNames from "classnames";
import { Suspense, lazy, useEffect, useRef } from "react";
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
import {
  type AppEndpoints,
  SWMsgIncoming,
  SwMessage,
  swMessageInitCache,
  swMessageRecacheData,
  swMessageSetLocalServiceEndpoint,
  swMessageSubscribe,
  swMessageUnsubscribe,
} from "./helper/serviceWorkerHelper";
import type { AppDispatch, RootState } from "./slices";
import { localStorageSettingsInitialized, logger } from "./slices/globalSlice";
import { clearKanji } from "./slices/kanjiSlice";
import { clearOpposites } from "./slices/oppositeSlice";
import { clearParticleGame } from "./slices/particleSlice";
import { clearPhrases } from "./slices/phraseSlice";
import { serviceWorkerRegistered } from "./slices/serviceWorkerSlice";
import { DebugLevel } from "./slices/settingHelper";
import { clearVersions, getVersions } from "./slices/versionSlice";
import "./css/styles.css";
import { clearVocabulary } from "./slices/vocabularySlice";
import {
  audioServicePath,
  dataServiceEndpoint,
  dataServicePath,
  pronounceEndoint,
  uiEndpoint,
} from "../environment.development";
const NotFound = lazy(() => import("./components/Navigation/NotFound"));
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

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  const localServiceURL = useRef("");
  const { darkMode, localServiceURL: prevSetLocalServURL } = useSelector(
    ({ global }: RootState) => global
  );

  useEffect(() => {
    if (prevSetLocalServURL && localServiceURL.current === "") {
      localServiceURL.current = prevSetLocalServURL;
    }
  }, [dispatch, prevSetLocalServURL]);

  useEffect(() => {
    const swMessageHandler = (event: MessageEvent) => {
      const data = event.data as SwMessage;

      if (data.type === SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG) {
        dispatch(
          logger(data.msg, data.lvl, SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG)
        );
      }

      if (data.type === SWMsgIncoming.POST_INSTALL_ACTIVATE_DONE) {
        void swMessageInitCache({
          ui: uiEndpoint,
          data: dataServiceEndpoint,
          media: pronounceEndoint,
        });

        // Post install w/ localServiceUrl already set
        if (localServiceURL.current !== "") {
          const url = localServiceURL.current;

          const appEndpoints: AppEndpoints = {
            data: url + dataServicePath,
            media: url + audioServicePath,
          };

          void swMessageSetLocalServiceEndpoint(appEndpoints)
            .then(() => {
              dispatch(clearVersions());
              void dispatch(getVersions());
            })
            .then(() => {
              void swMessageRecacheData();
              dispatch(
                logger("Service endpoint override: " + url, DebugLevel.WARN)
              );
            });

          // clear saved states of data
          dispatch(clearVocabulary());
          dispatch(clearPhrases());
          dispatch(clearKanji());
          dispatch(clearParticleGame());
          dispatch(clearOpposites());
        }
      }
      // TODO: SERVICE_WORKER_NEW_TERMS_ADDED removed on hook refactor
      // else if (event.data.type === SERVICE_WORKER_NEW_TERMS_ADDED) {
      //   dispatch(serviceWorkerNewTermsAdded(event.data.msg));
      // }
    };

    void dispatch(getVersions());
    void dispatch(localStorageSettingsInitialized());

    swMessageSubscribe(swMessageHandler);

    void dispatch(serviceWorkerRegistered()).catch((e: Error) => {
      dispatch(logger(e.message, DebugLevel.ERROR));
      // eslint-disable-next-line no-console
      console.log("service worker not running");
      // eslint-disable-next-line no-console
      console.log(e.message);
    });

    return () => {
      swMessageUnsubscribe(swMessageHandler);
    };
  }, [dispatch]);

  const pClass = classNames({
    "d-flex flex-column": true,
    "dark-mode": darkMode,
  });

  return (
    <HashRouter basename="/">
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
            <Route path={SheetMeta.location} element={<Sheet />} />
            <Route path={SettingsMeta.location} element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}
