import React, { Component } from "react";
import { connect } from "react-redux";
import { UnmuteIcon } from "@primer/octicons-react";

// import PropTypes from "prop-types";

import "./Verbs.css";

const VerbsMeta = {
  location: "/",
  label: "Verbs",
};

class Verbs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      selectedTense: 0,
      meaningShow: false,
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.showMeaning = this.showMeaning.bind(this);
    this.setTense = this.setTense.bind(this);
  }

  componentDidMount() {}

  componentDidUpdate() {
    console.log("verbs.jsx");
    console.log(this.state);
  }

  gotoNext() {
    const l = this.props.verbs.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      selectedTense: 0,
    });
  }

  gotoPrev() {
    const l = this.props.verbs.length;
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
    if (this.props.verbs.length < 1) return <div />;

    const v = this.props.verbs[this.state.selectedIndex];
    const leftshift = v.tenses.length % 2 === 0 ? 0 : 1;
    const splitIdx = Math.trunc(v.tenses.length / 2) + leftshift;

    const t1 = v.tenses.slice(0, splitIdx);
    const t2 = v.tenses.slice(splitIdx, v.tenses.length);

    return (
      <div className="verbs" style={{ height: "75%" }}>
        <div
          className="d-flex justify-content-between"
          style={{ height: "100%" }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.gotoPrev}
          >
            prev
          </button>

          <div className="pt-3 d-flex flex-column justify-content-around">
            {t1.map((t, idx) => (
              <div
                onClick={() => {
                  this.setTense(idx);
                }}
              >
                {t.t}
              </div>
            ))}
          </div>
          <div
            onClick={this.showMeaning}
            className="pt-3 d-flex flex-column justify-content-around"
          >
            <h1>{v.japanese}</h1>
            <h2>{v.tenses[this.state.selectedTense].romaji.plain_pos}</h2>
            {this.state.showMeaning ? <div>{v.english}</div> : <div>{"-"}</div>}
            <div className="d-flex">
              <UnmuteIcon size="medium" aria-label="pronunciation" />
            </div>
          </div>

          <div className="pt-3 d-flex flex-column justify-content-around">
            {t2.map((t, idx) => (
              <div
                onClick={() => {
                  this.setTense(splitIdx + idx);
                }}
              >
                {t.t}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary"
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
  return { verbs: state.verbs.value };
};

export default connect(
  mapStateToProps
  // { getMenu }
)(Verbs);

export { VerbsMeta };
