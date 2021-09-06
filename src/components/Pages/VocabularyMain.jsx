import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";

class VocabularyMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEng: false,
      showMeaning: false,
      showRomaji: false,
      prevVocab: undefined,
    };
  }

  componentDidMount() {
    this.setState({ prevVocab: this.props.vocabulary, audioPlay: false });
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
      });
    }

    if (this.state.audioPlay !== false) {
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

    let audioWords = [audioPronunciation(vocabulary), vocabulary.english];

    if (this.state.prevVocab !== undefined) {
      audioWords = [...audioWords, audioPronunciation(this.state.prevVocab)];
    }

    return (
      <div className="pt-3 d-flex flex-column justify-content-around text-center">
        {this.props.autoPlay !== 0 && this.props.practiceSide ? (
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
        <h2
          onClick={() => {
            this.setState((state) => ({ showMeaning: !state.showMeaning }));
          }}
          className="clickable"
        >
          {this.state.showMeaning ? hiddenSide : hiddenCaption}
        </h2>

        <AudioItem
          word={audioWords}
          autoPlay={
            // TODO: simplify this
            !this.props.scrollingDone || this.state.audioPlay === false
              ? 0
              : this.props.autoPlay
          }
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
  };
};

VocabularyMain.propTypes = {
  vocabulary: PropTypes.object.isRequired,
  romajiActive: PropTypes.bool,
  practiceSide: PropTypes.bool,
  autoPlay: PropTypes.number,
  scrollingDone: PropTypes.bool,
};

export default connect(mapStateToProps, {})(VocabularyMain);
