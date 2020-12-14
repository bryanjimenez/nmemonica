import React, { Component } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

import { logout } from "../../actions/firebase";

const LogoutMeta = {
  location: "/logout/",
  label: "Logout",
};

class Logout extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.props.logout();
  }

  componentWillMount() {}

  componentDidMount() {}

  componentDidUpdate(prevProps, prevState) {}

  render() {
    return <Redirect to="/" />;
  }
}

const mapStateToProps = (state) => {
  return {};
};

export default connect(mapStateToProps, { logout })(Logout);

export { LogoutMeta };
