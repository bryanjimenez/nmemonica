import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getHiragana } from "../../actions/hiraganaAct";
import { shuffleArray } from "../../helper/arrayHelper";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faGlasses } from "@fortawesome/free-solid-svg-icons";
import StackButton from "../Form/StackButton";

const HiraganaGameMeta = {
  location: "/hiragana/",
  label: "ひらがな Game",
};

class HiraganaGame extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      question: false,
      answer: false,
      choices: [],
      gameOrder: false,
      wrongs: [], // list of index of current wrong answered choices used for visual hints
      reinforce: [], // list of recently wrong chosen hiragana used to reinforce
      correct: false,

      practiceSide: false, //false=hiragana q shown (read), true=romaji q shown (write)
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);
    this.choiceButton = this.choiceButton.bind(this);
    this.shuffleGameOrder = this.shuffleGameOrder.bind(this);
    this.populateChoices = this.populateChoices.bind(this);

    // only fetch data on very first initialization
    if (!this.props.hiragana || this.props.hiragana.length === 0) {
      // console.log('fetching')
      this.props.getHiragana();
    }
  }

  componentDidMount() {
    // page navigation after initialcenter
    // data retrival done, set up game
    if (this.props.hiragana && this.props.hiragana.length > 0) {
      this.prepareGame();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log("componentDidUpdate");
    // console.log(prevProps)
    // console.log(this.props)
    if (this.state.selectedIndex != prevState.selectedIndex) {
      // console.log("got slide change");
      this.prepareGame();
    }

    if (
      this.props.hiragana &&
      prevProps.hiragana &&
      this.props.hiragana.length != prevProps.hiragana.length
    ) {
      // console.log("got game data");
      this.prepareGame();
    }

    if (
      this.state.practiceSide != prevState.practiceSide ||
      this.props.choiceN != prevProps.choiceN
    ) {
      // console.log('settings update');
      this.prepareGame();
    }
  }

  /**
   * based on the hiragana 2d array returns a shuffled list
   * of {consonant,vowel} corresponding to hiragana
   * consonant and vowel are indexes
   */
  shuffleGameOrder() {
    let gameOrder = [];
    if (this.state.gameOrder === false) {
      const xMax = Math.floor(this.props.hiragana[0].length);
      const yMax = Math.floor(this.props.hiragana.length);

      for (let vowel = 0; vowel < xMax; vowel++) {
        for (let consonant = 0; consonant < yMax; consonant++) {
          // should not include yi, ye or wu
          if (
            (vowel != 1 || consonant != 12) &&
            (vowel != 3 || consonant != 12) &&
            (vowel != 2 || consonant != 14)
          )
            gameOrder.push({ vowel, consonant });
        }
      }
      shuffleArray(gameOrder);
    } else {
      gameOrder = this.state.gameOrder;
    }

    return gameOrder;
  }

  /**
   * returns a shuffled list of choices containing the answer
   * @param {*} answer
   * @param {*} gameOrder
   */
  populateChoices(answer, gameOrder) {
    const choices = [answer];

    const difficult = this.state.practiceSide;
    const vowels = this.props.vowels;
    const consonants = this.props.consonants;

    while (choices.length < this.props.choiceN) {
      const min = 0;
      const max = Math.floor(gameOrder.length);
      const idx = Math.floor(Math.random() * (max - min) + min);

      const sound =
        consonants[gameOrder[idx].consonant] + vowels[gameOrder[idx].vowel];
      const cPronunciation = this.props.sounds[sound] || sound;
      const cCharacter = this.props.hiragana[gameOrder[idx].consonant][
        gameOrder[idx].vowel
      ];
      let choice;
      if (difficult) {
        choice = {
          val: cCharacter,
          hint: cPronunciation,
        };
      } else {
        choice = {
          val: cPronunciation,
          hint: cCharacter,
        };
      }

      // should not add duplicates or the right answer
      // duplicate check based on pronunciation
      if (
        (difficult && !choices.some((c) => c.hint === choice.hint)) ||
        (!difficult && !choices.some((c) => c.val === choice.val))
      ) {
        choices.push(choice);
      }
    }

    shuffleArray(choices);
    return choices;
  }

  prepareGame() {
    if (this.props.hiragana.length > 0) {
      // console.log("preparing");

      const practiceSide = this.state.practiceSide;
      const vowels = this.props.vowels;
      const consonants = this.props.consonants;
      const sounds = this.props.sounds;

      const gameOrder = this.shuffleGameOrder();

      let question;
      let answer;

      // some games will come from the reinforced list
      const reinforced = [false, false, true][Math.floor(Math.random() * 3)];
      if (reinforced && this.state.reinforce.length > 0) {
        // console.log('reinforced')
        const missedQuestion = this.state.reinforce.pop();

        if (practiceSide === missedQuestion.practiceSide) {
          answer = missedQuestion;
        } else {
          const { val, hint } = missedQuestion;
          answer = { val: hint, hint: val };
        }
      } else {
        // console.log('regular')
        const { consonant, vowel } = gameOrder[this.state.selectedIndex];
        const sound = consonants[consonant] + vowels[vowel];

        const pronunciation = sounds[sound] || sound;
        const character = this.props.hiragana[consonant][vowel];

        if (practiceSide) {
          answer = {
            val: character,
            hint: pronunciation,
          };
        } else {
          answer = {
            val: pronunciation,
            hint: character,
          };
        }
      }

      question = answer.hint;

      const choices = this.populateChoices(answer, gameOrder);

      if (this.props.wideMode) {
        choices.push({ val: question, q: true });
      }

      this.setState({
        question,
        answer,
        choices,
        gameOrder,
        wrongs: [],
        correct: false,
      });
    }
  }

  checkAnswer(answered) {
    if (answered.val === this.state.answer.val) {
      // console.log("RIGHT!");
      this.setState({ correct: true });
      setTimeout(this.gotoNext, 500);
    } else {
      // console.log("WRONG");
      const wrong = this.state.choices.findIndex((c) => c.val === answered.val);
      this.setState({
        wrongs: [...this.state.wrongs, wrong],
        reinforce: [
          ...this.state.reinforce,
          { ...answered, practiceSide: this.state.practiceSide },
        ],
      });
    }
  }

  gotoNext() {
    const l = this.state.gameOrder.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      wrongs: [],
      correct: false,
    });
  }

  gotoPrev() {
    const l = this.state.gameOrder.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      wrongs: [],
      correct: false,
    });
  }

  choiceButton(index) {
    const choices = this.state.choices;
    const answer = this.state.answer;
    const correct = this.state.correct;
    const choiceN = this.props.choiceN;

    const isWrong = this.state.wrongs.includes(index);
    const isRight = choices[index].val === answer.val && correct;
    const visibility = isWrong ? undefined : "hidden";
    const choiceCSS = classNames({
      clickable: true,
      "text-center": true,
      "correct-color": isRight,
      "incorrect-color": isWrong,
      "question-color": this.props.wideMode && choices[index].q,
    });

    const choiceH2CSS = classNames({
      "mb-0": this.props.wideMode,
    });

    const wide = this.props.wideMode ? 3 / 4 : 1;

    const width =
      Math.trunc((1 / Math.ceil(Math.sqrt(choiceN))) * wide * 100) + "%";

    return (
      <div
        key={index}
        onClick={() => {
          this.checkAnswer(choices[index]);
        }}
        className={choiceCSS}
        style={{ color: isRight, width }}
      >
        <h2 className={choiceH2CSS}>{choices[index].val}</h2>
        <h6 className="mb-0" style={{ visibility }}>
          {choices[index].hint}
        </h6>
      </div>
    );
  }

  render() {
    if (this.state.question === false) return <div />;

    const question = this.state.question;
    const choices = this.state.choices;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);
    const choiceAreaCSS = classNames({
      "choices-row d-flex justify-content-around": true,
      "w-50": !this.props.wideMode,
      "w-100": this.props.wideMode,
    });

    return (
      <div className="hiragana main-panel">
        <div className="d-flex justify-content-between h-100">
          <StackButton
            ariaLabel="Previous"
            color={"--blue"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackButton>
          {!this.props.wideMode && (
            <div className="pt-3 d-flex flex-column justify-content-around text-center w-50">
              <h1
                style={{ color: this.state.correct ? "green" : undefined }}
                className="clickable"
              >
                {question}
              </h1>
            </div>
          )}
          <div className={choiceAreaCSS}>
            <div className="choices-column w-100 d-flex flex-wrap ">
              {choices.map((c, i) => this.choiceButton(i))}
            </div>
          </div>
          <StackButton color={"--blue"} ariaLabel="Next" action={this.gotoNext}>
            <ChevronRightIcon size={16} />
          </StackButton>
        </div>
        <div
          className="clickable mt-2 ml-3"
          onClick={() => {
            this.setState((state) => ({ practiceSide: !state.practiceSide }));
          }}
        >
          {this.state.practiceSide ? (
            <FontAwesomeIcon icon={faGlasses} />
          ) : (
            <FontAwesomeIcon icon={faPencilAlt} />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    hiragana: state.hiragana.characters,
    vowels: state.hiragana.vowels,
    consonants: state.hiragana.consonants,
    sounds: state.hiragana.sounds,
    choiceN: state.settings.hiragana.wideMode
      ? 31
      : state.settings.hiragana.choiceN,
    wideMode: state.settings.hiragana.wideMode,
  };
};

HiraganaGame.propTypes = {
  hiragana: PropTypes.array.isRequired,
  getHiragana: PropTypes.func,
  vowels: PropTypes.array.isRequired,
  consonants: PropTypes.array.isRequired,
  choiceN: PropTypes.number.isRequired,
  sounds: PropTypes.object.isRequired,
  wideMode: PropTypes.bool,
};

export default connect(mapStateToProps, { getHiragana })(HiraganaGame);

export { HiraganaGameMeta };
