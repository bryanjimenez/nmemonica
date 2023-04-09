import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { audioPronunciation, JapaneseText } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";
import { flipVocabularyPracticeSide } from "../../actions/settingsAct";
import Sizable from "../Form/Sizable";
import {
  englishLabel,
  getEnglishHint,
  japaneseLabel,
  toggleFuriganaSettingHelper,
  labelPlacementHelper,
  getJapaneseHint,
  getCacheUID,
} from "../../helper/gameHelper";
import { furiganaToggled } from "../../slices/settingSlice";

/**
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * @typedef {Object} VocabularyMainState
 * @property {boolean} showMeaning
 * @property {boolean} showRomaji
 * @property {boolean} [showHint]
 * @property {string} [naFlip]
 * @property {any} [swiping]
 */

/**
 * @typedef {Object} VocabularyMainProps
 * @property {RawVocabulary} vocabulary
 * @property {boolean} showHint
 * @property {boolean} hintEnabled
 * @property {boolean} showBareKanji
 * @property {boolean} romajiActive
 * @property {typeof flipVocabularyPracticeSide} flipVocabularyPracticeSide
 * @property {boolean} practiceSide   true: English, false: Japanese
 * @property {boolean} scrollingDone
 * @property {number} swipeThreshold
 * @property {SpaceRepetitionMap} repetition
 * @property {typeof furiganaToggled} furiganaToggled
 * @property {typeof toggleFuriganaSettingHelper} toggleFuriganaSettingHelper
 * @property {boolean} reCache
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
    };

    /** @type {VocabularyMainProps} */
    this.props;

    /** @type {import("../../typings/raw").SetState<VocabularyMainState>} */
    this.setState;
  }

  /**
   * @param {VocabularyMainProps} prevProps
   */
  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.vocabulary !== prevProps.vocabulary) {
      this.setState({
        showMeaning: false,
        showRomaji: false,
      });
    }
  }

  render() {
    const vocabulary = this.props.vocabulary;
    const practiceSide = this.props.practiceSide;

    const furiganaToggable = toggleFuriganaSettingHelper(
      vocabulary.uid,
      this.props.repetition,
      practiceSide,
      this.props.furiganaToggled
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

    const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
      practiceSide,
      eValue,
      jValue,
      eLabel,
      jLabel
    );

    /** English showing, menu showBareKanji enabled, this terms furigana disabled */
    const showBareKanji =
      practiceSide === true &&
      this.props.showBareKanji === true &&
      this.props.repetition[vocabulary.uid]?.f === false;

    let sayObj = vocabulary;
    if (JapaneseText.parse(vocabulary).isNaAdj()) {
      const naFlip = this.state.naFlip;
      const naAdj = JapaneseText.parse(vocabulary).append(naFlip && "な");

      sayObj = {
        ...vocabulary,
        japanese: naAdj.toString(),
        pronounce: vocabulary.pronounce && naAdj.getPronunciation(),
        form: naFlip,
      };
    }

    const audioWords = this.props.practiceSide
      ? { tl: "en", q: vocabulary.english, uid: vocabulary.uid + ".en" }
      : {
          tl: this.props.practiceSide ? "en" : "ja",
          q: audioPronunciation(sayObj),
          uid: getCacheUID(sayObj),
        };

    const playButton = (
      <AudioItem
        visible={this.props.swipeThreshold === 0}
        word={audioWords}
        reCache={this.props.reCache}
        onPushedPlay={() => {
          this.setState((s) => ({
            naFlip: s.naFlip ? undefined : "-na",
          }));
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
        >
          {topValue}
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
            if (!showBareKanji) {
              this.setState((state) => ({
                showMeaning: !state.showMeaning,
              }));
            }
          }}
        >
          {this.state.showMeaning || showBareKanji ? bottomValue : bottomLabel}
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
    scrollingDone: !state.settings.global.scrolling,
    swipeThreshold: state.settings.global.swipeThreshold,
    repetition: state.settingsHK.vocabulary.repetition, // TODO: hook + class
    hintEnabled: state.settings.vocabulary.hintEnabled,
    showBareKanji: state.settings.vocabulary.bareKanji,
  };
};

VocabularyMain.propTypes = {
  vocabulary: PropTypes.object.isRequired,
  romajiActive: PropTypes.bool,
  practiceSide: PropTypes.bool,
  reCache: PropTypes.bool,
  scrollingDone: PropTypes.bool,
  played: PropTypes.bool,
  prevPushPlay: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func,
  swipeThreshold: PropTypes.number,
  repetition: PropTypes.object,
  furiganaToggled: PropTypes.func,
  toggleFuriganaSettingHelper: PropTypes.func,
  hintEnabled: PropTypes.bool,
  showHint: PropTypes.bool,
  showBareKanji: PropTypes.bool,
};

export default connect(mapStateToProps, {
  flipVocabularyPracticeSide,
  furiganaToggled,
})(VocabularyMain);
