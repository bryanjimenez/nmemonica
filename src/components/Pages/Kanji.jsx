import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";

import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { swipeEnd, swipeMove, swipeStart } from "../../helper/TouchSwipe";
import { getKanji } from "../../actions/kanjiAct";
import {
  getTerm,
  getTermUID,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { logger } from "../../actions/consoleAct";
import { TermFilterBy } from "../../actions/settingsAct";

import { getVocabulary } from "../../actions/vocabularyAct";
import { JapaneseText } from "../../helper/JapaneseText";
import classNames from "classnames";

import "./Kanji.css";
import { LinearProgress } from "@mui/material";
import { shuffleArray } from "../../helper/arrayHelper";

/**
 * @typedef {import("react").TouchEventHandler} TouchEventHandler
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 */

/**
 * @typedef {Object} KanjiProps
 * @property {RawKanji[]} kanji
 * @property {RawVocabulary[]} vocabulary
 * @property {string[]} activeTags
 * @property {number} swipeThreshold
 * @property {typeof getKanji} getKanji
 * @property {typeof getVocabulary} getVocabulary
 * @property {typeof logger} logger
 */

/**
 * @typedef {Object} KanjiState
 * @property {number} selectedIndex
 * @property {RawKanji[]} filteredTerms
 * @property {boolean} showOn
 * @property {boolean} showKun
 * @property {boolean} showEx
 * @property {boolean} showMeaning
 * @property {any} [swiping]
 * @property {number[]} order
 */

const KanjiMeta = {
  location: "/kanji/",
  label: "Kanji",
};

class Kanji extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {KanjiState} */
    this.state = {
      selectedIndex: 0,
      filteredTerms: [],
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
      order: [],
    };

    /** @type {KanjiProps} */
    this.props;

    /** @type {import("../../typings/raw").SetState<KanjiState>} */
    this.setState;

    if (this.props.kanji.length === 0) {
      this.props.getKanji();
    }

    if (this.props.vocabulary.length === 0) {
      this.props.getVocabulary();
    }

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoNextSlide = this.gotoNextSlide.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.startMove = this.startMove.bind(this);
    this.inMove = this.inMove.bind(this);
    this.endMove = this.endMove.bind(this);
    this.swipeActionHandler = this.swipeActionHandler.bind(this);
  }

  componentDidMount() {
    if (this.props.kanji && this.props.kanji.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }
  }

  /**
   * @param {KanjiProps} prevProps
   */
  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.kanji.length !== prevProps.kanji.length) {
      // console.log("got game data");
      this.setOrder();
    }
  }

  setOrder() {
    const filteredTerms = termFilterByType(
      TermFilterBy.TAGS,
      this.props.kanji,
      null,
      this.props.activeTags,
      null
    );

    const order = randomOrder(filteredTerms);

    this.setState({
      filteredTerms,
      order,
    });
  }

  gotoNext() {
    const l = this.state.filteredTerms.length;
    const newSel = (this.state.selectedIndex + 1) % l;

    this.setState({
      selectedIndex: newSel,
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
    });
  }

  gotoNextSlide() {
    this.gotoNext();
  }

  gotoPrev() {
    const l = this.state.filteredTerms.length;
    const i = this.state.selectedIndex - 1;

    let newSel = i < 0 ? (l + i) % l : i % l;

    this.setState({
      selectedIndex: newSel,
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
    });
  }

  /**
   * @type {TouchEventHandler}
   */
  startMove(e) {
    const swiping = swipeStart(e, {
      verticalSwiping: true,
      touchThreshold: this.props.swipeThreshold,
    });
    this.setState({ swiping });
  }

  /**
   * @type {TouchEventHandler}
   */
  inMove(e) {
    if (this.state.swiping) {
      const swiping = swipeMove(e, this.state.swiping);
      this.setState({ swiping });
    }
  }

  /**
   * @type {TouchEventHandler}
   */
  endMove(e) {
    // const direction = getSwipeDirection(this.state.swiping.touchObject,true);
    swipeEnd(e, { ...this.state.swiping, onSwipe: this.swipeActionHandler });
  }

  /**
   * @param {string} direction
   */
  swipeActionHandler(direction) {
    // this.props.logger("swiped " + direction, 3);

    if (direction === "left") {
      this.gotoNextSlide();
    } else if (direction === "right") {
      this.gotoPrev();
    } else {
      if (direction === "up") {
        // up
        // kun
      } else if (direction === "down") {
        // down
        // on
      }
    }
  }

  render() {
    if (this.state.filteredTerms.length < 1)
      return <NotReady addlStyle="main-panel" />;

    const uid = getTermUID(
      this.state.selectedIndex,
      this.state.order,
      this.state.filteredTerms
    );

    /** @type {RawKanji} */
    const term = getTerm(uid, this.props.kanji);
    const radicalLevel =
      term.tag.find((t) => t.startsWith("Level_"))?.replace("Level_", "") || "";
    const found = shuffleArray(
      this.props.vocabulary.filter(
        (v) =>
          JapaneseText.parse(v).getSpelling().includes(term.kanji) &&
          v.english.toLowerCase() !== term.english.toLowerCase()
      )
    );

    const maxShowEx = 3;
    const examples = found.slice(0, maxShowEx).map((el, k, arr) => (
      <React.Fragment key={k}>
        {el.english + " "}
        {JapaneseText.parse(el).toHTML()}
        {k < arr.length - 1 ? "; " : ""}
        <wbr />
      </React.Fragment>
    ));

    const inJapanese = found.find(
      (v) => v.english.toLowerCase() === term.english.toLowerCase()
    );
    const meaning = (
      <div>
        <div>
          <span>{term.english}</span>
        </div>
        <div>{inJapanese && JapaneseText.parse(inJapanese).toHTML()}</div>
      </div>
    );

    const progress =
      ((this.state.selectedIndex + 1) / this.state.filteredTerms.length) * 100;

    let page = [
      <div key={0} className="kanji main-panel h-100">
        <div
          className="d-flex justify-content-between h-100"
          onTouchStart={
            this.props.swipeThreshold > 0 ? this.startMove : undefined
          }
          onTouchMove={this.props.swipeThreshold > 0 ? this.inMove : undefined}
          onTouchEnd={this.props.swipeThreshold > 0 ? this.endMove : undefined}
        >
          <StackNavButton ariaLabel="Previous" action={this.gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          <div className="grp-info">
            <div>
              <div>{term.grp}</div>
              <div>{radicalLevel}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="">
              <h1 className="pt-0">
                <span>{term.kanji}</span>
              </h1>
              {/* temp spacer */}
              {!term.on && !term.kun && (
                <div>
                  <h3 className="pt-0">.</h3>
                  <h3 className="pt-2">.</h3>
                </div>
              )}

              {term.on && (
                <h3
                  className="pt-0"
                  onClick={() => {
                    this.setState((state) => ({
                      showOn: !state.showOn,
                    }));
                  }}
                >
                  <span>{this.state.showOn ? term.on : "[On]"}</span>
                </h3>
              )}
              {term.kun && (
                <h3
                  className="pt-2"
                  onClick={() => {
                    this.setState((state) => ({
                      showKun: !state.showKun,
                    }));
                  }}
                >
                  <span>{this.state.showKun ? term.kun : "[Kun]"}</span>
                </h3>
              )}
              {[examples].length > 0 && (
                <div
                  className={classNames({
                    "example-blk clickable h6 pt-2": true,
                    "disabled-color": examples.length === 0,
                  })}
                  onClick={() => {
                    this.setState((state) => ({
                      showEx: !state.showEx,
                    }));
                  }}
                >
                  <span className="text-nowrap">
                    {this.state.showEx && examples.length > 0
                      ? examples
                      : "[Examples]"}
                  </span>
                </div>
              )}
              <h3
                className="pt-2 clickable"
                onClick={() => {
                  this.setState((state) => ({
                    showMeaning: !state.showMeaning,
                  }));
                }}
              >
                {this.state.showMeaning ? meaning : <span>{"[Meaning]"}</span>}
              </h3>
            </div>
          </div>
          <div className="right-info"></div>

          <StackNavButton ariaLabel="Next" action={this.gotoNextSlide}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={2} className="progress-line flex-shrink-1">
        <LinearProgress
          variant="determinate"
          value={progress}
          // color={phrase_reinforce ? "secondary" : "primary"}
        />
      </div>,
    ];

    return page;
  }
}
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    kanji: state.kanji.value,
    vocabulary: state.vocabulary.value,

    activeTags: state.settings.kanji.activeTags,
    swipeThreshold: state.settings.global.swipeThreshold,
  };
};

Kanji.propTypes = {
  kanji: PropTypes.array,
  vocabulary: PropTypes.array,
  activeTags: PropTypes.array,
  swipeThreshold: PropTypes.number,
  getKanji: PropTypes.func,
  getVocabulary: PropTypes.func,
  logger: PropTypes.func,
};

export default connect(mapStateToProps, {
  getKanji,
  getVocabulary,
  logger,
})(Kanji);

export { KanjiMeta };
