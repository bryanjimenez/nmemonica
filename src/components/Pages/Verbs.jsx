import React, { Component } from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import { UnmuteIcon } from "@primer/octicons-react";
import { getVerbs } from "../../actions/verbsAct";

// import PropTypes from "prop-types";

import "./Verbs.css";
import { kanjiWithFurigana } from "../../helper/parser";
import { masuForm, taForm, teForm } from "../../helper/verbForms";

const VerbsMeta = {
  location: "/verbs/",
  label: "Verbs",
};

class Verbs extends Component {
  constructor(props) {
    super(props);

    const query = this.props.location.search;
    // const toggle = new URLSearchParams(useLocation().search).toggle;
    // const toggle = query
    //   ? query.split("?")[1].split("toggle=")[1].split("&")[0]
    //   : "english";

    this.state = {
      selectedIndex: 0,
      selectedTense: 0,
      showMeaning: false,
      showRomaji: false,
      shownVerb: "",
      shownForm: "",
    };

    this.props.getVerbs();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setTense = this.setTense.bind(this);
    this.buildTenseElement = this.buildTenseElement.bind(this);
  }

  componentDidMount() {}

  componentDidUpdate() {
    // console.log("verbs.jsx");
    // console.log(this.state);
  }

  gotoNext() {
    const l = this.props.verbs.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
      selectedTense: 0,
      shownVerb: "",
      shownForm: "",
    });
  }

  gotoPrev() {
    const l = this.props.verbs.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
      selectedTense: 0,
      shownVerb: "",
      shownForm: "",
    });
  }

  setTense(index) {
    this.setState({ selectedTense: index });
  }

  buildTenseElement(tense) {
    return tense.map((t, i) => {
      const tenseClass = classNames({
        clickable: true,
        "font-weight-bold": this.state.shownForm === t.t,
      });

      return (
        <div
          className={tenseClass}
          key={i}
          onClick={() => {
            this.setState({ shownVerb: t.j, shownForm: t.t });
          }}
        >
          {this.state.shownForm === t.t ? t.t : "[" + t.t + "]"}
        </div>
      );
    });
  }

  render() {
    if (this.props.verbs.length < 1) return <div />;

    const v = this.props.verbs[this.state.selectedIndex];
    const tenses = [
      { t: "dictionary", j: v.japanese.dictionary },
      { t: "masu", j: masuForm(v.japanese.dictionary) },
      { t: "te_form", j: teForm(v.japanese.dictionary) },
      { t: "ta_form", j: taForm(v.japanese.dictionary) },
    ];

    const leftshift = tenses.length % 2 === 0 ? 0 : 1;
    const splitIdx = Math.trunc(tenses.length / 2) + leftshift;

    const t1 = tenses.slice(0, splitIdx);
    const t2 = tenses.slice(splitIdx, tenses.length);

    const romaji = ".";
    const english = v.english;

    let japanesePhrase;
    if (this.state.shownVerb) {
      japanesePhrase = kanjiWithFurigana(this.state.shownVerb);
    } else {
      japanesePhrase = kanjiWithFurigana(v.japanese.dictionary);
    }

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
            {this.buildTenseElement(t1)}
          </div>
          <div className="pt-3 d-flex flex-column justify-content-around text-center">
            <h1>{japanesePhrase}</h1>
            <h2
              className="clickable"
              onClick={() => {
                this.setState((state) => ({
                  showRomaji: !state.showRomaji,
                }));
              }}
            >
              {this.state.showRomaji ? romaji : "[romaji]"}
            </h2>
            <div
              className="clickable"
              onClick={() => {
                this.setState((state) => ({
                  showMeaning: !state.showMeaning,
                }));
              }}
            >
              {this.state.showMeaning ? english : "[english]"}
            </div>
            {
              // TODO: implement sound
            }
            {/* <div className="d-flex">
              <UnmuteIcon size="medium" aria-label="pronunciation" />
            </div> */}
          </div>

          <div className="pt-3 d-flex flex-column justify-content-around">
            {this.buildTenseElement(t2)}
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

export default connect(mapStateToProps, { getVerbs })(Verbs);

export { VerbsMeta };
