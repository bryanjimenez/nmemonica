import React, { Component } from "react";
import { connect } from "react-redux";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UnmuteIcon,
  MuteIcon,
} from "@primer/octicons-react";
import { getPhrases } from "../../actions/phrasesAct";
import { gStorageAudioPath } from "../../constants/paths";
import { faGlasses, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { flipPhrasesPracticeSide } from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { JapaneseText } from "../../helper/JapaneseText";

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

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.phrases.length != prevProps.phrases.length ||
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("got game data");
      this.setOrder();
    }
  }

  setOrder() {
    let newOrder = [];
    this.props.phrases.forEach((v, i) => newOrder.push(i));
    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    }

    this.setState({ order: newOrder });
  }

  gotoNext() {
    const l = this.props.phrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  gotoPrev() {
    const l = this.props.phrases.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  render() {
    if (this.props.phrases.length < 1) return <div />;

    let phrase;
    if (this.state.order) {
      const index = this.state.order[this.state.selectedIndex];
      phrase = this.props.phrases[index];
    } else {
      phrase = this.props.phrases[this.state.selectedIndex];
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

    return (
      <div className="phrases main-panel">
        <div className="d-flex justify-content-between h-100">
          <button
            type="button"
            className="btn btn-success"
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
            {phrase.uid ? (
              <div
                className="d-flex justify-content-center clickable"
                onClick={() => {
                  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p
                  this.player.src = gStorageAudioPath + phrase.uid + ".mp3";
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
            className="btn btn-success"
            onClick={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
        <div
          className="clickable mt-2 ml-3"
          onClick={this.props.flipPhrasesPracticeSide}
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
    phrases: state.phrases.value,
    practiceSide: state.settings.phrases.practiceSide,
    isOrdered: state.settings.phrases.ordered,
    romajiActive: state.settings.phrases.romaji,
  };
};

export default connect(mapStateToProps, {
  getPhrases,
  flipPhrasesPracticeSide,
})(Phrases);

export { PhrasesMeta };
