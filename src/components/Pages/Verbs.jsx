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

    const query = this.props.location.search;
    // const toggle = new URLSearchParams(useLocation().search).toggle;
    const toggle = query
      ? query.split("?")[1].split("toggle=")[1].split("&")[0]
      : "english";

    this.state = {
      selectedIndex: 0,
      selectedTense: 0,
      toggle,
      showToggle: false,
      showMeaning: false,
      showRomaji: true,
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.toggle = this.toggle.bind(this);
    this.setTense = this.setTense.bind(this);
  }

  componentDidMount() {
    let hint = {};
    if (this.state.toggle === "english") {
      hint = { showMeaning: false, showRomaji: true };
    } else if (this.state.toggle === "romaji") {
      hint = { showRomaji: false, showMeaning: true };
    } else {
      hint = { showMeaning: false, showRomaji: true };
    }

    this.setState(hint);
  }

  componentDidUpdate() {
    // console.log("verbs.jsx");
    // console.log(this.state);
  }

  gotoNext() {
    const l = this.props.verbs.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
      selectedTense: 0,
    });
  }

  gotoPrev() {
    const l = this.props.verbs.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
      selectedTense: 0,
    });
  }

  toggle() {
    let hint = {};
    if (this.state.toggle === "english") {
      hint = {
        showMeaning: !this.state.showToggle,
        showToggle: !this.state.showToggle,
      };
    } else if (this.state.toggle === "romaji") {
      hint = {
        showRomaji: !this.state.showToggle,
        showToggle: !this.state.showToggle,
      };
    }

    this.setState(hint);
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
            onClick={this.toggle}
            className="pt-3 d-flex flex-column justify-content-around text-center"
          >
            <h1>{v.japanese}</h1>
            <h2>
              {this.state.showRomaji
                ? v.tenses[this.state.selectedTense].romaji.plain_pos
                : "-"}
            </h2>
            <div>{this.state.showMeaning ? v.english : "-"}</div>
            {
              // TODO: implement sound
            }
            {/* <div className="d-flex">
              <UnmuteIcon size="medium" aria-label="pronunciation" />
            </div> */}
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
