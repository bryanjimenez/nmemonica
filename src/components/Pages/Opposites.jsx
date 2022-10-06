import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getOpposites } from "../../actions/oppositesAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { LinearProgress } from "@material-ui/core";

/**
 * @typedef {{english: string, japanese: string, romaji: string, toHTML: function}} RawOpposite
 */

/**
 * @typedef {{
 * getOpposites: function,
 * opposites: [question:RawOpposite, answer:RawOpposite][],
 * qRomaji: boolean,
 * aRomaji: boolean}} OppositesProps
 */

/**
 * @typedef {{
 * selectedIndex: number,
 * showMeaning: boolean,
 * question?: RawOpposite,
 * answer?: RawOpposite,
 * choices: RawOpposite[],
 * incorrect: number[]
 * correct: boolean}} OppositesState
 */

const OppositesMeta = {
  location: "/opposites/",
  label: "Opposites",
};

class Opposites extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {OppositesState} */
    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      question: undefined,
      answer: undefined,
      choices: [],
      incorrect: [],
      correct: false,
    };

    /** @type {OppositesProps} */
    this.props;

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    this.props.getOpposites();
  }

  /**
   * @param {OppositesProps} prevProps
   * @param {OppositesState} prevState
   */
  componentDidUpdate(prevProps, prevState) {
    // console.log("componentDidUpdate");

    if (this.state.selectedIndex != prevState.selectedIndex) {
      // console.log("index");
      this.prepareGame();
    }

    if (
      this.props.opposites &&
      prevProps.opposites &&
      this.props.opposites.length != prevProps.opposites.length
    ) {
      // console.log("getting opposites");
      this.prepareGame();
    } else if (
      this.state.question === undefined &&
      this.state.answer === undefined &&
      this.state.choices.length === 0
    ) {
      // page navigation after initial
      // opposites retrival done
      this.prepareGame();
    }
  }

  prepareGame() {
    if (this.props.opposites.length > 0) {
      // console.log("preparing");
      let [question, answer] = this.props.opposites[this.state.selectedIndex];
      const q = JapaneseText.parse(question);
      const a = JapaneseText.parse(answer);

      question = { ...question, toHTML: () => q.toHTML() };
      answer = { ...answer, toHTML: () => a.toHTML() };

      let choices = [answer];
      let antiHomophones = [answer.romaji, question.romaji];

      while (choices.length < 4) {
        const max = Math.floor(this.props.opposites.length);
        const idx = Math.floor(Math.random() * max);

        const [wrongAnswer1, wrongAnswer2] = this.props.opposites[idx];

        if (
          !antiHomophones.includes(wrongAnswer1.romaji) &&
          !antiHomophones.includes(wrongAnswer2.romaji)
        ) {
          const headsOrTails = Math.floor(Math.random() * 2);

          if (headsOrTails === 0) {
            const w1 = JapaneseText.parse(wrongAnswer1);
            choices = [
              ...choices,
              { ...wrongAnswer1, toHTML: () => w1.toHTML() },
            ];
            antiHomophones = [...antiHomophones, wrongAnswer1.romaji];
          } else {
            const w2 = JapaneseText.parse(wrongAnswer2);
            choices = [
              ...choices,
              { ...wrongAnswer2, toHTML: () => w2.toHTML() },
            ];
            antiHomophones = [...antiHomophones, wrongAnswer2.romaji];
          }
        }
      }

      shuffleArray(choices);

      this.setState({ question, answer, choices });
    }
  }

  /**
   * @param {RawOpposite} answered
   * @param {number} i
   */
  checkAnswer(answered, i) {
    if (answered.japanese === this.state.answer?.japanese) {
      // console.log("RIGHT!");
      this.setState({ correct: true, showMeaning: true });
      setTimeout(this.gotoNext, 500);
    } else {
      // console.log("WRONG");
      this.setState((/** @type {OppositesState} */ state) => ({
        incorrect: [...state.incorrect, i],
      }));
    }
  }

  gotoNext() {
    const l = this.props.opposites.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      correct: false,
      incorrect: [],
    });
  }

  gotoPrev() {
    const l = this.props.opposites.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      correct: false,
      incorrect: [],
    });
  }

  render() {
    // console.log("render");
    if (this.state.question === undefined)
      return <NotReady addlStyle="main-panel" />;

    const question = this.state.question;
    const answer = this.state.answer;
    const choices = this.state.choices;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);

    const progress =
      ((this.state.selectedIndex + 1) / this.props.opposites.length) * 100;

    return [
      <div key={0} className="opposites main-panel h-100">
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--green"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          <div
            className={classNames({
              "question pt-3 pb-3 d-flex flex-column justify-content-center text-center w-50": true,
              "correct-color": this.state.correct,
            })}
          >
            <h1>{question.toHTML()}</h1>
            <span
              className={classNames({
                "transparent-color": !this.props.qRomaji,
              })}
            >
              {question.romaji}
            </span>
            <span
              className="clickable"
              onClick={() => {
                this.setState((/** @type {OppositesState} */ state) => ({
                  showMeaning: !state.showMeaning,
                }));
              }}
            >
              {this.state.showMeaning ? question.english : "[English]"}
            </span>
          </div>
          <div className="choices pt-3 d-flex justify-content-around flex-wrap w-50">
            {choices.map((c, i) => {
              const isRight =
                choices[i].japanese === answer?.japanese && this.state.correct;
              const isWrong = this.state.incorrect.includes(i);

              const choiceCSS = classNames({
                "w-50 pt-3 d-flex flex-column justify-content-evenly text-center clickable": true,
                "correct-color": isRight,
                "incorrect-color": isWrong,
              });

              return (
                <div
                  key={i}
                  className={choiceCSS}
                  onClick={() => {
                    this.checkAnswer(c, i);
                  }}
                >
                  <div>
                    <h4>{c.toHTML()}</h4>
                    <span
                      className={classNames({
                        "transparent-color": !this.props.aRomaji,
                      })}
                    >
                      {c.romaji}
                    </span>
                  </div>
                  {/* <div>{this.state.showMeaning ? c.english : ""}</div> */}
                </div>
              );
            })}
          </div>
          <StackNavButton
            color={"--green"}
            ariaLabel="Next"
            action={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={1} className="progress-bar flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>,
    ];
  }
}
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    opposites: state.opposites.value,
    qRomaji: state.settings.opposites.qRomaji,
    aRomaji: state.settings.opposites.aRomaji,
  };
};

Opposites.propTypes = {
  getOpposites: PropTypes.func,
  opposites: PropTypes.array,
  qRomaji: PropTypes.bool,
  aRomaji: PropTypes.bool,
};

export default connect(mapStateToProps, { getOpposites })(Opposites);

export { OppositesMeta };
