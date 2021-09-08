import React, { Component } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { JapaneseVerb } from "../../helper/JapaneseVerb";
import { audioPronunciation } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";
import { connect } from "react-redux";
import { pushedPlay, setPreviousWord } from "../../actions/vocabularyAct";

class VerbMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMeaning: false,
      showRomaji: false,
      shownForm: this.props.verbForm ? "masu" : "dictionary",
      prevVocab: this.props.prevTerm,
      audioPlay: true,
    };

    this.buildTenseElement = this.buildTenseElement.bind(this);
    this.getVerbLabelItems = this.getVerbLabelItems.bind(this);
    this.splitVerbFormsToColumns = this.splitVerbFormsToColumns.bind(this);
    this.getVerbFormsArray = this.getVerbFormsArray.bind(this);
    this.getVerbForm = this.getVerbForm.bind(this);
  }

  componentDidMount() {
    this.setState({ audioPlay: false });
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

  componentDidUpdate(prevProps, prevState) {
    if (this.props.verb != prevProps.verb) {
      // verb change
      const prevVerb = this.getVerbForm(prevProps.verb, this.state.shownForm);
      const thisVerb = this.getVerbForm(this.props.verb, this.state.shownForm);

      const prevVocab = {
        japanese: prevVerb.getSpelling(),
        uid: prevProps.verb.uid,
      };

      if (this.state.shownForm !== "dictionary") {
        // lastVerb to prevent verb-form loss between transition v->nv
        const lastVerb = { japanese: thisVerb.getSpelling() };
        this.props.setPreviousWord({ ...prevVocab, lastVerb });
      }

      this.setState({
        showMeaning: false,
        showRomaji: false,
        prevVocab,
        audioPlay: true,
      });
    }

    if (this.state.shownForm !== prevState.shownForm) {
      // verb form change
      const thisVerb = this.getVerbForm(this.props.verb, this.state.shownForm);

      const prevVocab = {
        japanese: thisVerb.getSpelling(),
        uid: this.props.verb.uid,
      };

      this.props.setPreviousWord(prevVocab);
      this.setState({ prevVocab });
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
        "font-weight-bold": this.state.shownForm === t.t,
      });

      return (
        <div
          className={tenseClass}
          key={i}
          onClick={() => {
            this.setState({ shownForm: t.t });
          }}
        >
          {this.state.shownForm === t.t ? t.t : "[" + t.t + "]"}
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
    const dictionaryForm = JapaneseVerb.parse(verb.japanese);

    return [
      { t: "masu", j: dictionaryForm.masuForm() },
      { t: "mashou", j: dictionaryForm.mashouForm() },
      { t: "dictionary", j: dictionaryForm },
      { t: "te_form", j: dictionaryForm.teForm() },
      { t: "ta_form", j: dictionaryForm.taForm() },
    ];
  }

  getVerbForm(verb, form) {
    const dictionaryForm = JapaneseVerb.parse(verb.japanese);

    switch (form) {
      case "masu":
        return dictionaryForm.masuForm();
      case "mashou":
        return dictionaryForm.mashouForm();
      case "dictionary":
        return dictionaryForm;
      case "te_form":
        return dictionaryForm.teForm();
      case "ta_form":
        return dictionaryForm.taForm();
    }
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
      this.getVerbLabelItems(verbForms, this.state.shownForm);

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

    const topStyle = { fontSize: !this.props.practiceSide ? "2.5rem" : "1rem" };
    const btmStyle = { fontSize: this.props.practiceSide ? "2.5rem" : "1rem" };

    let audioWords = [
      audioPronunciation({
        japanese: japanesePhrase.getSpelling(),
      }),
      verb.english.toString(),
    ];

    if (this.state.prevVocab !== undefined && this.props.played === false) {
      audioWords = [...audioWords, audioPronunciation(this.state.prevVocab)];
    }

    return [
      <div
        key={0}
        className="pt-3 pl-3 flex-shrink-1 d-flex flex-column justify-content-around"
      >
        {this.buildTenseElement(t1)}
      </div>,
      <div
        key={1}
        className="pt-3 w-100 d-flex flex-column justify-content-around text-center"
      >
        {this.props.autoPlay !== 0 && this.props.practiceSide ? (
          <div
            style={topStyle}
            onClick={() => {
              this.setState((state) => ({ showEng: !state.showEng }));
            }}
          >
            {this.state.showEng ? shownSide : shownCaption}
          </div>
        ) : (
          <div style={topStyle}>{shownSide}</div>
        )}

        {this.props.romajiActive && (
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
            this.setState((state) => ({
              showMeaning: !state.showMeaning,
            }));
          }}
        >
          {this.state.showMeaning ? hiddenSide : hiddenCaption}
        </div>
        <AudioItem
          word={audioWords}
          autoPlay={
            !this.props.scrollingDone || !this.state.audioPlay
              ? 0
              : this.props.autoPlay
          }
          onPushedPlay={() => {
            this.props.pushedPlay(true);
          }}
          onAutoPlayDone={() => {
            this.props.pushedPlay(false);
          }}
        />
      </div>,
      <div
        key={2}
        className="pt-3 pr-3 text-end flex-shrink-1 d-flex flex-column justify-content-around"
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
    played: state.vocabulary.pushedPlay,
  };
};

VerbMain.propTypes = {
  verb: PropTypes.object.isRequired,
  verbForm: PropTypes.bool,
  autoPlay: PropTypes.number,
  practiceSide: PropTypes.bool,
  romajiActive: PropTypes.bool,
  scrollingDone: PropTypes.bool,
  prevTerm: PropTypes.object,
  setPreviousWord: PropTypes.func,
  played: PropTypes.bool,
  pushedPlay: PropTypes.func,
};

export default connect(mapStateToProps, { setPreviousWord, pushedPlay })(
  VerbMain
);
