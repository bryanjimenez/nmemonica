import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getParticles, getSuffixes } from "../../actions/particlesAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { LinearProgress } from "@material-ui/core";

/**
 * @typedef {{english: string, japanese: string, romaji: {sentence: string[], particles: string[]}}} RawParticle
 * @typedef {{japanese: string, romaji: string}} RawSuffix
 */

/**
 * @typedef {{
 * getParticles: function,
 * getSuffixes: function,
 * particles: RawParticle[],
 * suffixes: RawSuffix[],
 * aRomaji: boolean}} ParticlesGameProps
 */

/**
 * @typedef {{
 * selectedIndex: number,
 * showMeaning: boolean,
 * question?: RawParticle,
 * answer?: RawParticle,
 * english?: string,
 * choices: RawParticle[],
 * incorrect: number[]
 * correct: boolean}} ParticlesGameState
 */

const ParticlesGameMeta = {
  location: "/particles",
  label: "Particles Game",
};

/**
 * maps the romaji particle to japanese
 * @param {string} particle a single or multiple (space separated particle)
 * @param {string[]} romajiParticlesList
 * @param {string[]} japanseParticlesList
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
 * @param {string[]} sentence
 * @param {number} idx index of randomly selected particle to quiz in the sentence
 * @param {string[]} particles
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
 * @param {{japanese:string, romaji:string}} answer
 * @param {string[]} romajiParticlesList
 * @param {string[]} japanseParticlesList
 */
function createChoices(answer, romajiParticlesList, japanseParticlesList) {
  let choices = [answer];
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
      choices = [...choices, choice];
    }
  }

  shuffleArray(choices);

  return choices;
}

class ParticlesGame extends Component {
  constructor(props) {
    super(props);

    /** @type {ParticlesGameState} */
    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      question: undefined,
      answer: undefined,
      choices: [],
      english: undefined,
      incorrect: [],
      correct: false,
    };

    /** @type {ParticlesGameProps} */
    this.props;

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    this.props.getParticles();
    this.props.getSuffixes();
  }

  /**
   * @param {ParticlesGameProps} prevProps
   * @param {ParticlesGameState} prevState
   */
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
      this.state.question === undefined &&
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
      const { sentence, particles } =
        this.props.particles[this.state.selectedIndex].romaji;
      const english =
        this.props.particles[this.state.selectedIndex].english || "";
      const max = Math.floor(particles.length);
      const idx = Math.floor(Math.random() * max);

      /** @type {[string[],string[]]} */
      let init = [[], []];
      const [japanseParticles, romajiParticles] = this.props.suffixes.reduce(
        (acc, curr) => {
          acc[0].push(curr.japanese);
          acc[1].push(curr.romaji);
          return acc;
        },
        init
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

  /**
   * @param {RawParticle} answered
   * @param {number} i
   */
  checkAnswer(answered, i) {
    if (answered.japanese === this.state.answer?.japanese) {
      // console.log("RIGHT!");
      this.setState({ correct: true, showMeaning: true });
      setTimeout(this.gotoNext, 500);
    } else {
      // console.log("WRONG");
      this.setState((/** @type {ParticlesGameState} */ state) => ({
        incorrect: [...state.incorrect, i],
      }));
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
    if (this.state.question === undefined)
      return <NotReady addlStyle="main-panel" />;

    const question = this.state.question;
    const answer = this.state.answer;
    const choices = this.state.choices;
    const english = this.state.english;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);

    const progress =
      ((this.state.selectedIndex + 1) / this.props.particles.length) * 100;

    return [
      <div key={0} className="particles main-panel h-100">
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--indigo"}
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
            <h1>{question}</h1>
            <div
              className="clickable"
              onClick={() => {
                this.setState((/** @type {ParticlesGameState} */ state) => ({
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
                choices[i].japanese === answer?.japanese && this.state.correct;
              const isWrong = this.state.incorrect.indexOf(i) > -1;
              const choiceCSS = classNames({
                "pt-3 w-50 d-flex flex-column justify-content-evenly text-center clickable": true,
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
                  <div>
                    <h2>{c.japanese}</h2>
                    <span
                      className={classNames({
                        "transparent-color": !this.props.aRomaji,
                      })}
                    >
                      {c.romaji}
                    </span>{" "}
                  </div>
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
      </div>,
      <div key={1} className="progress-bar flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>,
    ];
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
