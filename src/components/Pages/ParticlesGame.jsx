import React, { Component } from "react";
import { connect } from "react-redux";

import { getParticles, getSuffixes } from "../../actions/particlesAct";
import { shuffleArray } from "../../helper/arrayHelper";

const ParticlesGameMeta = {
  location: "/particles",
  label: "Particles Game",
};

/**
 * maps the romaji particle to japanese
 * @param {*} particle a single or multiple (space separated particle)
 * @param {*} romajiParticlesList
 * @param {*} japanseParticlesList
 */
function buildJapaneseParticle(
  particle,
  romajiParticlesList,
  japanseParticlesList
) {
  return particle
    .split(" ")
    .reduce(
      (acc, p) => acc + japanseParticlesList[romajiParticlesList.indexOf(p)],
      ""
    );
}

/**
 * creates a sentence with a blank over the randomly selected particle to quiz
 * @param {*} sentence
 * @param {*} idx index of randomly selected particle to quiz in the sentence
 * @param {*} particles
 */
function buildQuestionSentence(sentence, idx, particles) {
  return sentence.reduce((acc, curr, i) => {
    if (i === idx) {
      acc += curr + " __ ";
    } else {
      acc += curr + " " + (particles[i] || "") + " ";
    }

    return acc;
  }, "");
}

// FIXME: if the answer is a multiple particle, then the choices should also be multiples
/**
 * returns a list of choices which includes the right answer
 * @param {*} answer
 * @param {*} romajiParticlesList
 * @param {*} japanseParticlesList
 */
function createChoices(answer, romajiParticlesList, japanseParticlesList) {
  const choices = [answer];
  while (choices.length < 4) {
    const max = Math.floor(romajiParticlesList.length);
    const i = Math.floor(Math.random() * max);

    const romaji = romajiParticlesList[i];
    const japanese = buildJapaneseParticle(
      romaji,
      romajiParticlesList,
      japanseParticlesList
    );
    const choice = { japanese, romaji };

    // should not be same choices or the right answer
    if (choices.filter((c) => c.romaji === choice.romaji).length === 0) {
      choices.push(choice);
    }
  }

  shuffleArray(choices);

  return choices;
}

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
      english: false,
      gameOrder: false,
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.toggleHint = this.toggleHint.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    this.props.getParticles();
    this.props.getSuffixes();
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
    } else if (
      this.props.particles &&
      prevProps.particles &&
      this.props.particles.length != prevProps.particles.length &&
      this.props.suffixes &&
      this.props.suffixes.length > 0
    ) {
      // console.log("getting game data");
      this.prepareGame();
    } else if (
      this.props.suffixes &&
      prevProps.suffixes &&
      this.props.suffixes.length != prevProps.suffixes.length &&
      this.props.particles &&
      this.props.particles.length > 0
    ) {
      // console.log("getting game data 2");
      this.prepareGame();
    } else if (
      this.state.question === false &&
      this.props.particles &&
      this.props.particles.length > 0 &&
      this.props.suffixes &&
      this.props.suffixes.length > 0
    ) {
      // page navigation after initial
      // opposites retrival done
      // console.log('last')
      this.prepareGame();
    }
  }

  prepareGame() {
    // console.log('prepare game')
    if (this.props.particles.length > 0 || this.props.suffixes.length > 0) {
      const { sentence, particles } = this.props.particles[
        this.state.selectedIndex
      ].romaji;
      const english =
        this.props.particles[this.state.selectedIndex].english || "";
      const max = Math.floor(particles.length);
      const idx = Math.floor(Math.random() * max);

      const [japanseParticles, romajiParticles] = this.props.suffixes.reduce(
        (acc, curr) => {
          acc[0].push(curr.japanese);
          acc[1].push(curr.romaji);
          return acc;
        },
        [[], []]
      );

      const question = buildQuestionSentence(sentence, idx, particles);

      const romaji = particles[idx];
      const japanese = buildJapaneseParticle(
        romaji,
        romajiParticles,
        japanseParticles
      );

      const answer = {
        japanese,
        romaji,
      };

      const choices = createChoices(answer, romajiParticles, japanseParticles);

      this.setState({ question, answer, choices, english });
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
    if (this.state.question === false) return <div />;

    const question = this.state.question;
    const answer = this.state.answer;
    const choices = this.state.choices;
    const english = this.state.english;

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
          <div className="pt-3 d-flex flex-column justify-content-around text-center w-50">
            <h1 onClick={this.toggleHint} className="clickable">
              {question}
            </h1>
            {/* <h2>{this.state.showRomaji ? question.romaji : ""}</h2> */}
            <div>{this.state.showMeaning ? english : "."}</div>
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
                <h2>{choices[0].japanese}</h2>
                <div>{this.state.showRomaji ? choices[0].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[0].english : ""}</div>
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[1]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center clickable"
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
                className="pt-3 d-flex flex-column justify-content-around text-center clickable"
              >
                <h2>{choices[2].japanese}</h2>
                <div>{this.state.showRomaji ? choices[2].romaji : ""}</div>
                <div>{this.state.showMeaning ? choices[2].english : ""}</div>
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[3]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center clickable"
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
  return {
    particles: state.particles.value,
    suffixes: state.particles.suffixes,
  };
};

export default connect(mapStateToProps, { getParticles, getSuffixes })(
  ParticlesGame
);

export { ParticlesGameMeta };
