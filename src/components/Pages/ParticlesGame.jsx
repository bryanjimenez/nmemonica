import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getParticles, getSuffixes } from "../../actions/particlesAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";

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

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      question: false,
      answer: false,
      choices: [],
      english: false,
      incorrect: [],
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    this.props.getParticles();
    this.props.getSuffixes();
  }

  componentDidMount() {}

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

  checkAnswer(answered, i) {
    if (answered.japanese === this.state.answer.japanese) {
      // console.log("RIGHT!");
      this.setState({ correct: true });
      setTimeout(this.gotoNext, 500);
    } else {
      // console.log("WRONG");
      this.setState((state) => ({ incorrect: [...state.incorrect, i] }));
    }
  }

  gotoNext() {
    const l = this.props.particles.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      correct: false,
      incorrect: [],
    });
  }

  gotoPrev() {
    const l = this.props.particles.length;
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
    if (this.state.question === false)
      return <NotReady addlStyle="main-panel" />;

    const question = this.state.question;
    const answer = this.state.answer;
    const choices = this.state.choices;
    const english = this.state.english;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);

    return (
      <div className="particles main-panel">
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--indigo"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          <div className="pt-3 d-flex flex-column justify-content-around text-center w-50">
            <h1 className="clickable">{question}</h1>
            <div
              onClick={() => {
                this.setState((state) => ({
                  showMeaning: !state.showMeaning,
                }));
              }}
            >
              {this.state.showMeaning ? english : "[English]"}
            </div>
          </div>
          <div className="choices d-flex flex-wrap justify-content-around w-50">
            {choices.map((c, i) => {
              const isRight =
                choices[i].japanese === answer.japanese && this.state.correct;
              const isWrong = this.state.incorrect.indexOf(i) > -1;
              const choiceCSS = classNames({
                "pt-3 w-50 d-flex flex-column text-center clickable": true,
                "correct-color": isRight,
                "incorrect-color": isWrong,
              });

              return (
                <div
                  key={i}
                  onClick={() => {
                    this.checkAnswer(c, i);
                  }}
                  className={choiceCSS}
                >
                  <h2>{c.japanese}</h2>
                  <div>{this.props.aRomaji ? c.romaji : ""}</div>
                </div>
              );
            })}
          </div>
          <StackNavButton
            color={"--indigo"}
            ariaLabel="Next"
            action={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    particles: state.particles.value,
    suffixes: state.particles.suffixes,
    aRomaji: state.settings.particles.aRomaji,
  };
};

ParticlesGame.propTypes = {
  getParticles: PropTypes.func.isRequired,
  getSuffixes: PropTypes.func.isRequired,
  particles: PropTypes.array.isRequired,
  suffixes: PropTypes.array.isRequired,
  aRomaji: PropTypes.bool,
};

export default connect(mapStateToProps, { getParticles, getSuffixes })(
  ParticlesGame
);

export { ParticlesGameMeta };
