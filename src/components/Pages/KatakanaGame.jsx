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

const KatakanaGameMeta = {
  location: "/kana/",
  label: "仮名 Game",
};

class KatakanaGame extends Component {
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

  getPronunciation(consonant, vowel) {
    const vowels = this.props.vowels;
    const consonants = this.props.consonants;

    const sound = consonants[consonant] + vowels[vowel];

    return this.props.sounds[sound] || sound;
  }

  getKanaCharacter(consonant, vowel, set) {
    let kana;

    let useChar = set;
    if(set === 2){
      useChar = Math.floor(Math.random() * 2);
    }

    if (useChar === 0) {
      kana = this.props.hiragana[consonant][vowel];
    } else {
      kana = this.props.katakana[consonant][vowel];
    }

    return kana;
  }

  /**
   * @returns {String[]} a shuffled list of choices containing the answer
   * @param {*} answer
   * @param {*} gameOrder
   */
  populateChoices(answer, gameOrder) {
    const choices = [answer];

    const difficult = this.state.practiceSide;

    while (choices.length < this.props.choiceN) {
      const min = 0;
      const max = Math.floor(gameOrder.length);
      const idx = Math.floor(Math.random() * (max - min) + min);

      const cPronunciation = this.getPronunciation(
        gameOrder[idx].consonant,
        gameOrder[idx].vowel
      );
      const cCharacter = this.getKanaCharacter(
        gameOrder[idx].consonant,
        gameOrder[idx].vowel,
        this.props.charSet
      );
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
        const pronunciation = this.getPronunciation(consonant, vowel);
        const character = this.getKanaCharacter(
          consonant,
          vowel,
          this.props.charSet
        );

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

    return [
      <div key={0} className="hiragana main-panel h-100">
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--blue"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>
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
                this.setState((state) => ({
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
    charSet: state.settings.kana.charSet,
  };
};

KatakanaGame.propTypes = {
  hiragana: PropTypes.array.isRequired,
  katakana: PropTypes.array.isRequired,
  getKana: PropTypes.func,
  vowels: PropTypes.array.isRequired,
  consonants: PropTypes.array.isRequired,
  choiceN: PropTypes.number.isRequired,
  sounds: PropTypes.object.isRequired,
  wideMode: PropTypes.bool,
  charSet: PropTypes.number,
};

export default connect(mapStateToProps, { getKana })(KatakanaGame);

export { KatakanaGameMeta };
