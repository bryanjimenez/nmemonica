import React, { Component } from "react";
import { connect } from "react-redux";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UnmuteIcon,
  MuteIcon,
} from "@primer/octicons-react";
import { getVocabulary } from "../../actions/vocabularyAct";
import { gStorageAudioPath } from "../../constants/paths";
import { faGlasses, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { flipVocabularyPracticeSide } from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { JapaneseText } from "../../helper/JapaneseText";

import "./CustomBtn.css";

const VocabularyMeta = {
  location: "/vocabulary/",
  label: "Vocabulary",
};

class Vocabulary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      showRomaji: false,
    };

    this.props.getVocabulary();

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
  }

  componentDidMount() {
    if (this.props.vocab && this.props.vocab.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.vocab.length != prevProps.vocab.length ||
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("got game data");
      this.setOrder();
    }
  }

  setOrder() {
    let newOrder = [];
    this.props.vocab.forEach((v, i) => newOrder.push(i));
    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    }

    this.setState({ order: newOrder });
  }

  gotoNext() {
    const l = this.props.vocab.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  gotoPrev() {
    const l = this.props.vocab.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  render() {
    if (this.props.vocab.length < 1) return <div />;

    let vocabulary;
    if (this.state.order) {
      const index = this.state.order[this.state.selectedIndex];
      vocabulary = this.props.vocab[index];
    } else {
      vocabulary = this.props.vocab[this.state.selectedIndex];
    }

    let inJapanese = JapaneseText.parse(vocabulary.japanese).toHTML();
    let inEnglish = vocabulary.english;
    let romaji = vocabulary.romaji;

    let shownSide, hiddenSide, hiddenCaption;
    if (this.props.practiceSide) {
      shownSide = inEnglish;
      hiddenSide = inJapanese;
      hiddenCaption = "[Japanese]";
    } else {
      shownSide = inJapanese;
      hiddenSide = inEnglish;
      hiddenCaption = "[English]";
    }

    return (
      <div className="vocabulary main-panel">
        <div className="d-flex justify-content-between h-100">
          <button
            type="button"
            className="btn btn-indigo"
            onClick={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </button>
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
            {vocabulary.uid ? (
              <div
                className="d-flex justify-content-center clickable"
                onClick={() => {
                  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p
                  this.player.src = gStorageAudioPath + vocabulary.uid + ".mp3";
                  this.player.play();
                }}
              >
                <audio ref={(ref) => (this.player = ref)} />
                <UnmuteIcon size="medium" aria-label="pronunciation" />
              </div>
            ) : (
              <div
                className="d-flex justify-content-center"
                style={{ color: "lightgray" }}
              >
                <MuteIcon size="medium"></MuteIcon>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-indigo"
            onClick={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
        <div
          className="clickable mt-2 ml-3"
          onClick={this.props.flipVocabularyPracticeSide}
        >
          <FontAwesomeIcon
            icon={this.props.practiceSide ? faGlasses : faPencilAlt}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    vocab: state.vocabulary.value,
    practiceSide: state.settings.vocabulary.practiceSide,
    isOrdered: state.settings.vocabulary.ordered,
    romajiActive: state.settings.vocabulary.romaji,
  };
};

export default connect(mapStateToProps, {
  getVocabulary,
  flipVocabularyPracticeSide,
})(Vocabulary);

export { VocabularyMeta };
