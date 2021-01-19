import React, { Component } from "react";
import PropTypes from "prop-types";
import { DashIcon, PlusIcon } from "@primer/octicons-react";

class HiraganaSettings extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleMinus = this.handleMinus.bind(this);
    this.handlePlus = this.handlePlus.bind(this);
    this.update = this.update.bind(this);
  }

  componentDidMount() {}

  update(value) {
    if (value <= this.props.max && value >= this.props.min) {
      this.props.action(value);
    }
  }

  handleChange(event) {
    if (!isNaN(event.target.value)) {
      this.update(Number(event.target.value));
    }
  }

  handleMinus() {
    if (this.props.initial - 1 > 0) {
      this.update(this.props.initial - 1);
    }
  }

  handlePlus() {
    this.update(1 + this.props.initial);
  }

  render() {
    const wideMStyle = {
      backgroundColor: this.props.initial2 && "green",
      color: this.props.initial2 && "#fff",
    };

    return (
      <div className="input-group">
        {" "}
        <div className="input-group-prepend">
          {" "}
          <div
            className="input-group-text"
            onClick={this.props.action2}
            style={wideMStyle}
          >
            {this.props.initial2
              ? this.props.activeText
              : this.props.inactiveText}
          </div>
        </div>
        <input
          type="text"
          className="form-control"
          disabled={!this.props.active}
          placeholder="Choices"
          value={this.props.initial}
          onChange={this.handleChange}
        />
        <div className="input-group-append">
          <button
            type="button"
            className="btn btn-outline-secondary octicon-wrap"
            aria-label="less choices"
            disabled={!this.props.active}
            onClick={this.handleMinus}
          >
            <DashIcon />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary octicon-wrap"
            aria-label="more choices"
            disabled={!this.props.active}
            onClick={this.handlePlus}
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    );
  }
}

HiraganaSettings.propTypes = {
  active: PropTypes.bool,
  activeText: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  action2: PropTypes.func,
  inactiveText: PropTypes.string.isRequired,
  initial: PropTypes.number.isRequired,
  initial2: PropTypes.bool,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default HiraganaSettings;
