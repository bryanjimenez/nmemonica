import classNames from "classnames";
import { Suspense, lazy, useEffect } from "react";
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
  SWMsgIncoming,
  swMessageInitCache,
  swMessageSubscribe,
  swMessageUnsubscribe,
} from "./helper/serviceWorkerHelper";
import type { AppDispatch, RootState } from "./slices";
import { localStorageSettingsInitialized, logger } from "./slices/globalSlice";
import { serviceWorkerRegistered } from "./slices/serviceWorkerSlice";
import { DebugLevel } from "./slices/settingHelper";
import { getVersions } from "./slices/versionSlice";
import "./css/styles.css";
import {
  dataServiceEndpoint,
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

  useEffect(() => {
    const swMessageHandler = (event: MessageEvent) => {
      interface SwMessage {
        msg: string;
        lvl: number;
        type: string;
      }
      const data = event.data as SwMessage;

      if (data.type === SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG) {
        dispatch(
          logger(data.msg, data.lvl, SWMsgIncoming.SERVICE_WORKER_LOGGER_MSG)
        );
      }

      if (data.type === SWMsgIncoming.POST_INSTALL_ACTIVATE_DONE) {
        swMessageInitCache({
          ui: uiEndpoint,
          data: dataServiceEndpoint,
          media: pronounceEndoint,
        });
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

  const darkMode = useSelector(({ global }: RootState) => global.darkMode);

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
