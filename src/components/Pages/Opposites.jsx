import React, { Component } from "react";
import { connect } from "react-redux";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getOpposites } from "../../actions/oppositesAct";
import { shuffleArray } from "../../helper/arrayHelper";

// import PropTypes from "prop-types";

import "./CustomBtn.css";
import { kanjiWithFurigana } from "../../helper/parser";

const OppositesMeta = {
  location: "/opposites/",
  label: "Opposites",
};

class Opposites extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      question: false,
      answer: false,
      choices: [],
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    this.props.getOpposites();
  }

  componentDidMount() {}

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
      this.state.question === false &&
      this.state.answer === false &&
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

      question = { ...question, pretty: kanjiWithFurigana(question.japanese) };
      answer = { ...answer, pretty: kanjiWithFurigana(answer.japanese) };

      const choices = [];
      const antiHomophones = [answer.romaji, question.romaji];
      choices.push(answer);

      while (choices.length < 4) {
        const max = Math.floor(this.props.opposites.length);
        const idx = Math.floor(Math.random() * max);

        const [wrongAnswer1, wrongAnswer2] = this.props.opposites[idx];

        if (
          antiHomophones.indexOf(wrongAnswer1.romaji) === -1 &&
          antiHomophones.indexOf(wrongAnswer2.romaji) === -1
        ) {
          const headsOrTails = Math.floor(Math.random() * 2);

          if (headsOrTails === 0) {
            const pretty = kanjiWithFurigana(wrongAnswer1.japanese);
            choices.push({ ...wrongAnswer1, pretty });
            antiHomophones.push(wrongAnswer1.romaji);
          } else {
            const pretty = kanjiWithFurigana(wrongAnswer2.japanese);
            choices.push({ ...wrongAnswer2, pretty });
            antiHomophones.push(wrongAnswer2.romaji);
          }
        }
      }

      shuffleArray(choices);

      this.setState({ question, answer, choices });
    }
  }

  checkAnswer(answered) {
    if (answered.japanese === this.state.answer.japanese) {
      // console.log("RIGHT!");
      this.gotoNext();
    } else {
      // console.log("WRONG");
    }
  }

  gotoNext() {
    const l = this.props.opposites.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
    });
  }

  gotoPrev() {
    const l = this.props.opposites.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
    });
  }

  render() {
    // console.log("render");
    // TODO: cleanup
    if (this.state.question === false) return <div />;

    const question = this.state.question;
    const answer = this.state.answer;
    const choices = this.state.choices;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);

    return (
      <div className="opposites main-panel">
        <div className="d-flex justify-content-between h-100">
          <button
            type="button"
            className="btn btn-orange"
            onClick={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </button>
          <div className="question pt-3 pb-3 d-flex flex-column justify-content-around text-center w-50">
            <h1 className="clickable">{question.pretty}</h1>
            <h2>{this.props.qRomaji ? question.romaji : ""}</h2>
            <div
              onClick={() => {
                this.setState((state) => ({
                  showMeaning: !state.showMeaning,
                }));
              }}
            >
              {this.state.showMeaning ? question.english : "[English]"}
            </div>
          </div>
          <div className="choices pt-3 d-flex justify-content-around flex-wrap w-50">
            {choices.map((c, i) => (
              <div
                key={i}
                className="w-50 pt-3 d-flex flex-column text-center clickable"
                onClick={() => {
                  this.checkAnswer(c);
                }}
              >
                <h4>{c.pretty}</h4>
                <div>{this.props.aRomaji ? c.romaji : ""}</div>
                {/* <div>{this.state.showMeaning ? c.english : ""}</div> */}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-orange"
            onClick={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    opposites: state.opposites.value,
    qRomaji: state.settings.opposites.qRomaji,
    aRomaji: state.settings.opposites.aRomaji,
  };
};

export default connect(mapStateToProps, { getOpposites })(Opposites);

export { OppositesMeta };
