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
} from "../../actions/settingsAct";

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

    let shownSide, hiddenSide, shownCaption, hiddenCaption;
    if (this.props.practiceSide) {
      shownSide = inEnglish;
      hiddenSide = inJapanese;
      shownCaption = "[English]";
      hiddenCaption = "[Japanese]";
    } else {
      shownSide = inJapanese;
      hiddenSide = inEnglish;
      shownCaption = "[Japanese]";
      hiddenCaption = "[English]";
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
        {this.props.autoPlay === AUTOPLAY_JP_EN && this.props.practiceSide ? (
          <h1
            onClick={() => {
              this.setState((state) => ({ showEng: !state.showEng }));
            }}
          >
            {this.state.showEng ? shownSide : shownCaption}
          </h1>
        ) : (
          <h1>{shownSide}</h1>
        )}
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
        {this.props.autoPlay !== AUTOPLAY_EN_JP || this.props.practiceSide ? (
          <h2
            onClick={() => {
              this.setState((state) => ({ showMeaning: !state.showMeaning }));
            }}
            className="clickable"
          >
            {this.state.showMeaning ? hiddenSide : hiddenCaption}
          </h2>
        ) : (
          <h2>{hiddenSide}</h2>
        )}
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
};

export default connect(mapStateToProps, { pushedPlay })(VocabularyMain);
