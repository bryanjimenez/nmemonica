import React, { Component } from "react";
import { connect } from "react-redux";
import classNames from "classnames";
import {
  flipPhrasesPracticeSide,
  setHiraganaBtnN,
  setVerbsOrdering,
  setPhrasesOrdering,
} from "../../actions/settingsAct";
import NumberField from "../Form/NumberField";
import Toggle from "../Form/Toggle";

import "./Settings.css";

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
            <div className="setting-block">
              <Toggle
                active={this.props.verbOrder}
                action={this.props.setVerbsOrdering}
                statusText="List"
                activeText="Ordered"
                inactiveText="Random"
              />
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Phrases</h2>
            <div className="setting-block">
              <div className="mb-2">
                <Toggle
                  active={this.props.phraseOrder}
                  action={this.props.setPhrasesOrdering}
                  statusText="List"
                  activeText="Ordered"
                  inactiveText="Random"
                />
              </div>
              <div>
                <Toggle
                  active={this.props.phraseSide}
                  action={this.props.flipPhrasesPracticeSide}
                  statusText="Side"
                  activeText="English"
                  inactiveText="Japanese"
                />
              </div>
            </div>
          </div>
          <div className={pageClassName}>
            <h2>Opposites</h2>
          </div>
          <div className={pageClassName}>
            <h2>HiraganaGame</h2>
            <div className="setting-block">
              <NumberField
                active={true}
                action={this.props.setHiraganaBtnN}
                initial={this.props.choiceN}
                min={4}
                max={16}
              />
            </div>
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
    phraseOrder: state.settings.phrases.ordered,
    phraseSide: state.settings.phrases.practiceSide,
  };
};

export default connect(mapStateToProps, {
  setHiraganaBtnN,
  setVerbsOrdering,
  flipPhrasesPracticeSide,
  setPhrasesOrdering,
})(Settings);

export { SettingsMeta };
