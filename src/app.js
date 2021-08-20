import React, { Component, Suspense, lazy } from "react";
import { connect } from "react-redux";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import Navigation from "./components/Navigation/Navigation";
const NotFound = lazy(() => import("./components/Navigation/NotFound"));
const Phrases = lazy(() => import("./components/Pages/Phrases"));
const Vocabulary = lazy(() => import("./components/Pages/Vocabulary"));
const Opposites = lazy(() => import("./components/Pages/Opposites"));
const KatakanaGame = lazy(() => import("./components/Pages/KatakanaGame"));
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
import { KatakanaGameMeta } from "./components/Pages/KatakanaGame";
import { ParticlesGameMeta } from "./components/Pages/ParticlesGame";
import {
  initializeSettingsFromLocalStorage,
  initialize,
} from "./actions/firebase";
import "./styles.css";
import { getVersions } from "./actions/firebase";
import { registerServiceWorker } from "./actions/serviceWorkerAct";
import classNames from "classnames";
import {
  getLocalStorageSettings,
  setLocalStorage,
} from "./helper/localStorage";
import { localStorageKey } from "./constants/paths";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.props.initialize();
    this.props
      .getVersions()
      .then(() => {
        console.log("got versions");

        return fetch("newest")
          .then((res) => res.json())
          .then((newestWords) => {
            console.log("newest words");
            if (newestWords) {
              console.log(newestWords);

              return getLocalStorageSettings(localStorageKey).then((ls) => {
                console.log(ls);
                for (let w in newestWords) {
                  ls[w].frequency = [...ls[w].frequency, ...newestWords[w]];
                }

                return setLocalStorage(localStorageKey, ls);
              });
            }
            return Promise.resolve();
          });
      })
      .catch(() => {
        console.log("newest failed");
      })

      .finally(() => {
        console.log("done w/ newest");
        this.props.initializeSettingsFromLocalStorage();
      });

    this.props.registerServiceWorker();
  }

  render() {
    const pClass = classNames({
      "d-flex flex-column": true,
      "dark-mode": this.props.darkMode,
    });

    return (
      <Router basename="/">
        <div id="page-content" className={pClass}>
          <Navigation />
          <Suspense fallback={<div />}>
            <Switch>
              <Route path="/" exact component={Vocabulary} />
              <Route path={PhrasesMeta.location} component={Phrases} />
              <Route path={VocabularyMeta.location} component={Vocabulary} />
              <Route path={OppositesMeta.location} component={Opposites} />
              <Route
                path={KatakanaGameMeta.location}
                component={KatakanaGame}
              />
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
  darkMode: PropTypes.bool,
};

export default connect(mapStateToProps, {
  initialize,
  getVersions,
  initializeSettingsFromLocalStorage,
  registerServiceWorker,
})(App);
