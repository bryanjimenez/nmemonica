// @ts-nocheck
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Redirect } from "react-router-dom";

import { logout } from "../../actions/firebase";

const LogoutMeta = {
  location: "/logout/",
  label: "Logout",
};

class Logout extends Component {
  constructor(props) {
    super(props);

    this.props.logout();
  }

  render() {
    return <Redirect to="/" />;
  }
}

Logout.propTypes = {
  logout: PropTypes.func,
};

export default connect(null, { logout })(Logout);

export { LogoutMeta };
