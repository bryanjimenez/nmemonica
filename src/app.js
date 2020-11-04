import React, { Component } from "react";
import { connect } from "react-redux";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";

import Navigation from "./components/Navigation/Navigation";
import NotFound from "./components/Navigation/NotFound";
import Verbs from "./components/Pages/Verbs";
import { getVerbs } from "./actions/verbsAct";

import "./styles.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.props.getVerbs();
    this.state = {};
  }

  render() {
    return (
      <Router basename="/">
        <div id="page-content">
          {/* <Specials /> */}
          <Navigation />
          {/* <div className="blackbelt h-80" /> */}
          <Switch>
            <Route path="/" exact component={Verbs} />
            {/* <Route path="/program/" component={Programs} /> */}
            {/* <Route path="/price/" component={Pricing} /> */}
            {/* <Route path="/schedule/" component={Schedule} /> */}
            <Route path="/verbs/" component={Verbs} />
            <Route component={NotFound} />
          </Switch>
        </div>
        {/* <Footer /> */}
      </Router>
    );
  }
}

App.propTypes = {
  getVerbs: PropTypes.func,
};

export default connect(null, { getVerbs })(App);
