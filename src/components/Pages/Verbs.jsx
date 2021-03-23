import React, { Component } from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getVocabulary } from "../../actions/vocabularyAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { JapaneseVerb } from "../../helper/JapaneseVerb";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { LinearProgress } from "@material-ui/core";

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
      shownForm: "dictionary",
    };

    if (this.props.verbs.length === 0) {
      // verbs are filtered from vocabulary
      this.props.getVocabulary();
    }

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

  componentDidUpdate(prevProps /*, prevState*/) {
    if (
      this.props.verbs.length != prevProps.verbs.length ||
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("got game data");
      this.setVerbsOrder();
    }

    if (this.props.masu != prevProps.masu) {
      this.setState({ shownForm: this.props.masu ? "masu" : "dictionary" });
    }
  }

  setVerbsOrder() {
    let newOrder = [];
    this.props.verbs.forEach((v, i) => newOrder.push(i));
    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    }

    this.setState({
      order: newOrder,
      shownForm: this.props.masu ? "masu" : "dictionary",
    });
  }

  gotoNext() {
    const l = this.props.verbs.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
      shownForm: this.props.masu ? "masu" : "dictionary",
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
      shownForm: this.props.masu ? "masu" : "dictionary",
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
            this.setState({ shownForm: t.t });
          }}
        >
          {this.state.shownForm === t.t ? t.t : "[" + t.t + "]"}
        </div>
      );
    });
  }

  render() {
    if (this.props.verbs.length < 1) return <NotReady addlStyle="main-panel" />;

    let v;
    if (this.state.order) {
      const index = this.state.order[this.state.selectedIndex];
      v = this.props.verbs[index];
    } else {
      v = this.props.verbs[this.state.selectedIndex];
    }

    const dictionaryForm = JapaneseVerb.parse(v.japanese);

    const tenses = [
      { t: "masu", j: dictionaryForm.masuForm() },
      { t: "mashou", j: dictionaryForm.mashouForm() },
      { t: "dictionary", j: dictionaryForm },
      { t: "te_form", j: dictionaryForm.teForm() },
      { t: "ta_form", j: dictionaryForm.taForm() },
    ];

    const rightShift = tenses.length % 2 === 0 ? 1 : 0;
    const splitIdx = Math.trunc(tenses.length / 2) + rightShift;

    const t1 = tenses.slice(0, splitIdx);
    const t2 = tenses.slice(splitIdx, tenses.length);

    const romaji = v.romaji || ".";
    const english = v.english;

    let japanesePhrase;

    switch (this.state.shownForm) {
      case "masu":
        japanesePhrase = dictionaryForm.masuForm().toHTML();
        break;
      case "mashou":
        japanesePhrase = dictionaryForm.mashouForm().toHTML();
        break;
      case "te_form":
        japanesePhrase = dictionaryForm.teForm().toHTML();
        break;
      case "ta_form":
        japanesePhrase = dictionaryForm.taForm().toHTML();
        break;
      default:
        japanesePhrase = dictionaryForm.toHTML();
    }

    const progress =
      ((this.state.selectedIndex + 1) / this.props.verbs.length) * 100;

    return [
      <div key={0} className="verbs main-panel h-100">
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--red"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          <div className="pt-3 pl-3 flex-shrink-1 d-flex flex-column justify-content-around">
            {this.buildTenseElement(t1)}
          </div>
          <div className="pt-3 w-100 d-flex flex-column justify-content-around text-center">
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

          <div className="pt-3 pr-3 text-end flex-shrink-1 d-flex flex-column justify-content-around">
            {this.buildTenseElement(t2)}
          </div>

          <StackNavButton
            color={"--red"}
            ariaLabel="Next"
            action={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={1} className="progress-bar flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>,
    ];
  }
}

const mapStateToProps = (state) => {
  return {
    verbs: state.verbs.value,
    isOrdered: state.settings.verbs.ordered,
    masu: state.settings.verbs.masu,
  };
};

Verbs.propTypes = {
  getVocabulary: PropTypes.func.isRequired,
  verbs: PropTypes.array.isRequired,
  isOrdered: PropTypes.bool,
  masu: PropTypes.bool,
};

export default connect(mapStateToProps, { getVocabulary })(Verbs);

export { VerbsMeta };
