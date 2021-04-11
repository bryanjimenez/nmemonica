import React, { Component } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { JapaneseVerb } from "../../helper/JapaneseVerb";
import { audioPronunciation } from "../../helper/JapaneseText";
import AudioItem from "../Form/AudioItem";
import { connect } from "react-redux";

class VerbMain extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMeaning: false,
      showRomaji: false,
      shownForm: this.props.verbForm ? "masu" : "dictionary",
    };

    this.buildTenseElement = this.buildTenseElement.bind(this);
  }

  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.verb != prevProps.verb) {
      this.setState({
        showMeaning: false,
        showRomaji: false,
        shownForm: this.props.verbForm ? "masu" : "dictionary",
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

  render() {
    const verb = this.props.verb;

    const dictionaryForm = JapaneseVerb.parse(verb.japanese);

    const verbForms = [
      { t: "masu", j: dictionaryForm.masuForm() },
      { t: "mashou", j: dictionaryForm.mashouForm() },
      { t: "dictionary", j: dictionaryForm },
      { t: "te_form", j: dictionaryForm.teForm() },
      { t: "ta_form", j: dictionaryForm.taForm() },
    ];

    const rightShift = verbForms.length % 2 === 0 ? 1 : 0;
    const splitIdx = Math.trunc(verbForms.length / 2) + rightShift;

    const t1 = verbForms.slice(0, splitIdx);
    const t2 = verbForms.slice(splitIdx, verbForms.length);

    const romaji = verb.romaji || ".";

    const formResult = verbForms.filter(
      (form) => form.t === this.state.shownForm
    );
    const japanesePhrase =
      formResult.length === 1 ? formResult[0].j : dictionaryForm;

    let inJapanese = japanesePhrase.toHTML();
    let inEnglish = verb.english;

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
        {this.props.autoPlay && this.props.practiceSide ? (
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
          word={audioPronunciation({
            japanese: japanesePhrase.toString(),
            pronounce: undefined,
          })}
          autoPlay={this.props.scrollingDone && this.props.autoPlay}
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
    practiceSide: state.settings.verbs.practiceSide,
    romajiActive: state.settings.verbs.romaji,
    autoPlay: state.settings.vocabulary.autoPlay,
    scrollingDone: !state.settings.global.scrolling,
  };
};

VerbMain.propTypes = {
  verb: PropTypes.object.isRequired,
  verbForm: PropTypes.bool,
  autoPlay: PropTypes.bool,
  practiceSide: PropTypes.bool,
  romajiActive: PropTypes.bool,
  scrollingDone: PropTypes.bool,
};

export default connect(mapStateToProps, {})(VerbMain);
