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

    const query = this.props.location.search;
    // const toggle = new URLSearchParams(useLocation().search).toggle;
    const toggle = query
      ? query.split("?")[1].split("toggle=")[1].split("&")[0]
      : "english";

    this.state = {
      selectedIndex: 0,
      toggle,
      showToggle: false,
      showMeaning: false,
      showRomaji: true,
    };

    this.props.getPhrases();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.toggleHint = this.toggleHint.bind(this);
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
    // console.log("phrases.jsx");
    // console.log(this.state);
  }

  gotoNext() {
    const l = this.props.phrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
    });
  }

  gotoPrev() {
    const l = this.props.phrases.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
    });
  }

  toggleHint() {
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

  render() {
    // TODO: cleanup
    if (!this.props.phrases || this.props.phrases.length < 1) return <div />;

    const phrase = this.props.phrases[this.state.selectedIndex];

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
          <div
            onClick={this.toggleHint}
            className="pt-3 d-flex flex-column justify-content-around text-center"
          >
            <h1>{phrase.japanese}</h1>
            <h2>{this.state.showRomaji ? phrase.romaji : ""}</h2>
            <div>{this.state.showMeaning ? phrase.english : "-"}</div>
            {
              // TODO: implement pronunciation
            }
            {/* <div className="d-flex">
              <UnmuteIcon size="medium" aria-label="pronunciation" />
            </div> */}
          </div>
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
