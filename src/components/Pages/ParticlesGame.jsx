import React, { Component } from "react";
import { connect } from "react-redux";

import { getParticles } from "../../actions/particlesAct";
import { shuffleArray } from "../../helper/arrayHelper";

const ParticlesGameMeta = {
  location: "/particles",
  label: "Particles Game",
};

class ParticlesGame extends Component {
  constructor(props) {
    super(props);

    const query = this.props.location.search;
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
      gameOrder: false,
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.toggleHint = this.toggleHint.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    this.props.getParticles();
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
      this.props.particles &&
      prevProps.particles &&
      this.props.particles.length != prevProps.particles.length
    ) {
      // console.log("getting game data");
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
    if (this.props.particles.length > 0) {
      const { sentence, particles } = this.props.particles[
        this.state.selectedIndex
      ];
      const max = Math.floor(particles.length);
      const idx = Math.floor(Math.random() * max);

      // console.log(this.props.particles[this.state.selectedIndex]);

      const question = sentence.reduce((acc, curr, i) => {
        if (i === idx) {
          acc += curr + " __ ";
        } else {
          acc += curr + " " + (particles[i] || "") + " ";
        }

        return acc;
      }, "");

      const japanseParticles = [
        "は",
        "が",
        "お/を",
        "に",
        "で",
        "へ",
        "の",
        "と",
        "も",
      ];
      const allChoices = ["wa", "ga", "o", "ni", "de", "e", "no", "to", "mo"];

      const answer = {
        japanese: japanseParticles[allChoices.indexOf(particles[idx])],
        romaji: particles[idx],
      };

      let choices = [answer.romaji];

      while (choices.length < 4) {
        const max = Math.floor(allChoices.length);
        const i = Math.floor(Math.random() * max);

        const choice = allChoices[i];

        // should not be same choices or the right answer
        if (choices.indexOf(choice) === -1) {
          choices.push(choice);
        }
      }

      choices = choices.map((c) => {
        const j = allChoices.indexOf(c);
        return { japanese: japanseParticles[j], romaji: c };
      });
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
    const l = this.props.particles.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
    });
  }

  gotoPrev() {
    const l = this.props.particles.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: this.state.toggle === "romaji",
      showRomaji: this.state.toggle === "english",
    });
  }

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
    // TODO: cleanup
    if (
      !this.props.particles ||
      this.props.particles.length < 1 ||
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
      <div className="particles" style={{ height: "75%" }}>
        <div
          className="d-flex justify-content-between"
          style={{ height: "100%" }}
        >
          <button
            type="button"
            className="btn btn-warning"
            onClick={this.gotoPrev}
          >
            prev
          </button>
          <div
            onClick={this.toggleHint}
            className="pt-3 d-flex flex-column justify-content-around text-center w-50"
          >
            <h1>{question}</h1>
            {/* <h2>{this.state.showRomaji ? question.romaji : ""}</h2>
            <div>{this.state.showMeaning ? question.english : "-"}</div> */}
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
                className="pt-3 d-flex flex-column justify-content-around text-center"
              >
                <h2>{choices[0].japanese}</h2>
                <div>{this.state.showRomaji ? choices[0].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[0].english : ""}</div>
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[1]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center"
              >
                <h2>{choices[1].japanese}</h2>
                <div>{this.state.showRomaji ? choices[1].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[1].english : ""}</div>
              </div>
            </div>
            <div className="choices-column d-flex flex-column justify-content-around">
              <div
                onClick={() => {
                  this.checkAnswer(choices[2]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center"
              >
                <h2>{choices[2].japanese}</h2>
                <div>{this.state.showRomaji ? choices[2].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[2].english : ""}</div>
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[3]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center"
              >
                <h2>{choices[3].japanese}</h2>
                <div>{this.state.showRomaji ? choices[3].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[3].english : ""}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-warning"
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
  return { particles: state.particles.value };
};

export default connect(mapStateToProps, { getParticles })(ParticlesGame);

export { ParticlesGameMeta };
