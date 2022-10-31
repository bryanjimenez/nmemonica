import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import {
  clearPreviousTerm,
  getVocabulary,
  pushedPlay,
  setPreviousTerm,
} from "../../actions/vocabularyAct";
import {
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  AutoPlaySetting,
  updateSpaceRepWord,
  toggleFurigana,
  TermFilterBy,
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
  fadeOut,
  toggleFuriganaSettingHelper,
} from "../../helper/gameHelper";
import { logger } from "../../actions/consoleAct";
import { spaceRepLog } from "../../helper/consoleHelper";
import {
  swipeEnd,
  swipeMove,
  swipeStart,
} from "react-slick/lib/utils/innerSliderUtils";
import { pronounceEndoint } from "../../../environment.development";
import { addParam } from "../../helper/urlHelper";
import { LoopSettingBtn, LoopStartBtn, LoopStopBtn } from "../Form/BtnLoop";
import {
  mediaSessionAttach,
  mediaSessionDetachAll,
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
} from "../../helper/mediaHelper";
import {
  AutoPlayEnabledIcon,
  FrequencyTermIcon,
  ReCacheAudioBtn,
  ShowHintBtn,
  ToggleAutoVerbViewBtn,
  ToggleFrequencyTermBtn,
  ToggleFuriganaBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";

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
 * timer?: number,
 * }} VocabularyState
 */

/**
 * @typedef {{
 * activeGroup: string[],
 * addFrequencyWord: typeof addFrequencyWord,
 * removeFrequencyWord: typeof removeFrequencyWord,
 * frequency: string[],
 * getVocabulary: typeof getVocabulary,
 * vocab: RawVocabulary[],
 * hintEnabled: boolean,
 * romajiActive: boolean,
 * flipVocabularyPracticeSide: typeof flipVocabularyPracticeSide,
 * practiceSide: boolean,
 * isOrdered: boolean,
 * autoPlay: typeof AutoPlaySetting[keyof AutoPlaySetting],
 * scrollingDone: boolean,
 * scrollingState: function,
 * autoVerbView: boolean,
 * toggleAutoVerbView: typeof toggleAutoVerbView,
 * filterType: typeof TermFilterBy[keyof TermFilterBy],
 * toggleVocabularyFilter: typeof toggleVocabularyFilter,
 * reinforce: boolean,
 * prevTerm: RawVocabulary,
 * prevVerb: RawVocabulary,
 * clearPreviousTerm: typeof clearPreviousTerm,
 * setPreviousTerm: typeof setPreviousTerm,
 * repetition: SpaceRepetitionMap,
 * lastNext: number,
 * updateSpaceRepWord: typeof updateSpaceRepWord,
 * logger: typeof logger,
 * verbForm: string,
 * pushedPlay: typeof pushedPlay,
 * touchSwipe: boolean,
 * toggleFurigana: typeof toggleFurigana,
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
    this.props.clearPreviousTerm();

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
      this.props.activeGroup.some((e) => !prevProps.activeGroup.includes(e)) ||
      prevProps.activeGroup.some((e) => !this.props.activeGroup.includes(e))
    ) {
      // console.log("activeGroup changed");
      this.setOrder();
    }

    if (
      this.props.frequency.length != prevProps.frequency.length ||
      this.props.frequency.some((e) => !prevProps.frequency.includes(e)) ||
      prevProps.frequency.some((e) => !this.props.frequency.includes(e))
    ) {
      if (
        this.props.filterType === TermFilterBy.FREQUENCY &&
        this.props.frequency.length === 0
      ) {
        this.setOrder();
      } else {
        const filteredKeys = this.state.filteredVocab.map((f) => f.uid);
        const frequency = this.props.frequency.filter((f) =>
          filteredKeys.includes(f)
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

      this.setState({ timer: undefined });
      setMediaSessionPlaybackState("paused");
    }
  }

  beginLoop() {
    setMediaSessionPlaybackState("playing");

    this.abortLoop();
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    const ac3 = new AbortController();
    const ac4 = new AbortController();
    const ac5 = new AbortController();

    this.loopAbortControllers = [ac1, ac2, ac3, ac4, ac5];

    const japanese = (/** @type {AbortController} */ ac) =>
      loopN(this.state.loop, () => this.looperSwipe("up", ac), 1500, ac);

    const english = (/** @type {AbortController} */ ac) =>
      this.looperSwipe("down", ac);

    /**
     * @param {number} p Part
     * @param {number} w Whole
     */
    const countDown = (p, w) => {
      this.setState((/** @type {VocabularyState} */ state) => {
        // console.log('progess '+(state.timer>0?(state.timer+p)/w*100:0))

        let step;
        if (!state.timer || 100 - state.timer < 1) {
          step = (p / w) * 100;
        } else {
          step = state.timer + (p / w) * 100;
        }

        return { timer: step };
      });
    };

    pause(700, ac1)
      .then(() => {
        return english(ac2).catch(() => {
          // caught trying to fetch english
          // continue
        });
      })
      .then(() => pause(3000, ac3, countDown))
      .then(() => {
        return japanese(ac4)
          .then(() => {
            this.loopAbortControllers = undefined;
            return this.looperSwipe("left");
          })
          .catch((/** @type {Error} */ error) => {
            // @ts-expect-error Error.cause
            if (error?.cause?.code === "UserAborted") {
              // user aborted
              // don't continue
            } else {
              // caught trying to fetch japanese
              // continue
              this.loopAbortControllers = undefined;
              return this.looperSwipe("left");
            }
          });
      })
      .then(() => pause(100, ac5))
      .catch(() => {
        // aborted
      });

    this.forceUpdate();
  }

  /**
   * For the loop
   * @param {string} direction
   * @param {AbortController} [AbortController]
   */
  looperSwipe(direction, AbortController) {
    let promise;
    if (this.state.loop > 0) {
      promise = this.swipeActionHandler(direction, AbortController);
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

    if (
      !this.props.isOrdered &&
      this.props.filterType !== TermFilterBy.SPACE_REP
    ) {
      // randomized
      this.props.logger("Randomized", 3);
      newOrder = randomOrder(filteredVocab);
    } else if (this.props.filterType === TermFilterBy.SPACE_REP) {
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
      aPromise = this.props.setPreviousTerm({ lastTerm: prevVocab });
    }

    // verb to non verb
    if (prevVocab.grp === "Verb" && nextVocab.grp !== "Verb") {
      if (this.props.prevVerb) {
        // multiple verbs
        // non dictionary form on last verb
        aPromise = this.props.setPreviousTerm({
          lastVerb: this.props.prevVerb,
        });
      } else if (
        this.props.prevTerm &&
        this.props.prevTerm.uid === prevVocab.uid
      ) {
        // single/multiple verb DID form change (on last)
        // prevent overriding same verb diff form
        // setPreviousTerm done on VerbMain form change
      } else if (
        this.props.prevTerm &&
        this.props.prevTerm.uid !== prevVocab.uid
      ) {
        // single/multiple no form change
        aPromise = this.props.setPreviousTerm({ lastTerm: prevVocab });
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
      } else if (
        Array.from(document.getElementsByClassName("loop-no-interrupt")).some(
          (el) => el.contains(tEl)
        )
      ) {
        // elements with this tag do not interrupt loop
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
   * @param {AbortController} [AbortController]
   */
  swipeActionHandler(direction, AbortController) {
    // this.props.logger("swiped " + direction, 3);
    let swipePromise;
    // @ts-expect-error Error.cause
    const userAbortError = new Error("User interrupted audio playback.", {
      cause: { code: "UserAborted" },
    });

    if (direction === "left") {
      this.gotoNextSlide();
      swipePromise = Promise.all([Promise.resolve()]);
    } else if (direction === "right") {
      this.gotoPrev();
      swipePromise = Promise.all([Promise.resolve()]);
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
          swipePromise = Promise.all([
            /** @type {Promise<void>} */
            (
              new Promise((resolve, reject) => {
                const listener = () => {
                  fadeOut(japaneseAudio).then(() => {
                    reject(userAbortError);
                  });
                };

                japaneseAudio.addEventListener("ended", () => {
                  AbortController?.signal.removeEventListener(
                    "abort",
                    listener
                  );
                  resolve();
                });

                if (AbortController?.signal.aborted) {
                  listener();
                }

                AbortController?.signal.addEventListener("abort", listener);
              })
            ),

            japaneseAudio.play(),
          ]);
        } catch (e) {
          this.props.logger("Swipe Play Error " + e, 1);
        }

        if (this.props.autoPlay !== AutoPlaySetting.JP_EN) {
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
          swipePromise = Promise.all([
            /** @type {Promise<void>} */
            (
              new Promise((resolve, reject) => {
                const listener = () => {
                  fadeOut(englishAudio).then(() => {
                    reject(userAbortError);
                  });
                };

                englishAudio.addEventListener("ended", () => {
                  AbortController?.signal.removeEventListener(
                    "abort",
                    listener
                  );
                  resolve();
                });

                if (AbortController?.signal.aborted) {
                  listener();
                }

                AbortController?.signal.addEventListener("abort", listener);
              })
            ),

            englishAudio.play(),
          ]);
        } catch (e) {
          this.props.logger("Swipe Play Error " + e, 1);
        }

        if (this.props.autoPlay !== AutoPlaySetting.EN_JP) {
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
          <div className="row opts-max-h">
            <div className="col">
              <div className="d-flex justify-content-start">
                <TogglePracticeSideBtn
                  toggle={this.props.practiceSide}
                  action={this.props.flipVocabularyPracticeSide}
                />
                <ReCacheAudioBtn
                  active={this.state.recacheAudio}
                  action={() => {
                    if (this.state.recacheAudio === false) {
                      const delayTime = 2000;
                      this.setState({ recacheAudio: true });

                      const delayToggle = () => {
                        this.setState({ recacheAudio: false });
                      };

                      setTimeout(delayToggle, delayTime);
                    }
                  }}
                />
                <AutoPlayEnabledIcon
                  visible={this.props.autoPlay !== AutoPlaySetting.OFF}
                />
                <ToggleAutoVerbViewBtn
                  visible={isVerb}
                  toggleAutoVerbView={this.props.toggleAutoVerbView}
                  autoVerbView={this.props.autoVerbView}
                />
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
                <ShowHintBtn
                  visible={this.props.hintEnabled}
                  active={isHintable}
                  setState={(state) => this.setState(state)}
                />
                <ToggleFuriganaBtn
                  active={hasFurigana}
                  toggle={
                    toggleFuriganaSettingHelper(
                      this.props.practiceSide,
                      vocabulary.uid,
                      this.props.repetition,
                      ()=>{},
                    ).furigana.show
                  }
                  toggleFurigana={this.props.toggleFurigana}
                  vocabulary={vocabulary}
                />
                <ToggleFrequencyTermBtn
                  addFrequencyTerm={this.props.addFrequencyWord}
                  removeFrequencyTerm={this.props.removeFrequencyWord}
                  toggle={vocabulary_reinforce}
                  term={vocabulary}
                />
              </div>
            </div>
          </div>
        </div>,
        <div
          key={2}
          className="progress-bar flex-shrink-1"
          onClick={() => {
            if (
              this.props.isOrdered &&
              this.props.filterType !== TermFilterBy.SPACE_REP
            ) {
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
            variant={!this.loopAbortControllers ? "determinate" : "buffer"}
            value={progress}
            valueBuffer={
              this.loopAbortControllers ? this.state.timer || 0 : undefined
            }
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
    prevTerm: state.vocabulary.prevTerm,
    prevVerb: state.vocabulary.prevVerb,
    repetition: state.settings.vocabulary.repetition,
    verbForm: state.vocabulary.verbForm,
    touchSwipe: state.settings.global.touchSwipe,
  };
};

Vocabulary.propTypes = {
  getVocabulary: PropTypes.func.isRequired,
  activeGroup: PropTypes.array,
  addFrequencyWord: PropTypes.func.isRequired,
  removeFrequencyWord: PropTypes.func.isRequired,
  frequency: PropTypes.array,
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
  prevTerm: PropTypes.object,
  prevVerb: PropTypes.object,
  clearPreviousTerm: PropTypes.func,
  setPreviousTerm: PropTypes.func,
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
  clearPreviousTerm,
  setPreviousTerm,
  updateSpaceRepWord,
  logger,
  pushedPlay,
})(Vocabulary);

export { VocabularyMeta };
