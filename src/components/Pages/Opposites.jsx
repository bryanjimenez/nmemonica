import React, { Component } from "react";
import { connect } from "react-redux";

import { getOpposites } from "../../actions/oppositesAct";
import { shuffleArray } from "../../helper/arrayHelper";

// import PropTypes from "prop-types";

import "./CustomBtn.css";

const OppositesMeta = {
  location: "/opposites/",
  label: "Opposites",
};

class Opposites extends Component {
  constructor(props) {
    super(props);

    const query = this.props.location.search;
    // const toggle = new URLSearchParams(useLocation().search).toggle;
    const toggle = query
      ? query.split("?")[1].split("toggle=")[1].split("&")[0]
      : "english";

    this.state = {
      selectedIndex: 0,
      toggle,
      showToggle: false,
      showMeaning: false,
      showRomaji: true,
      question: false,
      answer: false,
      choices: [],
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.toggleHint = this.toggleHint.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    this.props.getOpposites();
  }

  componentDidMount() {
    // console.log("mount");
    let hint = {};
    if (this.state.toggle === "english") {
      hint = { showMeaning: false, showRomaji: true };
    } else if (this.state.toggle === "romaji") {
      hint = { showRomaji: false, showMeaning: true };
    } else {
      hint = { showMeaning: false, showRomaji: true };
    }

    this.setState(hint);
    // this.prepareGame();
  }

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
      const [question, answer] = this.props.opposites[
        this.state.selectedIndex
      ].opposites;

      const choices = [];
      const antiHomophones = [answer.romaji, question.romaji];
      choices.push(answer);

      while (choices.length < 4) {
        const max = Math.floor(this.props.opposites.length);
        const idx = Math.floor(Math.random() * max);

        const [wrongAnswer1, wrongAnswer2] = this.props.opposites[
          idx
        ].opposites;

        if (
          antiHomophones.indexOf(wrongAnswer1.romaji) === -1 &&
          antiHomophones.indexOf(wrongAnswer2.romaji) === -1
        ) {
          const headsOrTails = Math.floor(Math.random() * 2);

          if (headsOrTails === 0) {
            choices.push(wrongAnswer1);
            antiHomophones.push(wrongAnswer1.romaji);
          } else {
            choices.push(wrongAnswer2);
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
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
    });
  }

  gotoPrev() {
    const l = this.props.opposites.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
    });
  }

  /*
  TODO: difficulty level
  easy: japanese on, romaji on, toggle english on off
  medium: japanese on, romaji on , toggle english on individually
  hard: japanese on, romaji toggle individually
  */
  toggleHint() {
    let hint = {};
    if (this.state.toggle === "english") {
      hint = {
        showMeaning: !this.state.showToggle,
        showToggle: !this.state.showToggle,
      };
    } else if (this.state.toggle === "romaji") {
      hint = {
        showRomaji: !this.state.showToggle,
        showToggle: !this.state.showToggle,
      };
    }

    this.setState(hint);
  }

  render() {
    // console.log("render");
    // TODO: cleanup
    if (
      !this.props.opposites ||
      this.props.opposites.length < 1 ||
      this.state.question === false
    )
      return <div />;

    const question = this.state.question;
    const answer = this.state.answer;
    const choices = this.state.choices;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);

    return (
      <div className="opposites" style={{ height: "75%" }}>
        <div
          className="d-flex justify-content-between"
          style={{ height: "100%" }}
        >
          <button
            type="button"
            className="btn btn-orange"
            onClick={this.gotoPrev}
          >
            prev
          </button>
          <div className="pt-3 d-flex flex-column justify-content-around text-center w-50">
            <h1 onClick={this.toggleHint} className="clickable">
              {question.japanese}
            </h1>
            <h2 onClick={this.toggleHint} className="clickable">
              {this.state.showRomaji ? question.romaji : ""}
            </h2>
            <div>{this.state.showMeaning ? question.english : "-"}</div>
            {
              // TODO: implement pronunciation
            }
            {/* <div className="d-flex">
              <UnmuteIcon size="medium" aria-label="pronunciation" />
            </div> */}
          </div>
          <div className="choices-row d-flex justify-content-around w-50">
            <div className="choices-column d-flex flex-column justify-content-around">
              <div
                onClick={() => {
                  this.checkAnswer(choices[0]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center clickable"
              >
                <div>{choices[0].japanese}</div>
                <div>{this.state.showRomaji ? choices[0].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[0].english : ""}</div>
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[1]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center clickable"
              >
                <div>{choices[1].japanese}</div>
                <div>{this.state.showRomaji ? choices[1].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[1].english : ""}</div>
              </div>
            </div>
            <div className="choices-column d-flex flex-column justify-content-around">
              <div
                onClick={() => {
                  this.checkAnswer(choices[2]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center clickable"
              >
                <div>{choices[2].japanese}</div>
                <div>{this.state.showRomaji ? choices[2].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[2].english : ""}</div>
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[3]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center clickable"
              >
                <div>{choices[3].japanese}</div>
                <div>{this.state.showRomaji ? choices[3].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[3].english : ""}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-orange"
            onClick={this.gotoNext}
          >
            next
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return { opposites: state.opposites.value };
};

export default connect(mapStateToProps, { getOpposites })(Opposites);

export { OppositesMeta };
