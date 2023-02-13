import React, { Component } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { JapaneseVerb } from "../../helper/JapaneseVerb";
import AudioItem from "../Form/AudioItem";
import Sizable from "../Form/Sizable";
import { connect } from "react-redux";
import { setShownForm } from "../../actions/verbsAct";
import {
  flipVocabularyPracticeSide,
  toggleFurigana,
} from "../../actions/settingsAct";
import {
  englishLabel,
  getVerbFormsArray,
  japaneseLabel,
  toggleFuriganaSettingHelper,
  labelPlacementHelper,
  getEnglishHint,
  getJapaneseHint,
  getCacheUID,
} from "../../helper/gameHelper";
import { audioPronunciation } from "../../helper/JapaneseText";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").VerbFormArray} VerbFormArray
 * @typedef {import("../../typings/raw").FuriganaToggleMap} FuriganaToggleMap
 * @typedef {import("../../helper/JapaneseText").JapaneseText} JapaneseText
 */

/**
 * @typedef {Object} VerbMainState
 * @property {boolean} showMeaning
 * @property {boolean} showRomaji
 */

/**
 * @typedef {Object} VerbMainProps
 * @property {RawVocabulary} verb
 * @property {boolean} reCache
 * @property {boolean} practiceSide
 * @property {boolean} romajiActive
 * @property {boolean} scrollingDone
 * @property {boolean} played
 * @property {typeof setShownForm} setShownForm
 * @property {string} verbForm
 * @property {function} flipVocabularyPracticeSide
 * @property {number} swipeThreshold
 * @property {function} linkToOtherTerm
 * @property {FuriganaToggleMap} furigana
 * @property {function} toggleFurigana
 * @property {function} toggleFuriganaSettingHelper
 * @property {number} verbColSplit
 * @property {string[]} verbFormsOrder
 * @property {boolean} hintEnabled
 * @property {boolean} showHint
 */

class VerbMain extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {VerbMainState} */
    this.state = {
      showMeaning: false,
      showRomaji: false,
    };

    /** @type {VerbMainProps} */
    this.props;

    /** @type {import("../../typings/raw").SetState<VerbMainState>} */
    this.setState;

    this.buildTenseElement = this.buildTenseElement.bind(this);
    this.getVerbLabelItems = this.getVerbLabelItems.bind(this);
    this.splitVerbFormsToColumns = this.splitVerbFormsToColumns.bind(this);
  }

  /**
   * @param {VerbMainProps} prevProps
   */
  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.verb != prevProps.verb) {
      this.setState({
        showMeaning: false,
        showRomaji: false,
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
      this.props.verb.uid,
      this.props.furigana,
      this.props.practiceSide,
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
    let jLabel = (
      <Sizable
        fragment={true}
        breakPoint="sm"
        smallValue="[J]"
        largeValue="[Japanese]"
      />
    );

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
        const jHint = getJapaneseHint(japaneseObj);
        jLabel = jHint || jLabel;
      } else {
        const eHint = getEnglishHint(verb);
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

    const verbJapanese = {
      ...verb,
      japanese: japaneseObj.toString(),
      pronounce: verb.pronounce && japaneseObj.getPronunciation(),
      form: this.props.verbForm,
    };

    const audioWords = this.props.practiceSide
      ? { tl: "en", q: verbJapanese.english, uid: verbJapanese.uid + ".en" }
      : {
          tl: "ja",
          q: audioPronunciation(verbJapanese),
          uid: getCacheUID(verbJapanese),
        };

    const playButton = (
      <AudioItem
        visible={this.props.swipeThreshold === 0}
        word={audioWords}
        reCache={this.props.reCache}
      />
    );

    return [
      this.buildTenseElement(0, t1),
      <div
        key={1}
        className="pt-3 w-100 d-flex flex-column justify-content-around text-center"
      >
        <Sizable
          breakPoint="md"
          smallClassName={{
            ...(!practiceSide ? { "fs-display-6": true } : { h5: true }),
          }}
          largeClassName={{ "fs-display-6": true }}
        >
          {topValue}
        </Sizable>

        {this.props.romajiActive && romaji && (
          <div>
            <span
              className="clickable loop-no-interrupt"
              onClick={() => {
                this.setState((state) => ({
                  showRomaji: !state.showRomaji,
                }));
              }}
            >
              {this.state.showRomaji ? romaji : "[romaji]"}
            </span>
          </div>
        )}

        <Sizable
          breakPoint="md"
          className={{ "loop-no-interrupt": true }}
          smallClassName={{
            ...(practiceSide ? { "fs-display-6": true } : { h5: true }),
          }}
          largeClassName={{ "fs-display-6": true }}
          onClick={() => {
            this.setState((state) => ({
              showMeaning: !state.showMeaning,
            }));
          }}
        >
          {this.state.showMeaning ? bottomValue : bottomLabel}
        </Sizable>
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
    scrollingDone: !state.settings.global.scrolling,
    verbForm: state.vocabulary.verbForm,
    swipeThreshold: state.settings.global.swipeThreshold,
    furigana: state.settings.vocabulary.repetition,
    verbColSplit: state.settings.vocabulary.verbColSplit,
    verbFormsOrder: state.settings.vocabulary.verbFormsOrder,
    hintEnabled: state.settings.vocabulary.hintEnabled,
  };
};

VerbMain.propTypes = {
  verb: PropTypes.object.isRequired,
  reCache: PropTypes.bool,
  practiceSide: PropTypes.bool,
  romajiActive: PropTypes.bool,
  scrollingDone: PropTypes.bool,
  played: PropTypes.bool,
  setShownForm: PropTypes.func,
  verbForm: PropTypes.string,
  flipVocabularyPracticeSide: PropTypes.func,
  swipeThreshold: PropTypes.number,
  linkToOtherTerm: PropTypes.func,
  furigana: PropTypes.object,
  toggleFurigana: PropTypes.func,
  toggleFuriganaSettingHelper: PropTypes.func,
  verbColSplit: PropTypes.number,
  verbFormsOrder: PropTypes.array,
  hintEnabled: PropTypes.bool,
  showHint: PropTypes.bool,
};

export default connect(mapStateToProps, {
  setShownForm,
  flipVocabularyPracticeSide,
  toggleFurigana,
})(VerbMain);
