import React, { Component } from "react";
import { connect } from "react-redux";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import Navigation from "./components/Navigation/Navigation";
import NotFound from "./components/Navigation/NotFound";
import Verbs, { VerbsMeta } from "./components/Pages/Verbs";
import Phrases, { PhrasesMeta } from "./components/Pages/Phrases";
import Opposites, { OppositesMeta } from "./components/Pages/Opposites";
import HiraganaGame, {
  HiraganaGameMeta,
} from "./components/Pages/HiraganaGame";
import ParticlesGame, {
  ParticlesGameMeta,
} from "./components/Pages/ParticlesGame";
import Settings, { SettingsMeta } from "./components/Pages/Settings";
import Logout, { LogoutMeta } from "./components/Pages/Logout";
import OAuthLogin, { OAuthLoginMeta } from "./components/Pages/OAuthLogin";
import { initialize } from "./actions/firebase";
import "./styles.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.props.initialize();
    this.state = {};
  }

  render() {
    return (
      <Router basename="/">
        <div id="page-content">
          <Navigation />
          <Switch>
            <Route path="/" exact component={Verbs} />
            <Route path={VerbsMeta.location} component={Verbs} />
            <Route path={PhrasesMeta.location} component={Phrases} />
            <Route path={OppositesMeta.location} component={Opposites} />
            <Route path={HiraganaGameMeta.location} component={HiraganaGame} />
            <Route
              path={ParticlesGameMeta.location}
              component={ParticlesGame}
            />
            <Route path={SettingsMeta.location} component={Settings} />
            <Route path={OAuthLoginMeta.location} component={OAuthLogin} />
            <Route path={LogoutMeta.location} component={Logout} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </Router>
    );
  }
}

App.propTypes = {
  initialize: PropTypes.func,
};

export default connect(null, { initialize })(App);
