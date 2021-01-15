import React, { Component } from "react";
import PropTypes from "prop-types";

class Toggle extends Component {
  constructor(props) {
    super(props);

    this.handleToggle = this.handleToggle.bind(this);
  }

  componentDidMount() {}

  handleToggle() {
    this.props.action();
  }

  render() {
    return (
      <div
        className="toggle-wrap btn-group"
        role="group"
        onClick={this.handleToggle}
      >
        {!this.props.active && (
          <button type="button" className="btn btn-danger">
            {this.props.inactiveText}
          </button>
        )}
        <button type="button" className="btn btn-light">
          {this.props.statusText}
        </button>
        {this.props.active && (
          <button type="button" className="btn btn-secondary">
            {this.props.activeText}
          </button>
        )}
      </div>
    );
  }
}

Toggle.propTypes = {
  active: PropTypes.bool,
  activeText: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  inactiveText: PropTypes.string.isRequired,
  statusText: PropTypes.string.isRequired,
};

export default Toggle;
