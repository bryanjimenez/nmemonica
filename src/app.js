import React, { Component, Suspense, lazy } from "react";
import { connect } from "react-redux";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import PropTypes from "prop-types";

import Console from "./components/Form/Console";
import Navigation from "./components/Navigation/Navigation";
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
import { PhrasesMeta } from "./components/Pages/Phrases";
import { VocabularyMeta } from "./components/Pages/Vocabulary";
import { OppositesGameMeta } from "./components/Games/OppositesGame";
import { SettingsMeta } from "./components/Pages/Settings";
import { KanaGameMeta } from "./components/Pages/KanaGame";
import { KanjiMeta } from "./components/Pages/Kanji";
import { KanjiGameMeta } from "./components/Games/KanjiGame";
import { ParticlesGameMeta } from "./components/Games/ParticlesGame";
import { KanjiGridMeta } from "./components/Games/KanjiGrid";
import { localStorageSettingsInitialized } from "./slices/globalSlice";
import "./styles.css";
import { logger } from "./slices/globalSlice";
import { getVersions } from "./slices/versionSlice";
import classNames from "classnames";
import {
  SERVICE_WORKER_LOGGER_MSG,
  serviceWorkerRegistered,
} from "./slices/serviceWorkerSlice";

class App extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    this.state = {};
    this.props.getVersions();
    this.props.localStorageSettingsInitialized();

    this.props.serviceWorkerRegistered().then(() => {
      if ("serviceWorker" in navigator) {
        // set event listener
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === SERVICE_WORKER_LOGGER_MSG) {
            this.props.logger(
              event.data.msg,
              event.data.lvl,
              SERVICE_WORKER_LOGGER_MSG
            );
          }
          // else if (event.data.type === SERVICE_WORKER_NEW_TERMS_ADDED) {
          //   this.props.serviceWorkerNewTermsAdded(event.data.msg);
          // }
        });
      }
    });
  }

  render() {
    const pClass = classNames({
      "d-flex flex-column": true,
      "dark-mode": this.props.darkMode,
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
}

const mapStateToProps = (/** @type {RootState} */ state) => {
  return {
    darkMode: state.global.darkMode,
  };
};

App.propTypes = {
  initialize: PropTypes.func,
  localStorageSettingsInitialized: PropTypes.func,
  getVersions: PropTypes.func,
  serviceWorkerRegistered: PropTypes.func,
  serviceWorkerEventListeners: PropTypes.func,
  darkMode: PropTypes.bool,
  logger: PropTypes.func,
  // serviceWorkerNewTermsAdded: PropTypes.func,
};

export default connect(mapStateToProps, {
  getVersions,
  localStorageSettingsInitialized,
  serviceWorkerRegistered,
  // serviceWorkerNewTermsAdded,   // unused temp disable
  logger,
})(App);
