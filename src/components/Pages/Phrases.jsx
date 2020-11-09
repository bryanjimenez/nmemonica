import React, { Component } from "react";
import { connect } from "react-redux";
import { UnmuteIcon } from "@primer/octicons-react";

import { getPhrases } from "../../actions/phrasesAct";

// import PropTypes from "prop-types";

import "./Verbs.css";

const PhrasesMeta = {
  location: "/phrases",
  label: "Phrases",
};

class Phrases extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      selectedTense: 0,
      meaningShow: false,
    };

    this.props.getPhrases();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.showMeaning = this.showMeaning.bind(this);
    this.setTense = this.setTense.bind(this);
  }

  componentDidMount() {}

  componentDidUpdate() {
    // console.log("phrases.jsx");
    // console.log(this.state);
  }

  gotoNext() {
    const l = this.props.phrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      selectedTense: 0,
    });
  }

  gotoPrev() {
    const l = this.props.phrases.length;
    const newSel = Math.abs((this.state.selectedIndex - 1) % l);
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      selectedTense: 0,
    });
  }

  showMeaning() {
    const newVal = !this.state.showMeaning;
    this.setState({ showMeaning: newVal });
  }

  setTense(index) {
    this.setState({ selectedTense: index });
  }

  render() {
    // TODO: cleanup
    if (!this.props.phrases || this.props.phrases.length < 1) return <div />;

    const phrase = this.props.phrases[this.state.selectedIndex];
    // const leftshift = v.tenses.length % 2 === 0 ? 0 : 1;
    // const splitIdx = Math.trunc(v.tenses.length / 2) + leftshift;

    // const t1 = v.tenses.slice(0, splitIdx);
    // const t2 = v.tenses.slice(splitIdx, v.tenses.length);

    return (
      <div className="phrases" style={{ height: "75%" }}>
        <div
          className="d-flex justify-content-between"
          style={{ height: "100%" }}
        >
          <button
            type="button"
            className="btn btn-success"
            onClick={this.gotoPrev}
          >
            prev
          </button>

          {/* <div className="pt-3 d-flex flex-column justify-content-around">
            {t1.map((t, idx) => (
              <div
                onClick={() => {
                  this.setTense(idx);
                }}
              >
                {t.t}
              </div>
            ))}
          </div> */}
          <div
            onClick={this.showMeaning}
            className="pt-3 d-flex flex-column justify-content-around"
          >
            <h1>{phrase.japanese}</h1>
            <h2>{phrase.romaji}</h2>
            {this.state.showMeaning ? (
              <div>{phrase.english}</div>
            ) : (
              <div>{"-"}</div>
            )}
            {
              // TODO: implement pronunciation
            }
            {/* <div className="d-flex">
              <UnmuteIcon size="medium" aria-label="pronunciation" />
            </div> */}
          </div>

          {/* <div className="pt-3 d-flex flex-column justify-content-around">
            {t2.map((t, idx) => (
              <div
                onClick={() => {
                  this.setTense(splitIdx + idx);
                }}
              >
                {t.t}
              </div>
            ))}
          </div> */}

          <button
            type="button"
            className="btn btn-success"
            onClick={this.gotoNext}
          >
            next
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return { phrases: state.phrases.value };
};

export default connect(mapStateToProps, { getPhrases })(Phrases);

export { PhrasesMeta };
