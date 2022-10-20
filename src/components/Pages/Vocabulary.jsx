import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import {
  getVocabulary,
  pushedPlay,
  setPreviousWord,
} from "../../actions/vocabularyAct";
import {
  faBan,
  faDice,
  faGlasses,
  faHeadphones,
  faPencilAlt,
  faRecycle,
  faRunning,
  faSuperscript,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  AUTOPLAY_OFF,
  updateSpaceRepWord,
  AUTOPLAY_JP_EN,
  AUTOPLAY_EN_JP,
  toggleFurigana,
} from "../../actions/settingsAct";
import { audioPronunciation, JapaneseText } from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { Avatar, Grow, LinearProgress } from "@material-ui/core";
import VocabularyOrderSlider from "../Form/VocabularyOrderSlider";
import VocabularyMain from "./VocabularyMain";
import VerbMain from "./VerbMain";
import { deepOrange } from "@material-ui/core/colors";
import {
  alphaOrder,
  play,
  minimumTimeForSpaceRepUpdate,
  randomOrder,
  spaceRepOrder,
  termFilterByType,
  verbToTargetForm,
  getTermUID,
  getTerm,
  getCacheUID,
  loopN,
  pause,
} from "../../helper/gameHelper";
import { FILTER_FREQ, FILTER_REP } from "../../actions/settingsAct";
import { logger } from "../../actions/consoleAct";
import { spaceRepLog } from "../../helper/consoleHelper";
import {
  swipeEnd,
  swipeMove,
  swipeStart,
} from "react-slick/lib/utils/innerSliderUtils";
import { pronounceEndoint } from "../../../environment.development";
import { addParam } from "../../helper/urlHelper";
import classNames from "classnames";
import { BtnShowHint } from "../Form/BtnShowHint";
import { LoopSettingBtn, LoopStartBtn, LoopStopBtn } from "../Form/BtnLoop";
import {
  mediaSessionAttach,
  mediaSessionDetachAll,
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
} from "../../helper/mediaHelper";

/**
 * @typedef {import("react").TouchEventHandler} TouchEventHandler
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {import("../Form/VocabularyOrderSlider").BareIdx} BareIdx
 * @typedef {{nextUID:string, nextIndex?:undefined}|{nextUID?:undefined, nextIndex:number}} MEid
 * @typedef {import("../../typings/raw").ActionHandlerTuple} ActionHandlerTuple
 */

/**
 * @typedef {{
 * lastNext:number, selectedIndex: number
 * reinforcedUID?: string,
 * showHint: boolean,
 * filteredVocab: RawVocabulary[],
 * frequency: string[],
 * order?: number[],
 * naFlip?: string,
 * swiping?: any,
 * showPageBar?: boolean,
 * recacheAudio: boolean,
 * scrollJOrder?: boolean,
 * ebare: BareIdx[],
 * jbare: BareIdx[],
 * loop: 0|1|2|3,
 * }} VocabularyState
 */

/**
 * @typedef {{
 * activeGroup: string[],
 * addFrequencyWord: function,
 * removeFrequencyWord: function,
 * frequency: string[],
 * getVocabulary: function,
 * vocab: RawVocabulary[],
 * hintEnabled: boolean,
 * romajiActive: boolean,
 * flipVocabularyPracticeSide: function,
 * practiceSide: boolean,
 * isOrdered: boolean,
 * autoPlay: number,
 * scrollingDone: boolean,
 * scrollingState: function,
 * autoVerbView: boolean,
 * toggleAutoVerbView: function,
 * filterType: number,
 * toggleVocabularyFilter: function,
 * reinforce: boolean,
 * previous: RawVocabulary,
 * setPreviousWord: function,
 * repetition: SpaceRepetitionMap,
 * lastNext: number,
 * updateSpaceRepWord: function,
 * logger: function,
 * verbForm: string,
 * pushedPlay: function,
 * touchSwipe: boolean,
 * toggleFurigana: function,
 * }} VocabularyProps
 */

const VocabularyMeta = {
  location: "/vocabulary/",
  label: "Vocabulary",
};

class Vocabulary extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {VocabularyState} */
    this.state = {
      lastNext: Date.now(),
      selectedIndex: 0,
      showHint: false,
      filteredVocab: [],
      frequency: [], // subset of frequency words within current active group
      recacheAudio: false,
      jbare: [],
      ebare: [],
      loop: 0,
    };

    /** @type {VocabularyProps} */
    this.props;

    if (this.props.vocab.length === 0) {
      this.props.getVocabulary();
    }

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoNextSlide = this.gotoNextSlide.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.updateReinforcedUID = this.updateReinforcedUID.bind(this);
    this.verbNonVerbTransition = this.verbNonVerbTransition.bind(this);
    this.startMove = this.startMove.bind(this);
    this.inMove = this.inMove.bind(this);
    this.endMove = this.endMove.bind(this);
    this.swipeActionHandler = this.swipeActionHandler.bind(this);
    this.beginLoop = this.beginLoop.bind(this);
    this.looperSwipe = this.looperSwipe.bind(this);
    this.abortLoop = this.abortLoop.bind(this);
    this.arrowKeyPress = this.arrowKeyPress.bind(this);
  }

  componentDidMount() {
    // clear existing previous word on mount
    this.props.setPreviousWord(undefined);

    if (this.props.vocab && this.props.vocab.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }

    document.addEventListener("keydown", this.arrowKeyPress, true);

    setMediaSessionMetadata("Vocabulary Loop");
    setMediaSessionPlaybackState("paused");

    /**
     * @type {ActionHandlerTuple[]}
     */
    const actionHandlers = [
      [
        "play",
        () => {
          if (this.state.loop) {
            this.beginLoop();
            setMediaSessionPlaybackState("playing");
          }
        },
      ],
      [
        "pause",
        () => {
          if (this.state.loop) {
            this.abortLoop();
            this.forceUpdate();
            setMediaSessionPlaybackState("paused");
          }
        },
      ],
      [
        "stop",
        () => {
          if (this.state.loop) {
            this.abortLoop();
            this.forceUpdate();
            setMediaSessionPlaybackState("paused");
          }
        },
      ],
      [
        "previoustrack",
        () => {
          if (this.state.loop) {
            this.abortLoop();
            this.looperSwipe("right");
          }
        },
      ],
      [
        "nexttrack",
        () => {
          if (this.state.loop) {
            this.abortLoop();
            this.looperSwipe("left");
          }
        },
      ],
    ];

    mediaSessionAttach(actionHandlers);
  }

  /**
   * @param {VocabularyProps} prevProps
   * @param {VocabularyState} prevState
   */
  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.order !== prevState.order ||
      this.state.selectedIndex !== prevState.selectedIndex ||
      this.state.reinforcedUID !== prevState.reinforcedUID
    ) {
      if (this.state.filteredVocab.length > 0) {
        const uid =
          this.state.reinforcedUID ||
          getTermUID(
            this.state.selectedIndex,
            this.state.order,
            this.state.filteredVocab
          );

        const term = getTerm(uid, this.props.vocab);

        spaceRepLog(this.props.logger, term, this.props.repetition);
      }
    }

    if (this.props.vocab.length !== prevProps.vocab.length) {
      // console.log("got game data");
      this.setOrder();
    }

    if (
      this.props.vocab.length > 0 &&
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("order changed");
      this.setOrder();
    }

    if (
      this.props.activeGroup.length != prevProps.activeGroup.length ||
      this.props.activeGroup.some(
        (/** @type {string} */ e) => !prevProps.activeGroup.includes(e)
      ) ||
      prevProps.activeGroup.some((e) => !this.props.activeGroup.includes(e))
    ) {
      // console.log("activeGroup changed");
      this.setOrder();
    }

    if (
      this.props.frequency.length != prevProps.frequency.length ||
      this.props.frequency.some(
        (/** @type {string} */ e) => !prevProps.frequency.includes(e)
      ) ||
      prevProps.frequency.some((e) => !this.props.frequency.includes(e))
    ) {
      if (
        this.props.filterType === FILTER_FREQ &&
        this.props.frequency.length === 0
      ) {
        this.setOrder();
      } else {
        const filteredKeys = this.state.filteredVocab.map((f) => f.uid);
        const frequency = this.props.frequency.filter(
          (/** @type {string} */ f) => filteredKeys.includes(f)
        );
        // props.frequency is all frequency words
        // state.frequency is a subset of frequency words within current active group
        this.setState({ frequency });
      }
    }

    if (this.state.loop !== prevState.loop) {
      this.abortLoop();
    }

    if (
      this.state.loop > 0 &&
      !this.loopAbortControllers &&
      (this.state.reinforcedUID !== prevState.reinforcedUID ||
        this.state.selectedIndex !== prevState.selectedIndex)
    ) {
      this.beginLoop();
    }
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.arrowKeyPress, true);
    this.abortLoop();

    mediaSessionDetachAll();
  }

  abortLoop() {
    if (this.loopAbortControllers && this.loopAbortControllers.length > 0) {
      this.loopAbortControllers.forEach((ac) => {
        ac.abort();
      });
      this.loopAbortControllers = undefined;

      setMediaSessionPlaybackState("paused");
    }
  }

  beginLoop() {
    setMediaSessionPlaybackState("playing");

    this.abortLoop();
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    const ac3 = new AbortController();

    this.loopAbortControllers = [ac1, ac2, ac3];

    pause(700, ac1)
      .then(() =>
        this.looperSwipe("down").then(() =>
          pause(3000, ac2).then(() =>
            loopN(
              this.state.loop,
              () => this.looperSwipe("up"),
              1500,
              ac3
            ).then(() => {
              this.loopAbortControllers = undefined;
              return this.looperSwipe("left");
            })
          )
        )
      )
      .catch(() => {
        // catch any rejected/aborted promise
      });

    this.forceUpdate();
  }

  /**
   * For the loop
   * @param {string} direction
   */
  looperSwipe(direction) {
    let promise;
    if (this.state.loop > 0) {
      promise = this.swipeActionHandler(direction);
    }
    return promise || Promise.reject("loop disabled");
  }

  /**
   * @param {KeyboardEvent} event
   */
  arrowKeyPress(event) {
    /**
     * @typedef {[string, function][]} ActionHandlerTuple
     * @type {ActionHandlerTuple}
     */
    const actionHandlers = [
      ["ArrowRight", () => this.swipeActionHandler("left")],
      ["ArrowLeft", () => this.swipeActionHandler("right")],
      ["ArrowUp", () => this.swipeActionHandler("up")],
      ["ArrowDown", () => this.swipeActionHandler("down")],
      ["MediaPlayPause", () => {}],
      [" ", this.props.flipVocabularyPracticeSide],
    ];

    for (const [action, handler] of actionHandlers) {
      if (action === event.key) {
        if (action !== " ") {
          if (this.state.loop && this.loopAbortControllers) {
            this.abortLoop();
            this.forceUpdate();
            setMediaSessionPlaybackState("paused");
          }
        }

        handler();
        break;
      }
    }
  }

  setOrder() {
    const filteredVocab = termFilterByType(
      this.props.filterType,
      this.props.vocab,
      this.props.frequency,
      this.props.activeGroup,
      this.props.toggleVocabularyFilter
    );

    let newOrder;
    /** @type {BareIdx[]} */
    let jbare = [];
    /** @type {BareIdx[]} */
    let ebare = [];

    if (!this.props.isOrdered && this.props.filterType !== FILTER_REP) {
      // randomized
      this.props.logger("Randomized", 3);
      newOrder = randomOrder(filteredVocab);
    } else if (this.props.filterType === FILTER_REP) {
      // repetition order
      this.props.logger("Space Rep", 3);
      newOrder = spaceRepOrder(filteredVocab, this.props.repetition);
    } else {
      // alphabetized
      this.props.logger("Alphabetic", 3);
      ({
        order: newOrder,
        jOrder: jbare,
        eOrder: ebare,
      } = alphaOrder(filteredVocab));
    }

    const filteredKeys = filteredVocab.map((f) => f.uid);
    const frequency = this.props.frequency.filter((/** @type {string} */ f) =>
      filteredKeys.includes(f)
    );

    this.setState({
      filteredVocab,
      frequency,
      order: newOrder,
      jbare, // bare min Japanese ordered word list
      ebare, // bare min English ordered word list
      scrollJOrder: true,
    });
  }

  /**
   * @param {MEid} id either an uid or and index
   */
  verbNonVerbTransition({ nextIndex, nextUID }) {
    let aPromise = Promise.resolve();

    const uidPrev =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredVocab
      );
    const prevVocab = getTerm(uidPrev, this.props.vocab);

    let uidNext;
    if (nextIndex === undefined && nextUID !== undefined) {
      uidNext = nextUID;
    } else if (nextIndex !== undefined && nextUID === undefined) {
      uidNext = getTermUID(
        nextIndex,
        this.state.order,
        this.state.filteredVocab
      );
    } else {
      // this will never happen nextIndex and nextUID are xor
      uidNext = "0";
    }

    const nextVocab = getTerm(uidNext, this.props.vocab);

    // non verb to verb
    if (prevVocab.grp !== "Verb" && nextVocab.grp === "Verb") {
      aPromise = this.props.setPreviousWord(prevVocab);
    }

    // verb to non verb
    if (prevVocab.grp === "Verb" && nextVocab.grp !== "Verb") {
      // FIXME: should not put lastVerb in previous
      if (this.props.previous && this.props.previous.lastVerb) {
        // multiple verbs
        // non dictionary form on last verb
        aPromise = this.props.setPreviousWord(this.props.previous.lastVerb);
      } else if (
        this.props.previous &&
        this.props.previous.uid === prevVocab.uid
      ) {
        // single/multiple verb DID form change (on last)
        // prevent overriding same verb diff form
        // setPreviousWord done on VerbMain form change
      } else if (
        this.props.previous &&
        this.props.previous.uid !== prevVocab.uid
      ) {
        // single/multiple no form change
        aPromise = this.props.setPreviousWord(prevVocab);
      }
    }

    return aPromise;
  }

  gotoNext() {
    const l = this.state.filteredVocab.length;
    const newSel = (this.state.selectedIndex + 1) % l;

    this.verbNonVerbTransition({ nextIndex: newSel }).then(() => {
      this.setState({
        lastNext: Date.now(),
        reinforcedUID: undefined,
        selectedIndex: newSel,
        showHint: false,
      });
    });
  }

  gotoNextSlide() {
    const uid =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredVocab
      );
    const vocabulary = getTerm(uid, this.props.vocab);

    // prevent updates when quick scrolling
    if (minimumTimeForSpaceRepUpdate(this.state.lastNext)) {
      const shouldIncrement = !this.state.frequency.includes(vocabulary.uid);
      const repO = this.props.updateSpaceRepWord(
        vocabulary.uid,
        shouldIncrement
      );
      spaceRepLog(this.props.logger, vocabulary, {
        [vocabulary.uid]: repO,
      });
    }

    play(
      this.props.reinforce,
      this.props.filterType,
      this.state.frequency,
      this.state.filteredVocab,
      this.state.reinforcedUID,
      this.updateReinforcedUID,
      this.gotoNext,
      this.props.removeFrequencyWord
    );
  }

  gotoPrev() {
    const l = this.state.filteredVocab.length;
    const i = this.state.selectedIndex - 1;

    let newSel;
    if (this.state.reinforcedUID) {
      newSel = this.state.selectedIndex;
    } else {
      newSel = i < 0 ? (l + i) % l : i % l;
    }

    this.verbNonVerbTransition({ nextIndex: newSel });

    this.setState({
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showHint: false,
    });
  }

  /**
   * @param {string} uid
   */
  updateReinforcedUID(uid) {
    this.verbNonVerbTransition({ nextUID: uid });

    this.setState({
      reinforcedUID: uid,
      showHint: false,
    });

    const vocabulary = getTerm(uid, this.props.vocab);

    this.props.logger("reinforce (" + vocabulary.english + ")", 3);
  }

  /**
   * @type {TouchEventHandler}
   */
  startMove(e) {
    const swiping = swipeStart(e, true, true);
    this.setState({ swiping });
  }

  /**
   * @type {TouchEventHandler}
   */
  inMove(e) {
    if (this.state.swiping) {
      const swiping = swipeMove(e, {
        ...this.state.swiping,
        verticalSwiping: true,
      });
      this.setState({ swiping });
    }
  }

  /**
   * @type {TouchEventHandler}
   */
  endMove(e) {
    // const direction = getSwipeDirection(this.state.swiping.touchObject, true);
    if (this.state.loop && this.loopAbortControllers) {
      const tEl = /** @type {Element} */ (e.target);

      if (
        Array.from(document.getElementsByClassName("loop-stop-btn")).some(
          (el) => el.contains(tEl)
        )
      ) {

        this.setState({ loop: 0 });
        return;
      } else {

        this.abortLoop();
        this.forceUpdate();
        setMediaSessionPlaybackState("paused");
      }
    }

    swipeEnd(e, {
      ...this.state.swiping,
      dragging: true,
      verticalSwiping: true,
      listHeight: 1,
      touchThreshold: 5,
      onSwipe: this.swipeActionHandler,
    });
  }

  /**
   * @param {string} direction
   */
  swipeActionHandler(direction) {
    // this.props.logger("swiped " + direction, 3);
    let swipePromise;

    if (direction === "left") {
      this.gotoNextSlide();
      swipePromise = Promise.resolve();
    } else if (direction === "right") {
      this.gotoPrev();
      swipePromise = Promise.resolve();
    } else {
      const uid =
        this.state.reinforcedUID ||
        getTermUID(
          this.state.selectedIndex,
          this.state.order,
          this.state.filteredVocab
        );
      const vocabulary = getTerm(uid, this.props.vocab);

      const override = this.state.recacheAudio ? "/override_cache" : "";

      if (direction === "up") {
        let sayObj;
        if (vocabulary.grp === "Verb" && this.props.verbForm !== "dictionary") {
          const verb = verbToTargetForm(vocabulary, this.props.verbForm);

          sayObj = {
            ...vocabulary,
            japanese: verb.toString(),
            pronounce: vocabulary.pronounce && verb.getPronunciation(),
            form: this.props.verbForm,
          };
        } else if (JapaneseText.parse(vocabulary).isNaAdj()) {
          const naFlip = this.state.naFlip;
          const naAdj = JapaneseText.parse(vocabulary).append(naFlip && "な");

          sayObj = {
            ...vocabulary,
            japanese: naAdj.toString(),
            pronounce: vocabulary.pronounce && naAdj.getPronunciation(),
            form: naFlip,
          };

          this.setState((/** @type {VocabularyState} */ s) => ({
            naFlip: s.naFlip ? undefined : "-na",
          }));
        } else {
          sayObj = vocabulary;
        }

        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "ja",
          q: audioPronunciation(sayObj),
          uid: getCacheUID(sayObj),
        });

        const japaneseAudio = new Audio(audioUrl);
        try {
          swipePromise = new Promise((resolve) => {
            japaneseAudio.addEventListener("ended", resolve);
          });

          japaneseAudio.play();
        } catch (e) {
          this.props.logger("Swipe Play Error " + e, 1);
        }

        if (this.props.autoPlay !== AUTOPLAY_JP_EN) {
          this.props.pushedPlay(true);
        }
      } else if (direction === "down") {
        const inEnglish = vocabulary.english;

        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "en",
          q: inEnglish,
          uid: vocabulary.uid + ".en",
        });

        const englishAudio = new Audio(audioUrl);
        try {
          swipePromise = new Promise((resolve) => {
            englishAudio.addEventListener("ended", resolve);
          });
          englishAudio.play();
        } catch (e) {
          this.props.logger("Swipe Play Error " + e, 1);
        }

        if (this.props.autoPlay !== AUTOPLAY_EN_JP) {
          this.props.pushedPlay(true);
        }
      }
    }
    return swipePromise || Promise.reject();
  }

  render() {
    if (this.state.filteredVocab.length < 1)
      return <NotReady addlStyle="main-panel" />;

    const uid =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredVocab
      );
    const vocabulary = getTerm(uid, this.props.vocab);
    const vocabulary_reinforce = this.state.frequency.includes(vocabulary.uid);

    const isVerb = vocabulary.grp === "Verb";

    const jText = JapaneseText.parse(vocabulary);
    const hasFurigana = jText.hasFurigana();
    const hasJHint = jText.isHintable(3);
    const hasEHint = vocabulary.grp !== undefined && vocabulary.grp !== "";

    const showHint = this.state.showHint;
    const isHintable =
      !showHint && this.props.practiceSide ? hasJHint : hasEHint;

    let pIdx;
    /** @type {BareIdx[]} */
    let pList;

    const progress =
      ((this.state.selectedIndex + 1) / this.state.filteredVocab.length) * 100;

    if (this.state.scrollJOrder) {
      pIdx = this.state.selectedIndex;
      pList = this.state.jbare;
    } else {
      pIdx = this.state.jbare[this.state.selectedIndex].idx;
      pList = this.state.ebare;
    }

    let loopActionBtn;
    if (this.state.loop > 0 && !this.loopAbortControllers) {
      loopActionBtn = <LoopStartBtn onClick={this.beginLoop} />;
    } else if (this.state.loop > 0 && this.loopAbortControllers) {
      loopActionBtn = (
        <LoopStopBtn
          onClick={() => {
            this.setState({ loop: 0 });
          }}
        />
      );
    }

    let page = [
      <div key={0} className="vocabulary main-panel h-100">
        <div
          className="d-flex justify-content-between h-100"
          onTouchStart={this.props.touchSwipe ? this.startMove : undefined}
          onTouchMove={this.props.touchSwipe ? this.inMove : undefined}
          onTouchEnd={this.props.touchSwipe ? this.endMove : undefined}
        >
          <StackNavButton
            ariaLabel="Previous"
            color={"--yellow"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          {isVerb && this.props.autoVerbView ? (
            <VerbMain
              verb={vocabulary}
              reCache={this.state.recacheAudio}
              practiceSide={this.props.practiceSide}
              linkToOtherTerm={(uid) => this.setState({ reinforcedUID: uid })}
              showHint={showHint}
              loopPlayBtn={this.state.loop ? loopActionBtn : undefined}
            />
          ) : (
            <VocabularyMain
              vocabulary={vocabulary}
              reCache={this.state.recacheAudio}
              showHint={showHint}
              loopPlayBtn={this.state.loop ? loopActionBtn : undefined}
            />
          )}

          <StackNavButton
            color={"--yellow"}
            ariaLabel="Next"
            action={this.gotoNextSlide}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
    ];

    if (!this.state.showPageBar) {
      page = [
        ...page,
        <div key={1} className="options-bar mb-3 flex-shrink-1">
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-start">
                <div>
                  <FontAwesomeIcon
                    onClick={this.props.flipVocabularyPracticeSide}
                    className="clickable"
                    icon={this.props.practiceSide ? faGlasses : faPencilAlt}
                  />
                </div>

                <div
                  className={classNames({
                    "sm-icon-grp": true,
                    "disabled-color": this.state.recacheAudio,
                  })}
                >
                  <FontAwesomeIcon
                    onClick={() => {
                      if (this.state.recacheAudio === false) {
                        const delayTime = 2000;
                        this.setState({ recacheAudio: true });

                        const delayToggle = () => {
                          this.setState({ recacheAudio: false });
                        };

                        setTimeout(delayToggle, delayTime);
                      }
                    }}
                    className="clickable"
                    icon={faRecycle}
                    aria-label="Override audio"
                  />
                </div>

                {this.props.autoPlay !== AUTOPLAY_OFF && (
                  <div className="sm-icon-grp">
                    <FontAwesomeIcon
                      icon={faHeadphones}
                      aria-label="Auto play enabled"
                    />
                  </div>
                )}
                {isVerb && (
                  <div className="sm-icon-grp">
                    <FontAwesomeIcon
                      onClick={this.props.toggleAutoVerbView}
                      className="clickable"
                      icon={!this.props.autoVerbView ? faRunning : faBan}
                    />
                  </div>
                )}

                <div className="sm-icon-grp">
                  <LoopSettingBtn
                    active={this.state.loop > 0}
                    loop={this.state.loop}
                    onClick={() => {
                      this.abortLoop();
                      this.setState((/** @type {VocabularyState}*/ state) => ({
                        loop: state.loop < 3 ? state.loop + 1 : 0,
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="col text-center" style={{ maxHeight: "24px" }}>
              {this.state.reinforcedUID && (
                <FontAwesomeIcon className="clickable" icon={faDice} />
              )}
            </div>
            <div className="col">
              <div className="d-flex justify-content-end">
                <BtnShowHint
                  visible={this.props.hintEnabled}
                  active={isHintable}
                  setState={(state) => this.setState(state)}
                />

                <div
                  className={classNames({
                    "sm-icon-grp": true,
                    "disabled disabled-color": !hasFurigana,
                  })}
                  onClick={
                    hasFurigana
                      ? () => this.props.toggleFurigana(vocabulary.uid)
                      : undefined
                  }
                >
                  <FontAwesomeIcon
                    icon={faSuperscript}
                    aria-label="Toggle furigana"
                  />
                </div>

                <div className="sm-icon-grp">
                  {vocabulary_reinforce ? (
                    <div
                      onClick={() => {
                        this.props.removeFrequencyWord(vocabulary.uid);
                      }}
                    >
                      <XCircleIcon
                        className="clickable"
                        size="small"
                        aria-label="remove"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        this.props.addFrequencyWord(vocabulary.uid);
                      }}
                    >
                      <PlusCircleIcon
                        className="clickable"
                        size="small"
                        aria-label="add"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        <div
          key={2}
          className="progress-bar flex-shrink-1"
          onClick={() => {
            if (this.props.isOrdered && this.props.filterType !== FILTER_REP) {
              const delayTime = 4000;
              this.setState({ showPageBar: true });

              const delay = () => {
                if (this.props.scrollingDone) {
                  this.setState({ showPageBar: false });
                } else {
                  setTimeout(delay, delayTime);
                }
              };

              setTimeout(delay, delayTime);
            }
          }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            color={vocabulary_reinforce ? "secondary" : "primary"}
          />
        </div>,
      ];
    } else {
      page = [
        ...page,
        <Grow in={this.state.showPageBar} timeout={500} key={3}>
          <Avatar
            style={{
              position: "absolute",
              bottom: "25vh",
              left: "65vw",
              backgroundColor: deepOrange[500],
            }}
          >
            <div
              onClick={() => {
                this.setState((/** @type {VocabularyState}*/ state) => ({
                  scrollJOrder: !state.scrollJOrder,
                }));
              }}
            >
              {this.state.scrollJOrder ? "JP" : "EN"}
            </div>
          </Avatar>
        </Grow>,
        <div
          key={4}
          className="page-bar flex-shrink-1"
          // onMouseDown={() => {
          //   this.props.scrollingState(true)
          // }}
          // onMouseUp={() => {
          //   this.props.scrollingState(false)
          // }}
          onTouchStart={() => {
            this.props.scrollingState(true);
          }}
          onTouchEnd={() => {
            this.props.scrollingState(false);
          }}
        >
          <VocabularyOrderSlider
            initial={pIdx}
            list={pList}
            setIndex={(index) => {
              if (this.state.scrollJOrder) {
                this.setState({ selectedIndex: index });
              } else {
                const idx = this.state.ebare[index].idx;
                this.setState({ selectedIndex: idx });
              }
            }}
          />
        </div>,
      ];
    }

    return page;
  }
}
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    vocab: state.vocabulary.value,
    practiceSide: state.settings.vocabulary.practiceSide,
    isOrdered: state.settings.vocabulary.ordered,
    romajiActive: state.settings.vocabulary.romaji,
    hintEnabled: state.settings.vocabulary.hintEnabled,
    filterType: state.settings.vocabulary.filter,
    frequency: state.settings.vocabulary.frequency,
    activeGroup: state.settings.vocabulary.activeGroup,
    autoPlay: state.settings.vocabulary.autoPlay,
    scrollingDone: !state.settings.global.scrolling,
    autoVerbView: state.settings.vocabulary.autoVerbView,
    reinforce: state.settings.vocabulary.reinforce,
    previous: state.vocabulary.previous,
    repetition: state.settings.vocabulary.repetition,
    verbForm: state.vocabulary.verbForm,
    touchSwipe: state.settings.global.touchSwipe,
  };
};

Vocabulary.propTypes = {
  activeGroup: PropTypes.array,
  addFrequencyWord: PropTypes.func.isRequired,
  removeFrequencyWord: PropTypes.func.isRequired,
  frequency: PropTypes.array,
  getVocabulary: PropTypes.func.isRequired,
  vocab: PropTypes.array.isRequired,
  hintEnabled: PropTypes.bool,
  romajiActive: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func.isRequired,
  practiceSide: PropTypes.bool,
  isOrdered: PropTypes.bool,
  autoPlay: PropTypes.number,
  scrollingDone: PropTypes.bool,
  scrollingState: PropTypes.func,
  autoVerbView: PropTypes.bool,
  toggleAutoVerbView: PropTypes.func,
  filterType: PropTypes.number,
  toggleVocabularyFilter: PropTypes.func,
  reinforce: PropTypes.bool,
  previous: PropTypes.object,
  setPreviousWord: PropTypes.func,
  repetition: PropTypes.object,
  lastNext: PropTypes.number,
  updateSpaceRepWord: PropTypes.func,
  logger: PropTypes.func,
  verbForm: PropTypes.string,
  pushedPlay: PropTypes.func,
  touchSwipe: PropTypes.bool,
  toggleFurigana: PropTypes.func,
};

export default connect(mapStateToProps, {
  getVocabulary,
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  toggleFurigana,
  setPreviousWord,
  updateSpaceRepWord,
  logger,
  pushedPlay,
})(Vocabulary);

export { VocabularyMeta };
