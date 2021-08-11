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
import {
  getTerm,
  play,
  termFrequencyGroupFilter,
} from "../../helper/gameHelper";

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
      frequency: [], // subset of frequency words within current active group
    };

    this.props.getPhrases();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.updateReinforcedUID = this.updateReinforcedUID.bind(this);
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

    if (
      this.props.activeGroup.length != prevProps.activeGroup.length ||
      this.props.activeGroup.some((e) => !prevProps.activeGroup.includes(e)) ||
      prevProps.activeGroup.some((e) => !this.props.activeGroup.includes(e))
    ) {
      // console.log("activeGroup changed");
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
      if (this.props.freqFilter && this.props.frequency.length === 0) {
        this.setOrder();
      } else {
        const filteredKeys = this.state.filteredPhrases.map((f) => f.uid);
        const frequency = this.props.frequency.filter((f) =>
          filteredKeys.includes(f)
        );
        // console.log('frequency word changed');
        // props.frequency is all frequency words
        // state.frequency is a subset of frequency words within current active group
        this.setState({ frequency });
      }
    }
  }

  setOrder() {
    let newOrder = [];

    let filteredPhrases = termFrequencyGroupFilter(
      this.props.freqFilter,
      this.props.phrases,
      this.props.frequency,
      this.props.activeGroup,
      this.props.togglePhrasesFilter
    );

    filteredPhrases.forEach((v, i) => {
      newOrder = [...newOrder, i];
    });
    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    }

    const filteredKeys = filteredPhrases.map((f) => f.uid);
    const frequency = this.props.frequency.filter((f) =>
      filteredKeys.includes(f)
    );

    this.setState({ filteredPhrases, order: newOrder, frequency });
  }

  gotoNext() {
    const l = this.state.filteredPhrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  gotoPrev() {
    const l = this.state.filteredPhrases.length;
    const i = this.state.selectedIndex - 1;

    let newSel;
    if (this.state.reinforcedUID) {
      newSel = this.state.selectedIndex;
    } else {
      newSel = i < 0 ? (l + i) % l : i % l;
    }

    this.setState({
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  updateReinforcedUID(uid) {
    this.setState({
      reinforcedUID: uid,
      showMeaning: false,
      showRomaji: false,
    });
  }

  render() {
    if (this.state.filteredPhrases.length < 1)
      return <NotReady addlStyle="main-panel" />;

    let phrase = getTerm(
      this.state.reinforcedUID,
      this.state.frequency,
      this.state.selectedIndex,
      this.state.order,
      this.state.filteredPhrases
    );

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
            action={() => {
              play(
                this.props.reinforce,
                this.props.freqFilter,
                this.state.frequency,
                this.state.filteredPhrases,
                this.state.reinforcedUID,
                this.updateReinforcedUID,
                this.gotoNext,
                this.props.removeFrequencyPhrase
              );
            }}
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
        <LinearProgress
          variant="determinate"
          value={progress}
          color={phrase.reinforce ? "secondary" : "primary"}
        />
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
    activeGroup: state.settings.phrases.activeGroup,
    freqFilter: state.settings.phrases.filter,
    reinforce: state.settings.phrases.reinforce,
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
  reinforce: PropTypes.bool,
  activeGroup: PropTypes.array,
};

export default connect(mapStateToProps, {
  getPhrases,
  flipPhrasesPracticeSide,
  removeFrequencyPhrase,
  addFrequencyPhrase,
  togglePhrasesFilter,
})(Phrases);

export { PhrasesMeta };
