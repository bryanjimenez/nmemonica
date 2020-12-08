import React, { Component } from "react";
import { connect } from "react-redux";
import classNames from "classnames";
import { setHiraganaBtnN, setVerbsOrdering } from "../../actions/settingsAct";
import NumberField from "../Form/NumberField";
import Toggle from "../Form/Toggle";

const SettingsMeta = {
  location: "/settings/",
  label: "Settings",
};

class Settings extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  componentDidUpdate(prevProps, prevState) {}

  render() {
    const pageClassName = classNames({ "mb-5": true });
    return (
      <div className="settings" style={{ height: "75%" }}>
        <div
          className="d-flex flex-column justify-content-between pl-3 pr-3"
          style={{ height: "100%" }}
        >
          <div className={pageClassName}>
            <h2>Verbs</h2>
            <Toggle
              active={this.props.verbOrder}
              action={this.props.setVerbsOrdering}
              statusText="List"
              activeText="Ordered"
              inactiveText="Random"
            />
          </div>
          <div className={pageClassName}>
            <h2>Phrases</h2>
          </div>
          <div className={pageClassName}>
            <h2>Opposites</h2>
          </div>
          <div className={pageClassName}>
            <h2>HiraganaGame</h2>
            <NumberField
              active={true}
              action={this.props.setHiraganaBtnN}
              initial={this.props.choiceN}
              min={4}
              max={16}
            />
          </div>
          <div className={pageClassName}>
            <h2>ParticlesGame</h2>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    choiceN: state.settings.hiragana.choiceN,
    verbOrder: state.settings.verbs.ordered,
  };
};

export default connect(mapStateToProps, { setHiraganaBtnN, setVerbsOrdering })(
  Settings
);

export { SettingsMeta };
