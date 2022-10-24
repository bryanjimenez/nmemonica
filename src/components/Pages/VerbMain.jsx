import React, { Component } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { JapaneseVerb } from "../../helper/JapaneseVerb";
import AudioItem from "../Form/AudioItem";
import Sizable from "../Form/Sizable";
import { connect } from "react-redux";
import { pushedPlay, setPreviousWord } from "../../actions/vocabularyAct";
import { setShownForm } from "../../actions/verbsAct";
import {
  AUTOPLAY_JP_EN,
  AUTOPLAY_OFF,
  flipVocabularyPracticeSide,
  toggleFurigana,
} from "../../actions/settingsAct";
import {
  audioWordsHelper,
  englishLabel,
  getVerbFormsArray,
  japaneseLabel,
  toggleFuriganaSettingHelper,
  labelPlacementHelper,
  verbToTargetForm,
  getEnglishHint,
} from "../../helper/gameHelper";
import { furiganaHintBuilder } from "../../helper/kanjiHelper";
import { kanaHintBuilder } from "../../helper/kanaHelper";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").VerbFormArray} VerbFormArray
 * @typedef {import("../../typings/raw").FuriganaToggleMap} FuriganaToggleMap
 * @typedef {import("../../helper/JapaneseText").JapaneseText} JapaneseText
 */

/**
 * @typedef {{
 * showMeaning: boolean,
 * showRomaji: boolean,
 * prevVocab: RawVocabulary,
 * audioPlay: boolean,
 * prevPlayed: boolean,
 * }} VerbMainState
 */

/**
 * @typedef {{
 * verb: RawVocabulary,
 * reCache: boolean,
 * autoPlay: number,
 * practiceSide: boolean,
 * romajiActive: boolean,
 * scrollingDone: boolean,
 * prevTerm: RawVocabulary,
 * setPreviousWord: function,
 * played: boolean,
 * pushedPlay: function,
 * setShownForm: function,
 * verbForm: string,
 * prevPushPlay: boolean,
 * flipVocabularyPracticeSide: function,
 * touchSwipe: boolean,
 * linkToOtherTerm: function,
 * furigana: FuriganaToggleMap,
 * toggleFurigana: function,
 * toggleFuriganaSettingHelper: function,
 * verbColSplit: number,
 * verbFormsOrder: string[],
 * hintEnabled: boolean,
 * showHint: boolean,
 * loopPlayBtn?: JSX.Element,
 * }} VerbMainProps
 */

class VerbMain extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {VerbMainState} */
    this.state = {
      showMeaning: false,
      showRomaji: false,
      prevVocab: this.props.prevTerm,
      audioPlay: true,
      prevPlayed: this.props.prevPushPlay,
    };

    /** @type {VerbMainProps} */
    this.props;

    this.buildTenseElement = this.buildTenseElement.bind(this);
    this.getVerbLabelItems = this.getVerbLabelItems.bind(this);
    this.splitVerbFormsToColumns = this.splitVerbFormsToColumns.bind(this);
  }

  componentDidMount() {
    if (this.props.verbForm !== "dictionary") {
      const thisVerb = verbToTargetForm(this.props.verb, this.props.verbForm);

      // lastVerb to prevent verb-form loss between transition v->nv
      const lastVerb = {
        ...this.props.verb,
        japanese: thisVerb.toString(),
        pronounce: this.props.verb.pronounce && thisVerb.getPronunciation(),
        form: this.props.verbForm,
      };
      this.props.setPreviousWord({ lastVerb });
    }
  }

  /**
   * @param {VerbMainProps} nextProps
   * @param {VerbMainState} nextState
   */
  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.state.prevVocab !== undefined &&
      this.state.audioPlay !== nextState.audioPlay &&
      nextState.audioPlay === false
    ) {
      return false;
    }

    return true;
  }

  /**
   * @param {VerbMainProps} prevProps
   */
  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.verb != prevProps.verb) {
      // verb change
      const prevVerb = verbToTargetForm(prevProps.verb, this.props.verbForm);
      const thisVerb = verbToTargetForm(this.props.verb, this.props.verbForm);

      const prevVocab = {
        ...prevProps.verb,
        japanese: prevVerb.toString(),
        pronounce: prevProps.verb.pronounce && prevVerb.getPronunciation(),
        form: this.props.verbForm,
      };

      // lastVerb to prevent verb-form loss between transition v->nv
      const lastVerb = {
        ...this.props.verb,
        japanese: thisVerb.toString(),
        pronounce: this.props.verb.pronounce && thisVerb.getPronunciation(),
        form: this.props.verbForm,
      };
      this.props.setPreviousWord({ ...prevVocab, lastVerb }).then(() => {
        this.setState({
          showMeaning: false,
          showRomaji: false,
          prevVocab,
          audioPlay: true,
          prevPlayed: this.props.prevPushPlay,
        });
      });
    }

    if (this.props.verbForm !== prevProps.verbForm) {
      // verb form change
      const thisVerb = verbToTargetForm(this.props.verb, this.props.verbForm);

      const prevVocab = {
        ...this.props.verb,
        japanese: thisVerb.toString(),
        pronounce: this.props.verb.pronounce && thisVerb.getPronunciation(),
        form: this.props.verbForm,
      };

      this.props.setPreviousWord(prevVocab).then(() => {
        this.setState({ prevVocab });
      });
    }

    if (this.state.audioPlay) {
      this.setState({
        audioPlay: false,
      });
    }
  }

  /**
   * @param {number} key
   * @param {VerbFormArray} tense
   */
  buildTenseElement(key, tense) {
    const columnClass = classNames({
      "pt-3 pe-sm-3 flex-shrink-1 d-flex flex-column justify-content-around text-nowrap": true,
      "text-end": key !== 0,
    });

    const tenseRows = tense.map((t, i) => {
      const tenseClass = classNames({
        clickable: true,
        // "font-weight-bold": this.props.verbForm === t.t,
      });

      const braketClass = classNames({
        "transparent-color": this.props.verbForm === t.name,
      });

      return (
        <div
          className={tenseClass}
          key={i}
          onClick={() => {
            if (this.props.verbForm === t.name) {
              this.props.setShownForm("dictionary");
            } else {
              this.props.setShownForm(t.name);
            }
          }}
        >
          <span className={braketClass}>[</span>
          <span>{t.name}</span>
          <span className={braketClass}>]</span>
        </div>
      );
    });

    return (
      <div key={key} className={columnClass}>
        {tenseRows}
      </div>
    );
  }

  /**
   * @param {VerbFormArray} verbForms
   */
  getSplitIdx(verbForms) {
    const middle =
      Math.trunc(verbForms.length / 2) + (verbForms.length % 2 === 0 ? 0 : 1);

    const rightShift = middle - this.props.verbColSplit;
    const splitIdx = Math.trunc(verbForms.length / 2) + rightShift;

    return splitIdx;
  }
  /**
   * splits the verb forms into two columns
   * @param {VerbFormArray} verbForms
   * @returns an object containing two columns
   */
  splitVerbFormsToColumns(verbForms) {
    const splitIdx = this.getSplitIdx(verbForms);

    const t1 = verbForms.slice(0, splitIdx);
    const t2 = verbForms.slice(splitIdx);
    return { t1, t2 };
  }

  /**
   * @param {VerbFormArray} verbForms
   * @param {string} theForm the form to filter by
   */
  getVerbLabelItems(verbForms, theForm) {
    const romaji = this.props.verb.romaji || ".";
    const splitIdx = this.getSplitIdx(verbForms);

    const formResult = verbForms.find((form) => form.name === theForm);
    /** @type {JapaneseText} */
    const japaneseObj = formResult
      ? formResult.value
      : verbForms[splitIdx].value;

    const furiganaToggable = toggleFuriganaSettingHelper(
      this.props.practiceSide,
      this.props.verb.uid,
      this.props.furigana,
      this.props.toggleFurigana
    );

    let inJapanese = japaneseObj.toHTML(furiganaToggable);
    let inEnglish = this.props.verb.english;

    return { inJapanese, inEnglish, romaji, japaneseObj };
  }

  render() {
    const verb = this.props.verb;
    const verbForms = getVerbFormsArray(verb, this.props.verbFormsOrder);
    const { t1, t2 } = this.splitVerbFormsToColumns(verbForms);
    const { inJapanese, inEnglish, romaji, japaneseObj } =
      this.getVerbLabelItems(verbForms, this.props.verbForm);

    const practiceSide = this.props.practiceSide;
    let eLabel = <span>{"[English]"}</span>;
    let jLabel = <Sizable largeValue="[Japanese]" smallValue="[J]" />;

    const vObj = JapaneseVerb.parse(verb);
    const jValue = japaneseLabel(
      practiceSide,
      vObj,
      inJapanese,
      this.props.linkToOtherTerm
    );

    const eValue = englishLabel(
      practiceSide,
      vObj,
      inEnglish,
      this.props.linkToOtherTerm
    );

    if (this.props.hintEnabled && this.props.showHint) {
      if (practiceSide) {
        const jHint = japaneseObj.getHint(
          kanaHintBuilder,
          furiganaHintBuilder,
          3,
          1
        );
        jLabel = jHint || jLabel;
      } else {
        const eHint = getEnglishHint(verb);
        eLabel = eHint || eLabel;
      }
    }

    const { topValue, topLabel, bottomValue, bottomLabel } =
      labelPlacementHelper(practiceSide, eValue, jValue, eLabel, jLabel);

    const topStyle = { fontSize: !practiceSide ? "2.5rem" : "1rem" };
    const btmStyle = { fontSize: practiceSide ? "2.5rem" : "1rem" };

    const verbJapanese = {
      ...verb,
      japanese: japaneseObj.toString(),
      pronounce: verb.pronounce && japaneseObj.getPronunciation(),
      form: this.props.verbForm,
    };

    const audioWords = audioWordsHelper(
      this.state.prevPlayed,
      this.props.autoPlay,
      verbJapanese,
      this.state.prevVocab
    );

    const playButton = this.props.loopPlayBtn || (
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
            this.setState({
              audioPlay: false,
            });
            this.props.pushedPlay(true);
          }
        }}
        onAutoPlayDone={() => {
          if (!this.state.prevVocab) {
            // this is the first verb let's set it for next term
            const thisVerb = verbToTargetForm(
              this.props.verb,
              this.props.verbForm
            );
            const firstVerb = {
              ...this.props.verb,
              japanese: thisVerb.toString(),
              pronounce:
                this.props.verb.pronounce && thisVerb.getPronunciation(),
              form: this.props.verbForm,
            };
            this.props.setPreviousWord({ ...firstVerb });
          }
          this.props.pushedPlay(false);
        }}
      />
    );

    return [
      this.buildTenseElement(0, t1),
      <div
        key={1}
        className="pt-3 w-100 d-flex flex-column justify-content-around text-center"
      >
        <div>
          <span
            className="clickable"
            style={topStyle}
            onClick={
              this.props.autoPlay
                ? () => this.props.flipVocabularyPracticeSide()
                : undefined
            }
          >
            {this.props.autoPlay && practiceSide ? topLabel : topValue}
          </span>
        </div>

        {this.props.romajiActive && romaji && (
          <div>
            <span
              className="clickable loop-no-interrupt"
              onClick={() => {
                this.setState((/** @type {VerbMainState} */ state) => ({
                  showRomaji: !state.showRomaji,
                }));
              }}
            >
              {this.state.showRomaji ? romaji : "[romaji]"}
            </span>
          </div>
        )}

        <div>
          <span
            className="clickable loop-no-interrupt"
            style={btmStyle}
            onClick={() => {
              if (this.props.autoPlay) {
                this.props.flipVocabularyPracticeSide();
              } else {
                this.setState((/** @type {VerbMainState} */ state) => ({
                  showMeaning: !state.showMeaning,
                }));
              }
            }}
          >
            {(this.props.autoPlay && !practiceSide) ||
            (!this.props.autoPlay && this.state.showMeaning)
              ? bottomValue
              : bottomLabel}
          </span>
        </div>
        <div className="d-flex justify-content-center">{playButton}</div>
      </div>,

      this.buildTenseElement(2, t2),
    ];
  }
}
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    romajiActive: state.settings.vocabulary.romaji,
    autoPlay: state.settings.vocabulary.autoPlay,
    scrollingDone: !state.settings.global.scrolling,
    prevTerm: state.vocabulary.previous,
    prevPushPlay: state.vocabulary.pushedPlay,
    verbForm: state.vocabulary.verbForm,
    touchSwipe: state.settings.global.touchSwipe,
    furigana: state.settings.vocabulary.repetition,
    verbColSplit: state.settings.vocabulary.verbColSplit,
    verbFormsOrder: state.settings.vocabulary.verbFormsOrder,
    hintEnabled: state.settings.vocabulary.hintEnabled,
  };
};

VerbMain.propTypes = {
  verb: PropTypes.object.isRequired,
  reCache: PropTypes.bool,
  autoPlay: PropTypes.number,
  practiceSide: PropTypes.bool,
  romajiActive: PropTypes.bool,
  scrollingDone: PropTypes.bool,
  prevTerm: PropTypes.shape({
    japanese: PropTypes.string.isRequired,
    english: PropTypes.string.isRequired,
    uid: PropTypes.string.isRequired,
  }),
  setPreviousWord: PropTypes.func,
  played: PropTypes.bool,
  pushedPlay: PropTypes.func,
  setShownForm: PropTypes.func,
  verbForm: PropTypes.string,
  prevPushPlay: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func,
  touchSwipe: PropTypes.bool,
  linkToOtherTerm: PropTypes.func,
  furigana: PropTypes.object,
  toggleFurigana: PropTypes.func,
  toggleFuriganaSettingHelper: PropTypes.func,
  verbColSplit: PropTypes.number,
  verbFormsOrder: PropTypes.array,
  hintEnabled: PropTypes.bool,
  showHint: PropTypes.bool,
  loopPlayBtn: PropTypes.object,
};

export default connect(mapStateToProps, {
  setPreviousWord,
  pushedPlay,
  setShownForm,
  flipVocabularyPracticeSide,
  toggleFurigana,
})(VerbMain);
