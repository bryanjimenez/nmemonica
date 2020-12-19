import React, { Component } from "react";
import { connect } from "react-redux";
import classNames from "classnames";
import {
  flipPhrasesPracticeSide,
  setHiraganaBtnN,
  setVerbsOrdering,
  setPhrasesOrdering,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
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
      <div className="settings">
        <div className="d-flex flex-column justify-content-between pl-3 pr-3 h-100">
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
            <div className="setting-block">
              <div className="mb-2">
                <Toggle
                  active={this.props.oppositesQRomaji}
                  action={this.props.setOppositesQRomaji}
                  statusText="Q romaji"
                  activeText="Shown"
                  inactiveText="Hidden"
                />
              </div>
              <div>
                <Toggle
                  active={this.props.oppositesARomaji}
                  action={this.props.setOppositesARomaji}
                  statusText="A romaji"
                  activeText="Shown"
                  inactiveText="Hidden"
                />
              </div>
            </div>
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
            <div className="setting-block">
              <Toggle
                active={this.props.particlesARomaji}
                action={this.props.setParticlesARomaji}
                statusText="A romaji"
                activeText="Shown"
                inactiveText="Hidden"
              />
            </div>
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
    oppositesQRomaji: state.settings.opposites.qRomaji,
    oppositesARomaji: state.settings.opposites.aRomaji,
    particlesARomaji: state.settings.particles.aRomaji,
  };
};

export default connect(mapStateToProps, {
  setHiraganaBtnN,
  setVerbsOrdering,
  flipPhrasesPracticeSide,
  setPhrasesOrdering,
  setOppositesQRomaji,
  setOppositesARomaji,
  setParticlesARomaji,
})(Settings);

export { SettingsMeta };
