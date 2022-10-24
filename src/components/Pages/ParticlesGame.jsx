import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { shuffleArray } from "../../helper/arrayHelper";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { LinearProgress } from "@material-ui/core";
import { getParticlePhrases } from "../../actions/phrasesAct";
import { randomOrder } from "../../helper/gameHelper";
import { kanjiOkuriganaSpliceApplyCss } from "../../helper/kanjiHelper";

import "./ParticlesGame.css";

/**
 * @typedef {import("../../helper/JapaneseText").JapaneseText} JapaneseText
 * @typedef {import("../../typings/raw").RawPhrase} RawPhrase
 * @typedef {{ japanese: string, romaji: string, start?:number, end?:number }} Particle
 * @typedef {{ answer: Particle, question: JapaneseText, english:string}} ParticleGamePhrase
 */

/**
 * @typedef {{
 * getParticlePhrases: typeof getParticlePhrases,
 * phrases: ParticleGamePhrase[],
 * particles: Particle[],
 * aRomaji: boolean}} ParticlesGameProps
 */

/**
 * @typedef {{
 * order: number[],
 * selectedIndex: number,
 * showMeaning: boolean,
 * question: JapaneseText | undefined,
 * answer?: Particle,
 * english?: string,
 * choices: Particle[],
 * incorrect: number[]
 * correct: boolean}} ParticlesGameState
 */

const ParticlesGameMeta = {
  location: "/particles",
  label: "Particles Game",
};

/**
 * returns a list of choices which includes the right answer
 * @param {Particle} answer
 * @param {Particle[]} particleList
 */
function createChoices(answer, particleList) {
  let choices = [answer];
  while (choices.length < 4) {
    const max = Math.floor(particleList.length);
    const i = Math.floor(Math.random() * max);

    const choice = particleList[i];

    // should not be same choices or the right answer
    if (choices.every((c) => c.japanese !== choice.japanese)) {
      choices = [...choices, choice];
    }
  }

  shuffleArray(choices);

  return choices;
}

class ParticlesGame extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {ParticlesGameState} */
    this.state = {
      order: [],
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
    this.buildQuestionElement = this.buildQuestionElement.bind(this);

    this.props.getParticlePhrases();
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
      this.props.phrases &&
      prevProps.phrases &&
      this.props.phrases.length != prevProps.phrases.length &&
      this.props.particles &&
      this.props.particles.length > 0
    ) {
      // console.log("getting game data");
      this.prepareGame();
    } else if (
      this.state.question === undefined &&
      this.props.phrases &&
      this.props.phrases.length > 0 &&
      this.props.particles &&
      this.props.particles.length > 0
    ) {
      // page navigation after initial
      // console.log('last');
      this.prepareGame();
    }
  }

  prepareGame() {
    // console.log('prepare game')
    if (this.props.phrases.length > 0 || this.props.particles.length > 0) {
      const phrases = this.props.phrases;
      const particles = this.props.particles;

      let order;
      if (this.state.order.length === 0) {
        order = randomOrder(phrases);
      } else {
        order = this.state.order;
      }

      const phrase = phrases[order[this.state.selectedIndex]];
      const { answer, question, english } = phrase;
      const choices = createChoices(answer, particles);

      this.setState({
        order,
        question,
        answer,
        choices,
        english,
      });
    }
  }

  /**
   * @param {Particle} answered
   * @param {number} i
   */
  checkAnswer(answered, i) {
    if (answered.japanese === this.state.answer?.japanese) {
      // console.log("RIGHT!");
      this.setState({ correct: true /*, showMeaning: true*/ });
      setTimeout(this.gotoNext, 1000);
    } else {
      // console.log("WRONG");
      this.setState((/** @type {ParticlesGameState} */ state) => ({
        incorrect: [...state.incorrect, i],
      }));
    }
  }

  gotoNext() {
    const l = this.props.phrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      correct: false,
      incorrect: [],
    });
  }

  gotoPrev() {
    const l = this.props.phrases.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      correct: false,
      incorrect: [],
    });
  }

  /**
   * @param {JapaneseText} question
   * @param {{start:number, end:number}} answer
   * @param {boolean} correct
   * @returns
   */
  buildQuestionElement(question, { start, end }, correct) {
    const hidden = correct ? "correct-color" : "transparent-font underline";

    return kanjiOkuriganaSpliceApplyCss(
      question?.parseObj,
      { hidden },
      start,
      end
    );
  }

  render() {
    if (this.state.answer === undefined || this.state.question === undefined)
      return <NotReady addlStyle="main-panel" />;

    const answer = this.state.answer;
    const english = this.state.english;
    const question = this.buildQuestionElement(
      this.state.question,
      this.state.answer,
      this.state.correct
    );
    const choices = this.state.choices;

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
              "question pt-3 pb-3 d-flex flex-column justify-content-center text-center w-60": true,
              // "correct-color": this.state.correct,
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
          <div className="choices d-flex flex-wrap justify-content-around w-40">
            {choices.map((c, i) => {
              const isRight =
                choices[i].japanese === answer?.japanese && this.state.correct;
              const isWrong = this.state.incorrect.indexOf(i) > -1;
              const choiceCSS = classNames({
                "w-50 d-flex flex-column justify-content-evenly text-center clickable": true,
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
                    </span>
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
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    phrases: state.phrases.particleGame.phrases,
    particles: state.phrases.particleGame.particles,
    aRomaji: state.settings.particles.aRomaji,
  };
};

ParticlesGame.propTypes = {
  getParticlePhrases: PropTypes.func.isRequired,
  phrases: PropTypes.array.isRequired,
  particles: PropTypes.array.isRequired,
  aRomaji: PropTypes.bool,
};

export default connect(mapStateToProps, { getParticlePhrases })(ParticlesGame);

export { ParticlesGameMeta };
