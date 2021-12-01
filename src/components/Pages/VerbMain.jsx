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
} from "../../actions/settingsAct";
import {
  audioWordsHelper,
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
    this.getVerbFormsArray = this.getVerbFormsArray.bind(this);
    this.getVerbForm = this.getVerbForm.bind(this);
  }

  componentDidMount() {
    if (this.props.verbForm !== "dictionary") {
      const thisVerb = this.getVerbForm(this.props.verb, this.props.verbForm);

      // lastVerb to prevent verb-form loss between transition v->nv
      const lastVerb = {
        japanese: thisVerb.getSpelling(),
        english: this.props.verb.english,
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
      const prevVerb = this.getVerbForm(prevProps.verb, this.props.verbForm);
      const thisVerb = this.getVerbForm(this.props.verb, this.props.verbForm);

      const prevVocab = {
        japanese: prevVerb.getSpelling(),
        english: prevProps.verb.english,
        uid: prevProps.verb.uid,
      };

      // lastVerb to prevent verb-form loss between transition v->nv
      const lastVerb = {
        japanese: thisVerb.getSpelling(),
        english: this.props.verb.english,
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
      const thisVerb = this.getVerbForm(this.props.verb, this.props.verbForm);

      const prevVocab = {
        japanese: thisVerb.getSpelling(),
        english: this.props.verb.english,
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
   *
   * @param {*} verb
   * @returns {Array} of verb forms objects
   */
  getVerbFormsArray(verb) {
    const dictionaryForm = JapaneseVerb.parse(verb);

    return [
      { t: "masu", j: dictionaryForm.masuForm() },
      { t: "mashou", j: dictionaryForm.mashouForm() },
      { t: "dictionary", j: dictionaryForm },
      { t: "te_form", j: dictionaryForm.teForm() },
      { t: "ta_form", j: dictionaryForm.taForm() },
    ];
  }

  getVerbForm(verb, form) {
    const dictionaryForm = JapaneseVerb.parse(verb);
    return verbToTargetForm(dictionaryForm, form);
  }

  /**
   * splits the verb forms into two columns
   * @param {*} verbForms
   * @returns {Object} an object containing two columns
   */
  splitVerbFormsToColumns(verbForms) {
    const rightShift = verbForms.length % 2 === 0 ? 1 : 0;
    const splitIdx = Math.trunc(verbForms.length / 2) + rightShift;

    const t1 = verbForms.slice(0, splitIdx);
    const t2 = verbForms.slice(splitIdx, verbForms.length);
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
    const japanesePhrase = formResult ? formResult.j : verbForms.dictionary;

    let inJapanese = japanesePhrase.toHTML();
    let inEnglish = this.props.verb.english;

    return { inJapanese, inEnglish, romaji, japanesePhrase };
  }

  render() {
    const verb = this.props.verb;
    const verbForms = this.getVerbFormsArray(verb);
    const { t1, t2 } = this.splitVerbFormsToColumns(verbForms);
    const { inJapanese, inEnglish, romaji, japanesePhrase } =
      this.getVerbLabelItems(verbForms, this.props.verbForm);

    const eLabel = "[English]";
    const jLabel = <Sizable largeValue="[Japanese]" smallValue="[J]" />;

    const v = JapaneseVerb.parse(verb);
    const showAsterix = v.isExceptionVerb() || v.getVerbClass() === 3;
    const inJapanese2 = showAsterix ? (
      <span>
        {inJapanese}
        <span> *</span>
      </span>
    ) : (
      inJapanese
    );

    const { shownValue, hiddenValue, shownLabel, hiddenLabel } =
      valueLabelHelper(
        this.props.practiceSide,
        inEnglish,
        inJapanese2,
        eLabel,
        jLabel
      );

    const topStyle = { fontSize: !this.props.practiceSide ? "2.5rem" : "1rem" };
    const btmStyle = { fontSize: this.props.practiceSide ? "2.5rem" : "1rem" };

    const verbJapanese = {
      japanese: japanesePhrase.getSpelling(),
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
        <div
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
        </div>

        {this.props.romajiActive && romaji && (
          <div
            className="clickable"
            onClick={() => {
              this.setState((state) => ({
                showRomaji: !state.showRomaji,
              }));
            }}
          >
            {this.state.showRomaji ? romaji : "[romaji]"}
          </div>
        )}
        <div
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
        </div>
        <AudioItem
          visible={!this.props.touchSwipe}
          word={audioWords}
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
              const thisVerb = this.getVerbForm(
                this.props.verb,
                this.props.verbForm
              );
              const firstVerb = {
                japanese: thisVerb.getSpelling(),
                english: this.props.verb.english,
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
  };
};

VerbMain.propTypes = {
  verb: PropTypes.object.isRequired,
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
};

export default connect(mapStateToProps, {
  setPreviousWord,
  pushedPlay,
  setShownForm,
  flipVocabularyPracticeSide,
})(VerbMain);
