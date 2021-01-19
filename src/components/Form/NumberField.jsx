import React, { Component } from "react";
import PropTypes from "prop-types";
import { DashIcon, PlusIcon } from "@primer/octicons-react";

class NumberField extends Component {
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
    return (
      <div className="input-group">
        {" "}
        <div className="input-group-prepend">
          {" "}
          <div className="input-group-text">Choices</div>
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
            aria-label="less"
            disabled={!this.props.active}
            onClick={this.handleMinus}
          >
            <DashIcon />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary octicon-wrap"
            aria-label="more"
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

NumberField.propTypes = {
  active: PropTypes.bool,
  action: PropTypes.func.isRequired,
  initial: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
};

export default NumberField;
