import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { audioPronunciation, JapaneseText } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";
import {
  flipVocabularyPracticeSide,
  toggleFurigana,
} from "../../actions/settingsAct";
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

/**
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
 * @property {boolean} romajiActive
 * @property {typeof flipVocabularyPracticeSide} flipVocabularyPracticeSide
 * @property {boolean} practiceSide
 * @property {boolean} scrollingDone
 * @property {number} swipeThreshold
 * @property {any} furigana
 * @property {import("../../actions/settingsAct").toggleFuriganaYield} toggleFurigana
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

    const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
      practiceSide,
      eValue,
      jValue,
      eLabel,
      jLabel
    );

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
            this.setState((state) => ({
              showMeaning: !state.showMeaning,
            }));
          }}
        >
          {this.state.showMeaning ? bottomValue : bottomLabel}
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
    furigana: state.settings.vocabulary.repetition,
    hintEnabled: state.settings.vocabulary.hintEnabled,
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
  furigana: PropTypes.object,
  toggleFurigana: PropTypes.func,
  toggleFuriganaSettingHelper: PropTypes.func,
  hintEnabled: PropTypes.bool,
  showHint: PropTypes.bool,
};

export default connect(mapStateToProps, {
  flipVocabularyPracticeSide,
  toggleFurigana,
})(VocabularyMain);
