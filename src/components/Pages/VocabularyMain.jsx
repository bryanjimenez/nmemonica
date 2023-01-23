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
  getJapaneseHint,
} from "../../helper/gameHelper";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * @typedef {Object} VocabularyMainState
 * @property {boolean} showMeaning
 * @property {boolean} showRomaji
 * @property {RawVocabulary} prevVocab
 * @property {boolean} [showHint]
 * @property {string} [naFlip]
 * @property {any} [swiping]
 * @property {boolean} prevPlayed
 * @property {boolean} audioPlay
 */

/**
 * @typedef {Object} VocabularyMainProps
 * @property {RawVocabulary} vocabulary
 * @property {boolean} showHint
 * @property {boolean} hintEnabled
 * @property {boolean} romajiActive
 * @property {typeof flipVocabularyPracticeSide} flipVocabularyPracticeSide
 * @property {boolean} practiceSide
 * @property {typeof AutoPlaySetting[keyof AutoPlaySetting]} autoPlay
 * @property {boolean} scrollingDone
 * @property {typeof pushedPlay} pushedPlay
 * @property {number} swipeThreshold
 * @property {any} furigana
 * @property {import("../../actions/settingsAct").toggleFuriganaYield} toggleFurigana
 * @property {typeof toggleFuriganaSettingHelper} toggleFuriganaSettingHelper
 * @property {boolean} reCache
 * @property {RawVocabulary} prevTerm
 * @property {boolean} played
 * @property {boolean} prevPushPlay
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

    /** @type {import("../../typings/raw").SetState<VocabularyMainState>} */
    this.setState;
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
        const jHint = getJapaneseHint(vObj);
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

    const playButton = (
      <AudioItem
        visible={this.props.swipeThreshold === 0}
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

    const shortEN = inEnglish.length < 55;

    return (
      <div className="pt-3 d-flex flex-column justify-content-around text-center">
        <Sizable
          breakPoint="md"
          largeClassName={{ "fs-display-5": true }}
          smallClassName={
            // {Japanese : English}
            {
              ...(!practiceSide
                ? { "fs-display-6": true }
                : { [shortEN ? "fs-display-6" : "h3"]: true }),
            }
          }
          onClick={
            (this.props.autoPlay && this.props.flipVocabularyPracticeSide) ||
            undefined
          }
        >
          {this.props.autoPlay && practiceSide ? topLabel : topValue}
        </Sizable>
        {this.props.romajiActive && romaji && (
          <h5>
            <span
              onClick={() => {
                this.setState((state) => ({
                  showRomaji: !state.showRomaji,
                }));
              }}
              className="clickable loop-no-interrupt"
            >
              {this.state.showRomaji ? romaji : "[Romaji]"}
            </span>
          </h5>
        )}
        <Sizable
          className={{ "loop-no-interrupt": true }}
          breakPoint="md"
          largeClassName={{ "fs-display-5": true }}
          smallClassName={
            // {Japanese : English}
            {
              ...(practiceSide
                ? { "fs-display-6": true }
                : { [shortEN ? "fs-display-6" : "h3"]: true }),
            }
          }
          onClick={() => {
            if (this.props.autoPlay) {
              this.props.flipVocabularyPracticeSide();
            } else {
              this.setState((state) => ({
                showMeaning: !state.showMeaning,
              }));
            }
          }}
        >
          {(this.props.autoPlay && !practiceSide) ||
          (!this.props.autoPlay && this.state.showMeaning)
            ? bottomValue
            : bottomLabel}
        </Sizable>

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
    swipeThreshold: state.settings.global.swipeThreshold,
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
  swipeThreshold: PropTypes.number,
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
