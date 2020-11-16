import React, { Component } from "react";
import { connect } from "react-redux";

import { getHiragana } from "../../actions/hiraganaAct";
import { shuffleArray } from "../../helper/arrayHelper";

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
    };

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.prepareGame = this.prepareGame.bind(this);
    this.checkAnswer = this.checkAnswer.bind(this);

    // only fetch data on very first initialization
    if (!this.props.hiragana || this.props.hiragana.length === 0) {
      // console.log('fetching')
      this.props.getHiragana();
    }
  }

  componentWillMount() {
    // page navigation after initialcenter
    // data retrival done, set up game
    if (this.props.hiragana && this.props.hiragana.length > 0) {
      this.prepareGame();
    }
  }

  componentDidMount() {}

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
  }

  prepareGame() {
    if (this.props.hiragana.length > 0) {
      // console.log("preparing");
      const vowels = this.props.vowels;
      const consonants = this.props.consonants;

      const xMax = Math.floor(this.props.hiragana[0].length);
      const yMax = Math.floor(this.props.hiragana.length);

      let gameOrder = [];
      if (this.state.gameOrder === false) {
        for (let x = 0; x < xMax; x++) {
          for (let y = 0; y < yMax; y++) {
            // should not include yi, ye or wu
            if (
              (x != 1 || y != 12) &&
              (x != 3 || y != 12) &&
              (x != 2 || y != 14)
            )
              gameOrder.push({ x, y });
          }
        }
        shuffleArray(gameOrder);
      } else {
        gameOrder = this.state.gameOrder;
      }

      const xIdx = gameOrder[this.state.selectedIndex].x;
      const yIdx = gameOrder[this.state.selectedIndex].y;

      const question = { japanese: this.props.hiragana[yIdx][xIdx] };

      const answer = { japanese: consonants[yIdx] + vowels[xIdx] };

      let choices = [answer.japanese];

      while (choices.length < 4) {
        const min = 0;
        const max = Math.floor(gameOrder.length);
        const idx = Math.floor(Math.random() * (max - min) + min);

        const choice = consonants[gameOrder[idx].y] + vowels[gameOrder[idx].x];

        // should not add duplicates or the right answer
        if (choices.indexOf(choice) === -1) {
          choices.push(choice);
        }
      }

      choices = choices.map((c) => ({ japanese: c }));
      shuffleArray(choices);
      this.setState({ question, answer, choices, gameOrder });
    }
  }

  checkAnswer(answered) {
    if (answered.japanese === this.state.answer.japanese) {
      // console.log("RIGHT!");
      this.gotoNext();
    } else {
      // console.log("WRONG");
      // TODO: show hiragana of wrong selection
    }
  }

  gotoNext() {
    const l = this.state.gameOrder.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
    });
  }

  gotoPrev() {
    const l = this.state.gameOrder.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
    });
  }

  render() {
    // TODO: cleanup
    if (
      !this.props.hiragana ||
      this.props.hiragana.length < 1 ||
      this.state.question === false
    )
      return <div className="text-center">loading</div>;

    const question = this.state.question;
    const answer = this.state.answer;
    const choices = this.state.choices;

    // console.log(question);
    // console.log(answer);
    // console.log(choices);

    return (
      <div className="hiragana" style={{ height: "75%" }}>
        <div
          className="d-flex justify-content-between"
          style={{ height: "100%" }}
        >
          <button
            type="button"
            className="btn btn-danger"
            onClick={this.gotoPrev}
          >
            prev
          </button>
          <div className="pt-3 d-flex flex-column justify-content-around text-center w-50">
            <h1>{question.japanese}</h1>
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
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[1]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center"
              >
                <h2>{choices[1].japanese}</h2>
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
              </div>
              <div
                onClick={() => {
                  this.checkAnswer(choices[3]);
                }}
                className="pt-3 d-flex flex-column justify-content-around text-center"
              >
                <h2>{choices[3].japanese}</h2>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger"
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
    hiragana: state.hiragana.characters,
    vowels: state.hiragana.vowels,
    consonants: state.hiragana.consonants,
  };
};

export default connect(mapStateToProps, { getHiragana })(HiraganaGame);

export { HiraganaGameMeta };
