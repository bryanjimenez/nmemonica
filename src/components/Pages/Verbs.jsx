import React, { Component } from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UnmuteIcon,
} from "@primer/octicons-react";
import { getVerbs } from "../../actions/verbsAct";

// import PropTypes from "prop-types";

import { kanjiWithFurigana } from "../../helper/parser";
import { masuForm, taForm, teForm } from "../../helper/verbForms";
import { shuffleArray } from "../../helper/arrayHelper";

const VerbsMeta = {
  location: "/verbs/",
  label: "Verbs",
};

class Verbs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      showRomaji: false,
      shownVerb: "",
      shownForm: "",
    };

    this.props.getVerbs();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.buildTenseElement = this.buildTenseElement.bind(this);
    this.setVerbsOrder = this.setVerbsOrder.bind(this);
  }

  componentDidMount() {
    if (this.props.verbs && this.props.verbs.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setVerbsOrder();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.verbs.length != prevProps.verbs.length ||
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("got game data");
      this.setVerbsOrder();
    }
  }

  setVerbsOrder() {
    let newOrder = [];
    this.props.verbs.forEach((v, i) => newOrder.push(i));
    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    }

    this.setState({ order: newOrder });
  }

  gotoNext() {
    const l = this.props.verbs.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
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
      shownVerb: "",
      shownForm: "",
    });
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

    let v;
    if (this.state.order) {
      const index = this.state.order[this.state.selectedIndex];
      v = this.props.verbs[index];
    } else {
      v = this.props.verbs[this.state.selectedIndex];
    }

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
      <div className="verbs main-panel">
        <div className="d-flex justify-content-between h-100">
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
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
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return { verbs: state.verbs.value, isOrdered: state.settings.verbs.ordered };
};

export default connect(mapStateToProps, { getVerbs })(Verbs);

export { VerbsMeta };
