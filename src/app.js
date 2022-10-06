import React, { Component, Suspense, lazy } from "react";
import { connect } from "react-redux";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import Console from "./components/Form/Console";
import Navigation from "./components/Navigation/Navigation";
const NotFound = lazy(() => import("./components/Navigation/NotFound"));
const Phrases = lazy(() => import("./components/Pages/Phrases"));
const Vocabulary = lazy(() => import("./components/Pages/Vocabulary"));
const Opposites = lazy(() => import("./components/Pages/Opposites"));
const KanaGame = lazy(() => import("./components/Pages/KanaGame"));
const Kanji = lazy(() => import("./components/Pages/Kanji"));
const ParticlesGame = lazy(() => import("./components/Pages/ParticlesGame"));
const Settings = lazy(() => import("./components/Pages/Settings"));
// const Logout = lazy(() => import("./components/Pages/Logout"));
// const OAuthLogin = lazy(() => import("./components/Pages/OAuthLogin"));
import { PhrasesMeta } from "./components/Pages/Phrases";
import { VocabularyMeta } from "./components/Pages/Vocabulary";
import { OppositesMeta } from "./components/Pages/Opposites";
import { SettingsMeta } from "./components/Pages/Settings";
// import { LogoutMeta } from "./components/Pages/Logout";
// import { OAuthLoginMeta } from "./components/Pages/OAuthLogin";
import { KanaGameMeta } from "./components/Pages/KanaGame";
import { KanjiMeta } from "./components/Pages/Kanji";
import { ParticlesGameMeta } from "./components/Pages/ParticlesGame";
import {
  initializeSettingsFromLocalStorage,
  initialize,
} from "./actions/firebase";
import "./styles.css";
import { logger } from "./actions/consoleAct";
import { getVersions } from "./actions/firebase";
import {
  registerServiceWorker,
  serviceWorkerNewTermsAdded,
  SERVICE_WORKER_LOGGER_MSG,
  SERVICE_WORKER_NEW_TERMS_ADDED,
} from "./actions/serviceWorkerAct";
import classNames from "classnames";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.props.initialize();
    this.props.getVersions();
    this.props.initializeSettingsFromLocalStorage();

    this.props.registerServiceWorker().then(() => {
      if ("serviceWorker" in navigator) {
        // set event listener
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === SERVICE_WORKER_LOGGER_MSG) {
            this.props.logger(
              event.data.msg,
              event.data.lvl,
              SERVICE_WORKER_LOGGER_MSG
            );
          } else if (event.data.type === SERVICE_WORKER_NEW_TERMS_ADDED) {
            this.props.serviceWorkerNewTermsAdded(event.data.msg);
          }
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
          <Console />
          <Navigation />
          <Suspense fallback={<div />}>
            <Switch>
              <Route path="/" exact component={Vocabulary} />
              <Route path={PhrasesMeta.location} component={Phrases} />
              <Route path={VocabularyMeta.location} component={Vocabulary} />
              <Route path={OppositesMeta.location} component={Opposites} />
              <Route path={KanaGameMeta.location} component={KanaGame} />
              <Route path={KanjiMeta.location} component={Kanji} />
              <Route
                path={ParticlesGameMeta.location}
                component={ParticlesGame}
              />
              <Route path={SettingsMeta.location} component={Settings} />
              {/* <Route path={OAuthLoginMeta.location} component={OAuthLogin} /> */}
              {/* <Route path={LogoutMeta.location} component={Logout} /> */}
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </div>
      </Router>
    );
  }
}
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    darkMode: state.settings.global.darkMode,
  };
};

App.propTypes = {
  initialize: PropTypes.func,
  initializeSettingsFromLocalStorage: PropTypes.func,
  getVersions: PropTypes.func,
  registerServiceWorker: PropTypes.func,
  serviceWorkerEventListeners: PropTypes.func,
  darkMode: PropTypes.bool,
  logger: PropTypes.func,
  serviceWorkerNewTermsAdded: PropTypes.func,
};

export default connect(mapStateToProps, {
  initialize,
  getVersions,
  initializeSettingsFromLocalStorage,
  registerServiceWorker,
  serviceWorkerNewTermsAdded,
  logger,
})(App);
