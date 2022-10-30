import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { JapaneseText } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";
import { pushedPlay } from "../../actions/vocabularyAct";
import {
  AutoPlaySetting,
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

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * @typedef {{
 * showMeaning: boolean,
 * showRomaji: boolean,
 * prevVocab:RawVocabulary,
 * showHint?: boolean,
 * naFlip?: string,
 * swiping?: any,
 * prevPlayed: boolean,
 * audioPlay: boolean,
 * }} VocabularyMainState
 */

/**
 * @typedef {{
 * vocabulary: RawVocabulary,
 * showHint: boolean,
 * hintEnabled: boolean,
 * romajiActive: boolean,
 * flipVocabularyPracticeSide: typeof flipVocabularyPracticeSide,
 * practiceSide: boolean,
 * autoPlay: typeof AutoPlaySetting[keyof AutoPlaySetting],
 * scrollingDone: boolean,
 * pushedPlay: typeof pushedPlay,
 * touchSwipe: boolean,
 * furigana: any,
 * toggleFurigana: typeof toggleFurigana,
 * toggleFuriganaSettingHelper: typeof toggleFuriganaSettingHelper,
 * reCache: boolean,
 * prevTerm: RawVocabulary,
 * played: boolean,
 * prevPushPlay: boolean,
 * loopPlayBtn?: JSX.Element,
 * }} VocabularyMainProps
 */

class VocabularyMain extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {VocabularyMainState} */
    this.state = {
      showMeaning: false,
      showRomaji: false,
      prevVocab: this.props.prevTerm,
      audioPlay: true,
      prevPlayed: this.props.prevPushPlay,
    };

    /** @type {VocabularyMainProps} */
    this.props;
  }

  componentDidMount() {
    this.setState({ audioPlay: false });
  }

  /**
   * @param {VocabularyMainProps} nextProps
   * @param {VocabularyMainState} nextState
   */
  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.state.audioPlay !== nextState.audioPlay &&
      nextState.audioPlay === false
    ) {
      return false;
    }

    return true;
  }

  /**
   * @param {VocabularyMainProps} prevProps
   */
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
      vocabulary.uid,
      this.props.furigana,
      practiceSide,
      this.props.toggleFurigana
    );

    let jLabel = <span>{"[Japanese]"}</span>;
    let eLabel = <span>{"[English]"}</span>;

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

    const playButton = this.props.loopPlayBtn || (
      <AudioItem
        visible={!this.props.touchSwipe}
        word={audioWords}
        reCache={this.props.reCache}
        autoPlay={
          !this.props.scrollingDone || !this.state.audioPlay
            ? AutoPlaySetting.OFF
            : this.props.autoPlay
        }
        onPushedPlay={() => {
          if (this.props.autoPlay !== AutoPlaySetting.JP_EN) {
            this.props.pushedPlay(true);
          }
        }}
        onAutoPlayDone={() => {
          this.props.pushedPlay(false);
        }}
      />
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
                this.setState((/** @type {VocabularyMainState} */ state) => ({
                  showRomaji: !state.showRomaji,
                }));
              }}
              className="clickable loop-no-interrupt"
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
                this.setState((/** @type {VocabularyMainState} */ state) => ({
                  showMeaning: !state.showMeaning,
                }));
              }
            }}
            className="clickable loop-no-interrupt"
          >
            {(this.props.autoPlay && !practiceSide) ||
            (!this.props.autoPlay && this.state.showMeaning)
              ? bottomValue
              : bottomLabel}
          </span>
        </h2>
        <div className="d-flex justify-content-center">{playButton}</div>
      </div>
    );
  }
}
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    practiceSide: state.settings.vocabulary.practiceSide,
    romajiActive: state.settings.vocabulary.romaji,
    autoPlay: state.settings.vocabulary.autoPlay,
    scrollingDone: !state.settings.global.scrolling,
    prevTerm: state.vocabulary.prevTerm,
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
  loopPlayBtn: PropTypes.object,
};

export default connect(mapStateToProps, {
  pushedPlay,
  flipVocabularyPracticeSide,
  toggleFurigana,
})(VocabularyMain);
