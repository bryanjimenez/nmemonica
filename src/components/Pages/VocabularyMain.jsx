import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { JapaneseText } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";
import { pushedPlay } from "../../actions/vocabularyAct";
import {
  AUTOPLAY_JP_EN,
  AUTOPLAY_OFF,
  flipVocabularyPracticeSide,
  toggleFurigana,
} from "../../actions/settingsAct";
import Sizable from "../Form/Sizable";
import {
  audioWordsHelper,
  englishLabel,
  getEnglishHint,
  japaneseLabel,
  toggleFuriganaSettingHelper,
  labelPlacementHelper,
} from "../../helper/gameHelper";
import { furiganaHintBuilder } from "../../helper/kanjiHelper";
import { kanaHintBuilder } from "../../helper/kanaHelper";

class VocabularyMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
    const practiceSide = this.props.practiceSide;

    const furiganaToggable = toggleFuriganaSettingHelper(
      practiceSide,
      vocabulary.uid,
      this.props.furigana,
      this.props.toggleFurigana
    );

    let jLabel = "[Japanese]";
    let eLabel = "[English]";

    const vObj = JapaneseText.parse(vocabulary);
    const inJapanese = vObj.toHTML(furiganaToggable);

    const inEnglish = vocabulary.english;
    const romaji = vocabulary.romaji;

    const jValue = japaneseLabel(practiceSide, vObj, inJapanese);
    const eValue = englishLabel(practiceSide, vObj, inEnglish);

    if (this.props.hintEnabled && this.props.showHint) {
      if (practiceSide) {
        const jHint = vObj.getHint(kanaHintBuilder, furiganaHintBuilder, 3, 1);
        jLabel = jHint || jLabel;
      } else {
        const eHint = getEnglishHint(vocabulary);
        eLabel = eHint || eLabel;
      }
    }

    const { topValue, topLabel, bottomValue, bottomLabel } =
      labelPlacementHelper(practiceSide, eValue, jValue, eLabel, jLabel);

    const audioWords = audioWordsHelper(
      this.state.prevPlayed,
      this.props.autoPlay,
      vocabulary,
      this.state.prevVocab
    );

    return (
      <div className="pt-3 d-flex flex-column justify-content-around text-center">
        <Sizable
          smallStyle={{
            fontSize: !practiceSide ? "2.5rem" : "2rem",
          }}
          largeStyle={{ fontSize: "2.5rem" }}
          onClick={() => {
            if (this.props.autoPlay) {
              this.props.flipVocabularyPracticeSide();
            }
          }}
        >
          {this.props.autoPlay && practiceSide ? topLabel : topValue}
        </Sizable>
        {this.props.romajiActive && romaji && (
          <h5>
            <span
              onClick={() => {
                this.setState((state) => ({ showRomaji: !state.showRomaji }));
              }}
              className="clickable"
            >
              {this.state.showRomaji ? romaji : "[Romaji]"}
            </span>
          </h5>
        )}
        <h2>
          <span
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
            {(this.props.autoPlay && !practiceSide) ||
            (!this.props.autoPlay && this.state.showMeaning)
              ? bottomValue
              : bottomLabel}
          </span>
        </h2>
        <AudioItem
          visible={!this.props.touchSwipe}
          word={audioWords}
          reCache={this.props.reCache}
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
    touchSwipe: state.settings.global.touchSwipe,
    furigana: state.settings.vocabulary.repetition,
    hintEnabled: state.settings.vocabulary.hintEnabled,
  };
};

VocabularyMain.propTypes = {
  vocabulary: PropTypes.object.isRequired,
  romajiActive: PropTypes.bool,
  practiceSide: PropTypes.bool,
  reCache: PropTypes.bool,
  autoPlay: PropTypes.number,
  scrollingDone: PropTypes.bool,
  prevTerm: PropTypes.shape({
    japanese: PropTypes.string.isRequired,
    english: PropTypes.string.isRequired,
    uid: PropTypes.string.isRequired,
  }),
  played: PropTypes.bool,
  pushedPlay: PropTypes.func,
  prevPushPlay: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func,
  touchSwipe: PropTypes.bool,
  furigana: PropTypes.object,
  toggleFurigana: PropTypes.func,
  toggleFuriganaSettingHelper: PropTypes.func,
  hintEnabled: PropTypes.bool,
  showHint: PropTypes.bool,
};

export default connect(mapStateToProps, {
  pushedPlay,
  flipVocabularyPracticeSide,
  toggleFurigana,
})(VocabularyMain);
