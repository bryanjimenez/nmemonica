import React, { Component } from "react";
import { connect } from "react-redux";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
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

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      question: false,
      answer: false,
      choices: [],
      english: false,
      gameOrder: false,
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
      showMeaning: false,
    });
  }

  gotoPrev() {
    const l = this.props.particles.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
    });
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
      <div className="particles main-panel">
        <div className="d-flex justify-content-between h-100">
          <button
            type="button"
            className="btn btn-warning"
            onClick={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </button>
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
            {choices.map((c, i) => (
              <div
                key={i}
                onClick={() => {
                  this.checkAnswer(c);
                }}
                className="pt-3 w-50 d-flex flex-column text-center clickable"
              >
                <h2>{c.japanese}</h2>
                <div>{this.props.aRomaji ? c.romaji : ""}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-warning"
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
    particles: state.particles.value,
    suffixes: state.particles.suffixes,
    aRomaji: state.settings.particles.aRomaji,
  };
};

export default connect(mapStateToProps, { getParticles, getSuffixes })(
  ParticlesGame
);

export { ParticlesGameMeta };
