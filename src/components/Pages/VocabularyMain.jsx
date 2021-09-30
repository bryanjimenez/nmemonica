import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";
import { pushedPlay } from "../../actions/vocabularyAct";
import {
  AUTOPLAY_EN_JP,
  AUTOPLAY_JP_EN,
  AUTOPLAY_OFF,
  flipVocabularyPracticeSide,
} from "../../actions/settingsAct";
import Sizable from "../Form/Sizable";

class VocabularyMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEng: false,
      showMeaning: false,
      showRomaji: false,
      prevVocab: this.props.prevTerm,
      audioPlay: true,
      prevPlayed: this.props.prevPushPlay,
    };
  }

  componentDidMount() {
    this.setState({ audioPlay: false });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.state.audioPlay !== nextState.audioPlay &&
      nextState.audioPlay === false
    ) {
      return false;
    }

    return true;
  }

  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.vocabulary !== prevProps.vocabulary) {
      this.setState({
        showEng: false,
        showMeaning: false,
        showRomaji: false,
        prevVocab: prevProps.vocabulary,
        audioPlay: true,
        prevPlayed: this.props.prevPushPlay,
      });
    }

    if (this.state.audioPlay) {
      this.setState({
        audioPlay: false,
      });
    }
  }

  render() {
    const vocabulary = this.props.vocabulary;

    let inJapanese = JapaneseText.parse(vocabulary.japanese).toHTML();
    let inEnglish = vocabulary.english;
    let romaji = vocabulary.romaji;

    let shownValue, hiddenValue, shownLabel, hiddenLabel;
    if (this.props.practiceSide) {
      shownValue = inEnglish;
      hiddenValue = inJapanese;
      shownLabel = "[English]";
      hiddenLabel = "[Japanese]";
    } else {
      shownValue = inJapanese;
      hiddenValue = inEnglish;
      shownLabel = "[Japanese]";
      hiddenLabel = "[English]";
    }

    const vocabJapanese = audioPronunciation(vocabulary);
    let audioWords = [vocabJapanese, vocabulary.english];

    if (this.state.prevVocab !== undefined && this.state.prevPlayed === false) {
      if (this.props.autoPlay === AUTOPLAY_EN_JP) {
        audioWords = [
          vocabJapanese,
          vocabulary.english,
          audioPronunciation(this.state.prevVocab),
        ];
      } else if (this.props.autoPlay === AUTOPLAY_JP_EN) {
        audioWords = [
          vocabJapanese,
          vocabJapanese,
          this.state.prevVocab.english,
        ];
      }
    }

    return (
      <div className="pt-3 d-flex flex-column justify-content-around text-center">
        <Sizable
          smallStyle={{
            fontSize: !this.props.practiceSide ? "2.5rem" : "2rem",
          }}
          largeStyle={{ fontSize: "2.5rem" }}
          onClick={() => {
            if (this.props.autoPlay) {
              this.props.flipVocabularyPracticeSide();
            }
          }}
        >
          {(this.props.autoPlay && this.props.practiceSide) ||
          (!this.props.autoPlay && this.state.showEng)
            ? shownLabel
            : shownValue}
        </Sizable>

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
            if (this.props.autoPlay) {
              this.props.flipVocabularyPracticeSide();
            } else {
              this.setState((state) => ({
                showMeaning: !state.showMeaning,
              }));
            }
          }}
          className="clickable"
        >
          {(this.props.autoPlay && !this.props.practiceSide) ||
          (!this.props.autoPlay && this.state.showMeaning)
            ? hiddenValue
            : hiddenLabel}
        </h2>

        <AudioItem
          word={audioWords}
          autoPlay={
            !this.props.scrollingDone || !this.state.audioPlay
              ? AUTOPLAY_OFF
              : this.props.autoPlay
          }
          onPushedPlay={() => {
            if (this.props.autoPlay !== AUTOPLAY_JP_EN) {
              this.props.pushedPlay(true);
            }
          }}
          onAutoPlayDone={() => {
            this.props.pushedPlay(false);
          }}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    practiceSide: state.settings.vocabulary.practiceSide,
    romajiActive: state.settings.vocabulary.romaji,
    autoPlay: state.settings.vocabulary.autoPlay,
    scrollingDone: !state.settings.global.scrolling,
    prevTerm: state.vocabulary.previous,
    prevPushPlay: state.vocabulary.pushedPlay,
  };
};

VocabularyMain.propTypes = {
  vocabulary: PropTypes.object.isRequired,
  romajiActive: PropTypes.bool,
  practiceSide: PropTypes.bool,
  autoPlay: PropTypes.number,
  scrollingDone: PropTypes.bool,
  prevTerm: PropTypes.shape({
    japanese: PropTypes.string.isRequired,
    english: PropTypes.string.isRequired,
  }),
  played: PropTypes.bool,
  pushedPlay: PropTypes.func,
  prevPushPlay: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func,
};

export default connect(mapStateToProps, {
  pushedPlay,
  flipVocabularyPracticeSide,
})(VocabularyMain);
