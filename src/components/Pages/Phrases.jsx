import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import { getPhrases } from "../../actions/phrasesAct";
import { faGlasses, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  addFrequencyPhrase,
  flipPhrasesPracticeSide,
  removeFrequencyPhrase,
  togglePhrasesFilter,
} from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { LinearProgress } from "@material-ui/core";

const PhrasesMeta = {
  location: "/phrases/",
  label: "Phrases",
};

class Phrases extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      showRomaji: false,
      filteredPhrases: [],
      frequency: [],
    };

    this.props.getPhrases();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
  }

  componentDidMount() {
    if (this.props.phrases && this.props.phrases.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }
  }

  componentDidUpdate(prevProps /*, prevState*/) {
    if (
      this.props.phrases.length != prevProps.phrases.length ||
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("got game data");
      this.setOrder();
    }

    if (this.props.freqFilter != prevProps.freqFilter) {
      this.setOrder();
    }

    if (
      this.props.frequency.length != prevProps.frequency.length ||
      this.props.frequency.some((e) => !prevProps.frequency.includes(e)) ||
      prevProps.frequency.some((e) => !this.props.frequency.includes(e))
    ) {
      // console.log('frequency word changed');
      if(this.props.frequency.length === 0 && this.props.freqFilter){
        this.setOrder();
      }
      else{
        const frequency = this.props.frequency;
        this.setState({ frequency });
      }
    }
  }

  setOrder() {
    let newOrder = [];

    let filteredPhrases;
    if (this.props.freqFilter) {
      if (this.props.frequency.length === 0) {
        filteredPhrases = [];
        this.props.togglePhrasesFilter();
      } else {
        filteredPhrases = this.props.phrases.filter((p) =>
          this.props.frequency.includes(p.uid)
        );
      }
    } else {
      filteredPhrases = this.props.phrases;
    }

    filteredPhrases.forEach((v, i) => newOrder.push(i));
    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    }

    this.setState({ filteredPhrases, order: newOrder });
  }

  gotoNext() {
    const l = this.state.filteredPhrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  gotoPrev() {
    const l = this.state.filteredPhrases.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  render() {
    if (this.state.filteredPhrases.length < 1)
      return <NotReady addlStyle="main-panel" />;

    let phrase;
    if (this.state.order) {
      const index = this.state.order[this.state.selectedIndex];
      phrase = this.state.filteredPhrases[index];
    } else {
      phrase = this.state.filteredPhrases[this.state.selectedIndex];
    }

    let japanesePhrase = JapaneseText.parse(phrase.japanese).toHTML();
    let englishPhrase = phrase.english;
    let romaji = phrase.romaji;

    let shownSide, hiddenSide, hiddenCaption;
    if (this.props.practiceSide) {
      shownSide = englishPhrase;
      hiddenSide = japanesePhrase;
      hiddenCaption = "[Japanese]";
    } else {
      shownSide = japanesePhrase;
      hiddenSide = englishPhrase;
      hiddenCaption = "[English]";
    }

    const progress =
      ((this.state.selectedIndex + 1) / this.state.filteredPhrases.length) *
      100;

    return [
      <div key={0} className="phrases main-panel h-100">
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--orange"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          <div className="pt-3 d-flex flex-column justify-content-around text-center">
            <h1>{shownSide}</h1>
            {this.props.romajiActive && (
              <h5
                onClick={() => {
                  this.setState((state) => ({ showRomaji: !state.showRomaji }));
                }}
                className="clickable"
              >
                {this.state.showRomaji ? romaji : "[Romaji]"}
              </h5>
            )}
            <h2
              onClick={() => {
                this.setState((state) => ({ showMeaning: !state.showMeaning }));
              }}
              className="clickable"
            >
              {this.state.showMeaning ? hiddenSide : hiddenCaption}
            </h2>
          </div>
          <StackNavButton
            color={"--orange"}
            ariaLabel="Next"
            action={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={1} className="options-bar mb-2 flex-shrink-1">
        <div className="row">
          <div className="col">
            <FontAwesomeIcon
              className="clickable"
              onClick={this.props.flipPhrasesPracticeSide}
              icon={this.props.practiceSide ? faGlasses : faPencilAlt}
            />
          </div>
          <div className="col"></div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <div className="sm-icon-grp">
                {this.props.frequency.includes(phrase.uid) ? (
                  <div
                    onClick={() => {
                      this.props.removeFrequencyPhrase(phrase.uid);
                    }}
                  >
                    <XCircleIcon
                      className="clickable"
                      size="small"
                      aria-label="remove"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      this.props.addFrequencyPhrase(phrase.uid);
                    }}
                  >
                    <PlusCircleIcon
                      className="clickable"
                      size="small"
                      aria-label="add"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>,
      <div key={2} className="progress-bar flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>,
    ];
  }
}

const mapStateToProps = (state) => {
  return {
    phrases: state.phrases.value,
    practiceSide: state.settings.phrases.practiceSide,
    isOrdered: state.settings.phrases.ordered,
    romajiActive: state.settings.phrases.romaji,
    frequency: state.settings.phrases.frequency,
    freqFilter: state.settings.phrases.filter,
  };
};

Phrases.propTypes = {
  getPhrases: PropTypes.func.isRequired,
  phrases: PropTypes.array.isRequired,
  isOrdered: PropTypes.bool,
  flipPhrasesPracticeSide: PropTypes.func,
  practiceSide: PropTypes.bool,
  romajiActive: PropTypes.bool,
  removeFrequencyPhrase: PropTypes.func,
  addFrequencyPhrase: PropTypes.func,
  frequency: PropTypes.array,
  freqFilter: PropTypes.bool,
  togglePhrasesFilter: PropTypes.func,
};

export default connect(mapStateToProps, {
  getPhrases,
  flipPhrasesPracticeSide,
  removeFrequencyPhrase,
  addFrequencyPhrase,
  togglePhrasesFilter,
})(Phrases);

export { PhrasesMeta };
