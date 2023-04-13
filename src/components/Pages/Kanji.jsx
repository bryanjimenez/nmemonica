import { LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";

import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";

import { logger } from "../../slices/settingSlice";
import { getKanji } from "../../slices/kanjiSlice";
import {
  addFrequencyKanji,
  removeFrequencyKanji,
  toggleKanjiFilter,
} from "../../slices/settingSlice";
import { getVocabulary } from "../../slices/vocabularySlice";
import { TermFilterBy } from "../../slices/settingHelper";

import { shuffleArray } from "../../helper/arrayHelper";
import {
  getTerm,
  getTermUID,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { swipeEnd, swipeMove, swipeStart } from "../../helper/TouchSwipe";

import {
  FrequencyTermIcon,
  ToggleFrequencyTermBtnMemo,
} from "../Form/OptionsBar";
import "./Kanji.css";
import { isGroupLevel } from "./SetTermTagList";

/**
 * @typedef {import("react").TouchEventHandler} TouchEventHandler
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * @typedef {Object} KanjiProps
 * @property {RawKanji[]} kanji
 * @property {RawVocabulary[]} vocabulary
 * @property {string[]} activeTags
 * @property {number} swipeThreshold
 * @property {typeof getKanji} getKanji
 * @property {typeof getVocabulary} getVocabulary
 * @property {typeof toggleKanjiFilter} toggleKanjiFilter
 * @property {typeof TermFilterBy[keyof TermFilterBy]} filterType
 * @property {boolean} reinforce
 * @property {SpaceRepetitionMap} repetition
 * @property {{uid: string, count: number}} frequency       value of *last* frequency word update
 * @property {typeof removeFrequencyKanji} removeFrequencyKanji
 * @property {typeof addFrequencyKanji} addFrequencyKanji
 * @property {typeof logger} logger
 */

/**
 * @typedef {Object} KanjiState
 * @property {number} selectedIndex
 * @property {string} [reinforcedUID]
 * @property {RawKanji[]} filteredTerms
 * @property {string[]} frequency     subset of frequency words within current active group
 * @property {boolean} showOn
 * @property {boolean} showKun
 * @property {boolean} showEx
 * @property {boolean} showMeaning
 * @property {any} [swiping]
 * @property {number[]} order
 * @property {RawVocabulary[]} examples
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
      frequency: [],
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
      order: [],
      examples: [],
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

    this.updateReinforcedUID = this.updateReinforcedUID.bind(this);
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
   * @param {KanjiState} prevState
   *
   */
  componentDidUpdate(prevProps, prevState) {
    if (this.props.kanji.length !== prevProps.kanji.length) {
      this.setOrder();
    }

    if (
      this.props.frequency.uid != prevProps.frequency.uid ||
      this.props.frequency.count != prevProps.frequency.count
    ) {
      if (
        this.props.filterType === TermFilterBy.FREQUENCY &&
        this.props.frequency.count === 0
      ) {
        // last frequency word was removed
        this.setOrder();
      } else {
        const filteredKeys = this.state.filteredTerms.map((f) => f.uid);
        const frequency = filteredKeys.reduce(
          (/** @type {string[]} */ acc, cur) => {
            if (this.props.repetition[cur]?.rein === true) {
              acc = [...acc, cur];
            }
            return acc;
          },
          []
        );
        // props.frequency is a count of frequency terms
        // state.frequency is a subset list of frequency term within current active group
        this.setState({ frequency });
      }
    }

    // find examples
    if (
      this.state.order.length > 0 &&
      (this.state.order.length !== prevState.order.length ||
        this.state.selectedIndex !== prevState.selectedIndex ||
        this.state.reinforcedUID != prevState.reinforcedUID)
    ) {
      const uid =
        this.state.reinforcedUID ||
        getTermUID(
          this.state.selectedIndex,
          this.state.order,
          this.state.filteredTerms
        );

      /** @type {RawKanji} */
      const term = getTerm(uid, this.props.kanji);

      const match = this.props.vocabulary.filter(
        (v) =>
          (JapaneseText.parse(v).getSpelling().includes(term.kanji) &&
            v.english.toLowerCase() === term.english.toLowerCase()) ||
          (JapaneseText.parse(v).getSpelling().includes(term.kanji) &&
            v.english.toLowerCase().includes(term.english.toLowerCase()) &&
            v.grp === "Verb") ||
          (JapaneseText.parse(v).getSpelling() === term.kanji &&
            (v.english.toLowerCase().includes(term.english.toLowerCase()) ||
              term.english.toLowerCase().includes(v.english.toLowerCase())))
      );

      /** @type {RawVocabulary[]} */
      let examples = [];
      if (match.length > 0) {
        const [first, ...theRest] = orderBy(match, (ex) => ex.english.length);
        examples = [first, ...shuffleArray(theRest)];
      }

      this.setState({ examples });
    }
  }

  setOrder() {
    const allFrequency = Object.keys(this.props.repetition).reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (this.props.repetition[cur].rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    let filteredTerms = termFilterByType(
      this.props.filterType,
      this.props.kanji,
      allFrequency,
      this.props.filterType === TermFilterBy.TAGS ? this.props.activeTags : [],
      () => this.props.toggleKanjiFilter(TermFilterBy.TAGS)
    );

    const newOrder = randomOrder(filteredTerms);

    // needed if using frequency from filteredTerms not all Frequency
    // const filteredKeys = filteredTerms.map((f) => f.uid);
    // const frequency = filteredKeys.reduce(
    //   (/** @type {string[]} */ acc, cur) => {
    //     if (this.props.repetition[cur]?.rein === true) {
    //       acc = [...acc, cur];
    //     }
    //     return acc;
    //   },
    //   []
    // );

    this.setState({
      filteredTerms,
      // frequency,
      frequency: allFrequency,
      order: newOrder,
    });
  }

  /**
   * @param {string} uid
   */
  updateReinforcedUID(uid) {
    this.setState({
      reinforcedUID: uid,
    });
  }

  gotoNext() {
    const l = this.state.filteredTerms.length;
    const newSel = (this.state.selectedIndex + 1) % l;

    this.setState({
      selectedIndex: newSel,
      reinforcedUID: undefined,
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
    });
  }

  gotoNextSlide() {
    let filtered = this.state.filteredTerms;
    // include frequency terms outside of filtered set
    if (this.props.reinforce && this.props.filterType === TermFilterBy.TAGS) {
      const allFrequency = Object.keys(this.props.repetition).reduce(
        (/** @type {string[]}*/ acc, cur) => {
          if (this.props.repetition[cur].rein === true) {
            acc = [...acc, cur];
          }
          return acc;
        },
        []
      );

      const additional = this.props.kanji.filter((k) =>
        allFrequency.includes(k.uid)
      );
      filtered = [...this.state.filteredTerms, ...additional];
    }

    play(
      this.props.reinforce,
      this.props.filterType,
      this.state.frequency,
      // this.state.filteredTerms,
      filtered,
      this.state.reinforcedUID,
      this.updateReinforcedUID,
      this.gotoNext,
      this.props.removeFrequencyKanji
    );
  }

  gotoPrev() {
    const l = this.state.filteredTerms.length;
    const i = this.state.selectedIndex - 1;

    let newSel = i < 0 ? (l + i) % l : i % l;

    this.setState({
      selectedIndex: newSel,
      reinforcedUID: undefined,
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

    const uid =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredTerms
      );

    /** @type {RawKanji} */
    const term = getTerm(uid, this.props.kanji);
    const aGroupLevel =
      term.tag
        .find((t) => this.props.activeTags.includes(t) && isGroupLevel(t))
        ?.replace("_", " ") ||
      term.tag.find((t) => isGroupLevel(t))?.replace("_", " ") ||
      "";

    const term_reinforce = this.props.repetition[term.uid]?.rein === true;

    const maxShowEx = 3;
    const examples = this.state.examples
      .slice(0, maxShowEx)
      .map((el, k, arr) => (
        <React.Fragment key={k}>
          {el.english + " "}
          {JapaneseText.parse(el).toHTML()}
          {k < arr.length - 1 ? "; " : ""}
          <wbr />
        </React.Fragment>
      ));

    const meaning = <span>{term.english}</span>;

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
              <div>{aGroupLevel}</div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="pt-0">
              <span>{term.kanji}</span>
            </h1>
            {(term.on && (
              <h4
                className="pt-0"
                onClick={() => {
                  this.setState((state) => ({
                    showOn: !state.showOn,
                  }));
                }}
              >
                <span>{this.state.showOn ? term.on : "[On]"}</span>
              </h4>
            )) || <h4 className="pt-0">.</h4>}
            {(term.kun && (
              <h4
                className="pt-2"
                onClick={() => {
                  this.setState((state) => ({
                    showKun: !state.showKun,
                  }));
                }}
              >
                <span>{this.state.showKun ? term.kun : "[Kun]"}</span>
              </h4>
            )) || <h4 className="pt-2">.</h4>}
            <div className="d-flex flex-column">
              <span
                className={classNames({
                  "example-blk align-self-center clickable h6 pt-2": true,
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
              </span>

              <h4
                className="align-self-center pt-2 clickable"
                onClick={() => {
                  this.setState((state) => ({
                    showMeaning: !state.showMeaning,
                  }));
                }}
              >
                {this.state.showMeaning ? meaning : <span>{"[Meaning]"}</span>}
              </h4>
            </div>
          </div>
          <div className="right-info"></div>

          <StackNavButton ariaLabel="Next" action={this.gotoNextSlide}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={1} className="options-bar mb-3 flex-shrink-1">
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start"></div>
          </div>
          <div className="col text-center">
            <FrequencyTermIcon
              visible={
                this.state.reinforcedUID !== undefined &&
                this.state.reinforcedUID !== ""
              }
            />
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <ToggleFrequencyTermBtnMemo
                addFrequencyTerm={this.props.addFrequencyKanji}
                removeFrequencyTerm={this.props.removeFrequencyKanji}
                toggle={term_reinforce}
                term={term}
                count={this.state.frequency.length}
              />
            </div>
          </div>
        </div>
      </div>,
      <div key={2} className="progress-line flex-shrink-1">
        <LinearProgress
          variant="determinate"
          value={progress}
          color={term_reinforce ? "secondary" : "primary"}
        />
      </div>,
    ];

    return page;
  }
}

const mapStateToProps = (/** @type {RootState} */ state) => {
  return {
    kanji: state.kanji.value,
    vocabulary: state.vocabulary.value,

    filterType: state.setting.kanji.filter,
    reinforce: state.setting.kanji.reinforce,
    activeTags: state.setting.kanji.activeTags,
    repetition: state.setting.kanji.repetition,
    frequency: state.setting.kanji.frequency,

    swipeThreshold: state.setting.global.swipeThreshold,
  };
};

Kanji.propTypes = {
  kanji: PropTypes.array,
  vocabulary: PropTypes.array,
  frequency: PropTypes.object,
  filterType: PropTypes.number,
  activeTags: PropTypes.array,
  swipeThreshold: PropTypes.number,
  getKanji: PropTypes.func,
  getVocabulary: PropTypes.func,
  toggleKanjiFilter: PropTypes.func,
  reinforce: PropTypes.bool,
  repetition: PropTypes.object,
  removeFrequencyKanji: PropTypes.func,
  addFrequencyKanji: PropTypes.func,
  logger: PropTypes.func,
};

export default connect(mapStateToProps, {
  getKanji,
  getVocabulary,
  toggleKanjiFilter,
  removeFrequencyKanji,
  addFrequencyKanji,
  logger,
})(Kanji);

export { KanjiMeta };
