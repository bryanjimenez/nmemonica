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
  valueLabelHelper,
  verbToTargetForm,
} from "../../helper/gameHelper";

class VerbMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMeaning: false,
      showRomaji: false,
      prevVocab: this.props.prevTerm,
      audioPlay: true,
      prevPlayed: this.props.prevPushPlay,
    };

    this.buildTenseElement = this.buildTenseElement.bind(this);
    this.getVerbLabelItems = this.getVerbLabelItems.bind(this);
    this.splitVerbFormsToColumns = this.splitVerbFormsToColumns.bind(this);
  }

  componentDidMount() {
    if (this.props.verbForm !== "dictionary") {
      const thisVerb = verbToTargetForm(this.props.verb, this.props.verbForm);

      // lastVerb to prevent verb-form loss between transition v->nv
      const lastVerb = {
        japanese: thisVerb.toString(),
        english: this.props.verb.english,
        pronounce: this.props.verb.pronounce && thisVerb.getPronunciation(),
      };
      this.props.setPreviousWord({ lastVerb });
    }
  }

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

  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.verb != prevProps.verb) {
      // verb change
      const prevVerb = verbToTargetForm(prevProps.verb, this.props.verbForm);
      const thisVerb = verbToTargetForm(this.props.verb, this.props.verbForm);

      const prevVocab = {
        japanese: prevVerb.toString(),
        english: prevProps.verb.english,
        pronounce: prevProps.verb.pronounce && prevVerb.getPronunciation(),
        uid: prevProps.verb.uid,
      };

      // lastVerb to prevent verb-form loss between transition v->nv
      const lastVerb = {
        japanese: thisVerb.toString(),
        english: this.props.verb.english,
        pronounce: this.props.verb.pronounce && thisVerb.getPronunciation(),
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
        japanese: thisVerb.toString(),
        english: this.props.verb.english,
        pronounce: this.props.verb.pronounce && thisVerb.getPronunciation(),
        uid: this.props.verb.uid,
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

  buildTenseElement(tense) {
    return tense.map((t, i) => {
      const tenseClass = classNames({
        clickable: true,
        "font-weight-bold": this.props.verbForm === t.t,
      });

      return (
        <div
          className={tenseClass}
          key={i}
          onClick={() => {
            this.props.setShownForm(t.t);
          }}
        >
          {this.props.verbForm === t.t ? " " + t.t + " " : "[" + t.t + "]"}
        </div>
      );
    });
  }

  /**
   * splits the verb forms into two columns
   * @param {*} verbForms
   * @returns {Object} an object containing two columns
   */
  splitVerbFormsToColumns(verbForms) {
    const middle =
      Math.trunc(verbForms.length / 2) + (verbForms.length % 2 === 0 ? 0 : 1);

    const rightShift = middle - this.props.verbColSplit;
    const splitIdx = Math.trunc(verbForms.length / 2) + rightShift;

    const t1 = verbForms.slice(0, splitIdx);
    const t2 = verbForms.slice(splitIdx);
    return { t1, t2 };
  }

  /**
   *
   * @param {Array} verbForms
   * @param {String} theForm the form to filter by
   * @returns {{ inJapanese:HTMLElement, inEnglish:String, romaji:String, japanesePhrase }}
   */
  getVerbLabelItems(verbForms, theForm) {
    const romaji = this.props.verb.romaji || ".";

    const formResult = verbForms.find((form) => form.t === theForm);
    const japanesePhrase = formResult
      ? formResult.j
      : verbForms.find((form) => form.t === "dictionary").j;

    const furiganaToggable = toggleFuriganaSettingHelper(
      this.props.practiceSide,
      this.props.verb.uid,
      this.props.furigana,
      this.props.toggleFurigana
    );

    let inJapanese = japanesePhrase.toHTML(furiganaToggable);
    let inEnglish = this.props.verb.english;

    return { inJapanese, inEnglish, romaji, japanesePhrase };
  }

  render() {
    const verb = this.props.verb;
    const verbForms = getVerbFormsArray(verb);
    const { t1, t2 } = this.splitVerbFormsToColumns(verbForms);
    const { inJapanese, inEnglish, romaji, japanesePhrase } =
      this.getVerbLabelItems(verbForms, this.props.verbForm);

    const eLabel = "[English]";
    const jLabel = <Sizable largeValue="[Japanese]" smallValue="[J]" />;

    const v = JapaneseVerb.parse(verb);
    const inJapaneseLbl = japaneseLabel(
      this.props.practiceSide,
      v,
      inJapanese,
      this.props.linkToOtherTerm
    );

    const inEnglishLbl = englishLabel(
      this.props.practiceSide,
      v,
      inEnglish,
      this.props.linkToOtherTerm
    );

    const { shownValue, hiddenValue, shownLabel, hiddenLabel } =
      valueLabelHelper(
        this.props.practiceSide,
        inEnglishLbl,
        inJapaneseLbl,
        eLabel,
        jLabel
      );

    const topStyle = { fontSize: !this.props.practiceSide ? "2.5rem" : "1rem" };
    const btmStyle = { fontSize: this.props.practiceSide ? "2.5rem" : "1rem" };

    const verbJapanese = {
      japanese: japanesePhrase.toString(),
      pronounce: verb.pronounce && japanesePhrase.getPronunciation(),
    };

    const audioWords = audioWordsHelper(
      this.state.prevPlayed,
      this.props.autoPlay,
      verbJapanese,
      verb.english,
      this.state.prevVocab
    );

    return [
      <div
        key={0}
        className="pt-3 pl-sm-3 flex-shrink-1 d-flex flex-column justify-content-around"
      >
        {this.buildTenseElement(t1)}
      </div>,
      <div
        key={1}
        className="pt-3 w-100 d-flex flex-column justify-content-around text-center"
      >
        <div>
          <span
            className="clickable"
            style={topStyle}
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
          </span>
        </div>

        {this.props.romajiActive && romaji && (
          <div>
            <span
              className="clickable"
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

        <div>
          <span
            className="clickable"
            style={btmStyle}
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
            {(this.props.autoPlay && !this.props.practiceSide) ||
            (!this.props.autoPlay && this.state.showMeaning)
              ? hiddenValue
              : hiddenLabel}
          </span>
        </div>
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
                japanese: thisVerb.toString(),
                english: this.props.verb.english,
                pronounce:
                  this.props.verb.pronounce && thisVerb.getPronunciation(),
              };
              this.props.setPreviousWord({ ...firstVerb });
            }
            this.props.pushedPlay(false);
          }}
        />
      </div>,
      <div
        key={2}
        className="pt-3 pr-sm-3 text-end flex-shrink-1 d-flex flex-column justify-content-around"
      >
        {this.buildTenseElement(t2)}
      </div>,
    ];
  }
}

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
};

export default connect(mapStateToProps, {
  setPreviousWord,
  pushedPlay,
  setShownForm,
  flipVocabularyPracticeSide,
  toggleFurigana,
})(VerbMain);
