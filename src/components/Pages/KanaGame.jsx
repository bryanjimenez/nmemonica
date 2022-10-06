import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getKana } from "../../actions/kanaAct";
import { shuffleArray } from "../../helper/arrayHelper";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faGlasses } from "@fortawesome/free-solid-svg-icons";
import StackNavButton from "../Form/StackNavButton";
import { swapKana } from "../../helper/kanaHelper";
import { DEBUG_OFF } from "../../actions/settingsAct";

/**
 * @typedef {{
 * val: string,
 * hint: string,
 * cSet: number,
 * q?: boolean,
 * practiceSide?: boolean}} Choice
 * @typedef {{
 * consonant: number,
 * vowel: number}} Mora
 * @typedef {0|1|2} KanaType
 */

/**
 * @typedef {{
 * hiragana: string[],
 * katakana: string[],
 * getKana: function,
 * vowels: string[],
 * consonants: string[],
 * choiceN: number,
 * sounds: {[index:string]:string},
 * wideMode: boolean,
 * easyMode: boolean,
 * charSet: KanaType,
 * debug: number}} KanaGameProps
 */

/**
 * @typedef {{
 * selectedIndex: number,
 * question: string,
 * answer: Choice,
 * choices: Choice[],
 * gameOrder: Mora[],
 * wrongs: number[], // list of index of current wrong answered choices used for visual hints
 * reinforce: Choice[], // list of recently wrong chosen hiragana used to reinforce
 * correct: boolean,
 * practiceSide: boolean}} KanaGameState
 */

const KanaGameMeta = {
  location: "/kana/",
  label: ["平仮名 Game", "片仮名 Game", "仮名 Game"],
};

class KanaGame extends Component {
  constructor(props) {
    super(props);

    /** @type {KanaGameState} */
    this.state = {
      selectedIndex: 0,
      question: "undefined",
      answer: { val: "", hint: "", cSet: 0 },
      choices: [],
      gameOrder: [],
      wrongs: [], // list of index of current wrong answered choices used for visual hints
      reinforce: [], // list of recently wrong chosen hiragana used to reinforce
      correct: false,

      practiceSide: false, //false=hiragana q shown (read), true=romaji q shown (write)
    };

    /** @type {KanaGameProps} */
    this.props;

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);
    this.choiceButton = this.choiceButton.bind(this);
    this.shuffleGameOrder = this.shuffleGameOrder.bind(this);
    this.populateChoices = this.populateChoices.bind(this);
    this.getPronunciation = this.getPronunciation.bind(this);
    this.getKanaCharacter = this.getKanaCharacter.bind(this);

    // only fetch data on very first initialization
    if (this.props.hiragana.length === 0) {
      // console.log('fetching')
      this.props.getKana();
    }
  }

  componentDidMount() {
    // page navigation after initialcenter
    // data retrival done, set up game
    if (this.props.hiragana.length > 0) {
      this.prepareGame();
    }
  }

  /**
   * @param {KanaGameProps} prevProps
   * @param {KanaGameState} prevState
   */
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
    /** @type {Mora[]} */
    let gameOrder = [];
    const xMax = Math.floor(this.props.hiragana[0].length);
    const yMax = Math.floor(this.props.hiragana.length);

    for (let vowel = 0; vowel < xMax; vowel++) {
      for (let consonant = 0; consonant < yMax; consonant++) {
        // should not include yi, ye, wu, or empty row (except -n)
        if (
          (vowel != 1 || consonant != 12) &&
          (vowel != 3 || consonant != 12) &&
          (vowel != 2 || consonant != 14) &&
          (vowel === 0 || consonant != 15)
        )
          gameOrder = [...gameOrder, { vowel, consonant }];
      }
    }
    shuffleArray(gameOrder);

    return gameOrder;
  }

  /**
   * @param {number} consonant
   * @param {number} vowel
   * @returns {string}
   */
  getPronunciation(consonant, vowel) {
    const vowels = this.props.vowels;
    const consonants = this.props.consonants;

    const sound = consonants[consonant] + vowels[vowel];

    return this.props.sounds[sound] || sound;
  }

  /**
   * @param {number} consonant
   * @param {number} vowel
   * @param {number} set
   * @returns {string}
   */
  getKanaCharacter(consonant, vowel, set) {
    let kana;

    if (set === 0) {
      kana = this.props.hiragana[consonant][vowel];
    } else {
      kana = this.props.katakana[consonant][vowel];
    }

    return kana;
  }

  /**
   * 0 = hiragana
   * 1 = katakana
   * 2 = randomize 0 or 1
   * @param {KanaType} charSet
   */
  kanaTypeLogic(charSet) {
    let useCharSet;
    if (charSet === 2) {
      useCharSet = /** @type {0|1} */ (Math.floor(Math.random() * 2));
    } else {
      useCharSet = charSet;
    }
    return useCharSet;
  }

  /**
   * @returns {Choice[]} a shuffled list of choices containing the answer
   * @param {Choice} answer
   * @param {Mora[]} gameOrder
   */
  populateChoices(answer, gameOrder) {
    let choices = [answer];

    const difficult = this.state.practiceSide;

    while (choices.length < this.props.choiceN) {
      const min = 0;
      const max = Math.floor(gameOrder.length);
      const idx = Math.floor(Math.random() * (max - min) + min);

      let useChar = this.kanaTypeLogic(this.props.charSet);

      const cPronunciation = this.getPronunciation(
        gameOrder[idx].consonant,
        gameOrder[idx].vowel
      );
      const cCharacter = this.getKanaCharacter(
        gameOrder[idx].consonant,
        gameOrder[idx].vowel,
        useChar
      );
      /** @type {Choice} */
      let choice;
      if (difficult) {
        choice = {
          val: cCharacter,
          hint: cPronunciation,
          cSet: useChar,
        };
      } else {
        choice = {
          val: cPronunciation,
          hint: cCharacter,
          cSet: useChar,
        };
      }

      // should not add duplicates or the right answer
      // duplicate check based on pronunciation
      if (
        (difficult && !choices.some((c) => c.hint === choice.hint)) ||
        (!difficult && !choices.some((c) => c.val === choice.val))
      ) {
        choices = [...choices, choice];
      }
    }

    shuffleArray(choices);
    return choices;
  }

  prepareGame() {
    if (this.props.hiragana.length > 0) {
      // console.log("preparing");

      const practiceSide = this.state.practiceSide;
      let gameOrder;
      if (this.state.gameOrder.length > 0) {
        gameOrder = this.state.gameOrder;
      } else {
        gameOrder = this.shuffleGameOrder();
      }

      /** @type {string} */
      let question;
      /** @type {Choice} */
      let answer;

      // some games will come from the reinforced list
      const reinforced = [false, false, true][Math.floor(Math.random() * 3)];
      if (reinforced && this.state.reinforce.length > 0) {
        // console.log('reinforced')
        const missedQuestion =
          this.state.reinforce[this.state.reinforce.length - 1];

        if (practiceSide === missedQuestion.practiceSide) {
          answer = missedQuestion;
        } else {
          const { val, hint, cSet } = missedQuestion;
          answer = { val: hint, hint: val, cSet };
        }
      } else {
        // console.log('regular')
        const { consonant, vowel } = gameOrder[this.state.selectedIndex];

        let useChar = this.kanaTypeLogic(this.props.charSet);

        const pronunciation = this.getPronunciation(consonant, vowel);
        const character = this.getKanaCharacter(consonant, vowel, useChar);

        if (practiceSide) {
          answer = {
            val: character,
            hint: pronunciation,
            cSet: useChar,
          };
        } else {
          answer = {
            val: pronunciation,
            hint: character,
            cSet: useChar,
          };
        }
      }

      question = answer.hint;

      let choices = this.populateChoices(answer, gameOrder);

      if (this.props.wideMode) {
        choices = [...choices, { val: question, q: true }];
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

  /**
   * @param {Choice} answered
   */
  checkAnswer(answered) {
    if (answered.val === this.state.answer?.val) {
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

  /**
   * @param {number} index
   */
  choiceButton(index) {
    const choices = this.state.choices;
    const answer = this.state.answer;
    const correct = this.state.correct;
    const choiceN = this.props.choiceN;

    const isWrong = this.state.wrongs.includes(index);
    const isRight = choices[index].val === answer.val && correct;

    const choiceCSS = classNames({
      clickable: !choices[index].q,
      "text-center": true,
      "correct-color":
        isRight || (this.props.wideMode && choices[index].q && correct),
      "incorrect-color": isWrong,
      "question-color": this.props.wideMode && choices[index].q && !correct,
    });

    const choiceH2CSS = classNames({
      "mb-0": this.props.wideMode,
    });

    const hintH6CSS = classNames({
      "mb-0": true,
      "transparent-color": !isWrong,
    });

    const wide = this.props.wideMode ? 3 / 4 : 1;

    const width =
      Math.trunc((1 / Math.ceil(Math.sqrt(choiceN))) * wide * 100) + "%";

    const englishShown = !this.state.practiceSide;

    let hintElement;
    if (!this.props.easyMode || (this.props.easyMode && !englishShown)) {
      console.log(JSON.stringify(this.props.easyMode) + "1");
      if (choices[index].q !== true) {
        // the choices
        hintElement = (
          <div className="d-flex justify-content-around">
            <h6 className={hintH6CSS}>
              {choices[index].cSet === answer.cSet
                ? choices[index].hint
                : swapKana(choices[index].hint)}
            </h6>
          </div>
        );
      } else {
        // the question
        hintElement = undefined;
      }
    } else {
      // easymode
      if (choices[index].q !== true) {
        // the choices
        hintElement = (
          <div className="d-flex justify-content-around">
            <h6 className={hintH6CSS}>
              {choices[index].cSet === 0
                ? choices[index].hint
                : swapKana(choices[index].hint)}
            </h6>
            <h6 className={hintH6CSS}>
              {choices[index].cSet === 0
                ? swapKana(choices[index].hint)
                : choices[index].hint}
            </h6>
          </div>
        );
      } else {
        // the question
        hintElement = (
          <div className="d-flex justify-content-around">
            <h6 className="mb-0">{swapKana(choices[index].val)}</h6>
          </div>
        );
      }
    }

    return (
      <div
        key={index}
        onClick={() => {
          if (!choices[index].q) {
            this.checkAnswer(choices[index]);
          }
        }}
        className={choiceCSS}
        style={{ width }}
      >
        <h2 className={choiceH2CSS}>{choices[index].val}</h2>
        {hintElement}
      </div>
    );
  }

  render() {
    if (!this.state.question) return <div />;

    const question = this.state.question;
    const choices = this.state.choices;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);
    const mainPanel = classNames({
      "hiragana main-panel h-100": true,
      "z-index-1": this.props.debug !== DEBUG_OFF,
    });

    const choiceAreaCSS = classNames({
      "choices-row d-flex justify-content-around": true,
      "w-50": !this.props.wideMode,
      "w-100": this.props.wideMode,
    });

    return [
      <div key={0} className={mainPanel}>
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--blue"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          {!this.props.wideMode && (
            <div
              className={classNames({
                "pt-3 d-flex flex-column justify-content-center text-center w-50": true,
                "correct-color": this.state.correct,
              })}
            >
              <h1 className="clickable">{question}</h1>
              {this.props.easyMode && !this.state.practiceSide && (
                <div className="d-flex justify-content-around">
                  <h6>{swapKana(question)}</h6>
                </div>
              )}
            </div>
          )}
          <div className={choiceAreaCSS}>
            <div className="choices-column w-100 d-flex flex-wrap ">
              {choices.map((c, i) => this.choiceButton(i))}
            </div>
          </div>
          <StackNavButton
            color={"--blue"}
            ariaLabel="Next"
            action={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={1} className="options-bar mb-2 flex-shrink-1">
        <div className="row">
          <div className="col">
            <div
              onClick={() => {
                this.setState((/** @type {KanaGameState} */ state) => ({
                  practiceSide: !state.practiceSide,
                }));
              }}
            >
              <FontAwesomeIcon
                className="clickable"
                icon={this.state.practiceSide ? faGlasses : faPencilAlt}
              />
            </div>
          </div>
          <div className="col"></div>
          <div className="col"></div>
        </div>
      </div>,
    ];
  }
}

const mapStateToProps = (state) => {
  return {
    hiragana: state.kana.hiragana,
    katakana: state.kana.katakana,
    vowels: state.kana.vowels,
    consonants: state.kana.consonants,
    sounds: state.kana.sounds,
    choiceN: state.settings.kana.wideMode ? 31 : state.settings.kana.choiceN,
    wideMode: state.settings.kana.wideMode,
    easyMode: state.settings.kana.easyMode,
    charSet: state.settings.kana.charSet,
    debug: state.settings.global.debug,
  };
};

KanaGame.propTypes = {
  hiragana: PropTypes.array.isRequired,
  katakana: PropTypes.array.isRequired,
  getKana: PropTypes.func,
  vowels: PropTypes.array.isRequired,
  consonants: PropTypes.array.isRequired,
  choiceN: PropTypes.number.isRequired,
  sounds: PropTypes.object.isRequired,
  wideMode: PropTypes.bool,
  easyMode: PropTypes.bool,
  charSet: PropTypes.number,
  debug: PropTypes.number,
};

export default connect(mapStateToProps, { getKana })(KanaGame);

export { KanaGameMeta };
