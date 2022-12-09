import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import partition from "lodash/partition";
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
  DebugLevel,
  setWordTPCorrect,
  setWordTPIncorrect,
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
  minimumTimeForTimedPlay,
  motionThresholdCondition,
  getDeviceMotionEventPermission,
} from "../../helper/gameHelper";
import { logger } from "../../actions/consoleAct";
import {
  answerSeconds,
  logify,
  msgInnerTrim,
  spaceRepLog,
  timedPlayLog,
} from "../../helper/consoleHelper";
import {
  swipeEnd,
  swipeMove,
  swipeStart,
  getSwipeDirection,
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
  TimePlayVerifyBtns,
  ToggleAutoVerbViewBtn,
  ToggleFrequencyTermBtn,
  ToggleFuriganaBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import Console from "../Form/Console";
import { MinimalUI } from "../Form/MinimalUI";

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
 * errorMsgs: import("../Form/Console").ConsoleMessage[],
 * errorSkipIndex: number,
 * lastNext: number,
 * selectedIndex: number,
 * showHint: boolean,
 * filteredVocab: RawVocabulary[],
 * frequency: string[],
 * order?: number[],
 * reinforcedUID?: string,
 * naFlip?: string,
 * swiping?: any,
 * showPageBar?: boolean,
 * recacheAudio: boolean,
 * scrollJOrder?: boolean,
 * ebare: BareIdx[],
 * jbare: BareIdx[],
 * loop: 0|1|2|3, //loop loop response repetition setting value
 * loopQuitCount: number,   // countdown for auto disable loop
 * tpAnswered?: boolean,    // timed play answered
 * tpBtn?: "incorrect"|"pronunciation"|"reset", // answer verify options
 * tpAnimation?: number,    // progress/time bar value
 * tpTimeStamp?: number,    // timed play answer timestamp
 * tpElapsed?: number,      // time elapsed from prompt to answer (ms)
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
 * updateSpaceRepWord: import("../../actions/settingsAct").updateSpaceRepWordYield,
 * setWordTPCorrect: import("../../actions/settingsAct").setWordTPCorrectYield,
 * setWordTPIncorrect: import("../../actions/settingsAct").setWordTPIncorrectYield,
 * logger: typeof logger,
 * verbForm: string,
 * pushedPlay: typeof pushedPlay,
 * touchSwipe: boolean,
 * motionThreshold: number,
 * motionThresholdCondition: typeof motionThresholdCondition,
 * toggleFurigana: import("../../actions/settingsAct").toggleFuriganaYield,
 * debugLevel: typeof DebugLevel[keyof DebugLevel]
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

    /** @type {AbortController[] | undefined} Array of TimedPlay audio and pauses timers*/
    this.loopAbortControllers;
    /** @type {NodeJS.Timeout[] | undefined} Array of TimedPlay auto quit timers*/
    this.loopQuitTimer;
    this.loopQuitMs = 15000;

    /** @type {VocabularyState} */
    this.state = {
      errorMsgs: [],
      errorSkipIndex: -1,
      lastNext: Date.now(),
      selectedIndex: 0,
      showHint: false,
      filteredVocab: [],
      frequency: [], // subset of frequency words within current active group
      recacheAudio: false,
      jbare: [],
      ebare: [],
      loop: 0,
      loopQuitCount: this.loopQuitMs / 1000,
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
    this.getElapsedTimedPlay = this.getElapsedTimedPlay.bind(this);
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
            if (this.abortLoop()) {
              this.forceUpdate();
            } else {
              setMediaSessionPlaybackState("paused");
            }
          }
        },
      ],
      [
        "stop",
        () => {
          if (this.state.loop) {
            if (this.abortLoop()) {
              this.forceUpdate();
            } else {
              setMediaSessionPlaybackState("paused");
            }
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

    if (
      this.state.reinforcedUID !== prevState.reinforcedUID ||
      this.state.selectedIndex !== prevState.selectedIndex
    ) {
      const uid =
        prevState.reinforcedUID ||
        getTermUID(
          prevState.selectedIndex,
          this.state.order,
          this.state.filteredVocab
        );

      if (this.state.loop > 0 && this.state.tpAnswered !== undefined) {
        if (this.state.tpBtn === "reset") {
          // don't grade ... skip
        } else {
          if (this.state.tpAnswered === true) {
            if (this.state.tpElapsed !== undefined) {
              this.props.setWordTPCorrect(uid, this.state.tpElapsed);
            }
          } else {
            const reason = {
              pronunciation: this.state.tpBtn === "pronunciation" || undefined,
            };
            this.props.setWordTPIncorrect(uid, reason);
          }
        }
      }

      // prevent updates when quick scrolling
      if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
        const vocabulary = getTerm(uid, this.props.vocab);

        // don't increment reinforced terms
        const shouldIncrement = uid !== prevState.reinforcedUID;
        const { map, prevMap } = this.props.updateSpaceRepWord(
          uid,
          shouldIncrement
        );

        const prevDate = prevMap[uid] && prevMap[uid].d;
        const repStats = { [uid]: { ...map[uid], d: prevDate } };
        if (this.state.tpAnswered !== undefined) {
          timedPlayLog(this.props.logger, vocabulary, repStats, {
            frequency: prevState.reinforcedUID !== undefined,
          });
        } else {
          spaceRepLog(this.props.logger, vocabulary, repStats, {
            frequency: prevState.reinforcedUID !== undefined,
          });
        }
      }

      if (this.state.loop > 0 && this.loopAbortControllers === undefined) {
        // loop enabled, but not interrupted

        if (this.loopQuitTimer !== undefined) {
          this.loopQuitTimer.forEach((t) => {
            clearTimeout(t);
          });
          this.loopQuitTimer = undefined;
        }

        this.setState({
          loopQuitCount: this.loopQuitMs / 1000,
          tpAnswered: undefined,
          tpBtn: undefined,
          tpTimeStamp: undefined,
          tpElapsed: undefined,
        });

        if (minimumTimeForTimedPlay(prevState.lastNext)) {
          this.beginLoop();
        }
      }

      this.setState({
        showHint: false,
        errorMsgs: [],
      });
    }
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.arrowKeyPress, true);
    this.abortLoop();

    mediaSessionDetachAll();
  }

  /**
   * @param {Error} error
   */
  static getDerivedStateFromError(error) {
    const causeMsg =
      // @ts-expect-error Error.cause
      (error.cause !== undefined && [
        // @ts-expect-error Error.cause
        { msg: JSON.stringify(error.cause).replaceAll(",", ", "), css: "px-4" },
      ]) ||
      [];

    const errorMsgs = [
      { msg: error.name + ": " + error.message, css: "px-2" },
      ...causeMsg,
    ].map((e) => ({
      ...e,
      lvl: DebugLevel.ERROR,
    }));

    // state
    return {
      errorMsgs,
    };
  }

  /**
   * @param {Error} error
   */
  componentDidCatch(error) {
    // @ts-expect-error Error.cause
    const cause = error.cause;

    let selectedIndex;

    switch (cause && cause.code) {
      case "InvalidPronunciation":
        if (
          this.props.debugLevel !== DebugLevel.OFF &&
          this.state.errorSkipIndex < this.state.filteredVocab.length - 1
        ) {
          this.props.logger("Error: " + error.message, DebugLevel.ERROR);
          this.props.logger(
            "[" + cause.value?.english + "] Skipped",
            DebugLevel.ERROR
          );
          this.abortLoop();

          const l = this.state.filteredVocab.length;
          selectedIndex = (l + this.state.selectedIndex + 1) % l;
        }

        break;
      case "DeviceMotionEvent":
        {
          this.props.logger("Error: " + error.message, DebugLevel.ERROR);
        }
        break;
    }

    let errorSkipIndex;
    if (this.state.reinforcedUID) {
      const orderIdx = this.state.filteredVocab.findIndex(
        (v) => v.uid === this.state.reinforcedUID
      );
      errorSkipIndex = this.state.order?.indexOf(orderIdx);
    } else {
      errorSkipIndex = this.state.selectedIndex;
    }

    this.setState({
      reinforcedUID: undefined,
      ...(selectedIndex ? { selectedIndex } : {}),
      errorSkipIndex,
      errorMsgs: [],
    });
  }

  /**
   * Returns false had it not been looping.
   */
  abortLoop() {
    let wasLooping = false;
    if (this.loopAbortControllers && this.loopAbortControllers.length > 0) {
      wasLooping = true;
      this.loopAbortControllers.forEach((ac) => {
        ac.abort();
      });
      this.loopAbortControllers = undefined;

      setMediaSessionPlaybackState("paused");
    }
    return wasLooping;
  }

  beginLoop() {
    setMediaSessionPlaybackState("playing");

    this.abortLoop(); // beginLoop
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    const ac3 = new AbortController();
    const ac4 = new AbortController();
    const ac5 = new AbortController();

    const onShakeEventHandler = () => {
      if (this.state.tpTimeStamp !== undefined) {
        this.abortLoop();
        this.setState({
          loop: 0,
          tpTimeStamp: undefined,
          tpAnimation: undefined,
        });
      }
    };

    const motionListener = (/** @type {DeviceMotionEvent} */ event) => {
      try {
        motionThresholdCondition(
          event,
          this.props.motionThreshold,
          onShakeEventHandler
        );
      } catch (error) {
        if (error instanceof Error) {
          this.componentDidCatch(error);
        }
      }
    };

    if (this.props.motionThreshold > 0) {
      getDeviceMotionEventPermission(() => {
        window.addEventListener("devicemotion", motionListener);
      }, this.componentDidCatch);
    }

    this.loopAbortControllers = [ac1, ac2, ac3, ac4, ac5];
    this.forceUpdate();

    const japanese = (/** @type {AbortController} */ ac) =>
      loopN(this.state.loop, () => this.looperSwipe("up", ac), 1500, ac);

    const english = (/** @type {AbortController} */ ac) =>
      this.looperSwipe("down", ac);

    /**
     * @param {number} p Part
     * @param {number} w Whole
     */
    const countDown = (p, w) => {
      this.setState((state) => {
        let step;
        if (state.tpAnimation === undefined || 100 - state.tpAnimation < 1) {
          step = (p / w) * 100;
        } else {
          step = state.tpAnimation + (p / w) * 100;
        }
        return { tpAnimation: step };
      });
    };

    pause(700, ac1)
      .then(() => {
        // begin elapsing here
        this.setState({ tpTimeStamp: Date.now() });
        return english(ac2).catch((error) => {
          if (error.cause?.code === "UserAborted") {
            // skip all playback
            throw error;
          } else {
            // caught trying to fetch english
            // continue
          }
        });
      })
      .then(() => {
        // begin tpAnimation here
        return pause(3000, ac3, countDown);
      })
      .then(() => {
        // end tpAnimation here
        this.setState({ tpAnimation: undefined, tpTimeStamp: undefined });
        return japanese(ac4)
          .then(() => {
            this.loopAbortControllers = undefined;
            return this.looperSwipe("left");
          })
          .catch((/** @type {Error} */ error) => {
            // @ts-expect-error Error.cause
            if (error.cause?.code === "UserAborted") {
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
      })
      .then(() => {
        // finally
        if (this.props.motionThreshold > 0) {
          window.removeEventListener("devicemotion", motionListener);
        }
      });
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
      /** @type {function} */
      let keyPressHandler = handler;
      const noop = () => {};
      let interruptAnimation = () => {
        setTimeout(() => {
          this.setState({ tpAnimation: 0 });
          setTimeout(() => {
            this.setState((state) => {
              if (state.tpAnimation === 0) {
                return { tpAnimation: undefined };
              }
            });
          }, 1000);
        }, 1500);
      };

      if (action === event.key) {
        if (action !== " ") {
          // interrupt loop
          if (this.abortLoop()) {
            /** @type {boolean|undefined} */
            let tpAnswered;
            let tpElapsed;

            const duringQuery =
              this.state.tpAnimation === undefined &&
              this.state.tpTimeStamp !== undefined;
            // const duringCountDown =
            //   this.state.tpAnimation !== undefined &&
            //   this.state.tpTimeStamp !== undefined;
            const duringResponse =
              this.state.tpAnimation === undefined &&
              this.state.tpTimeStamp === undefined;

            if (action === "ArrowUp") {
              ({ tpElapsed } = this.getElapsedTimedPlay());
              tpAnswered = true;
              if (duringQuery) {
                interruptAnimation = noop;
              } else if (duringResponse) {
                tpAnswered = false;
                keyPressHandler = noop; // avoid replaying ontop of loop
                interruptAnimation = noop;
              }
            } else {
              if (duringResponse) {
                interruptAnimation = noop;
              }

              // interrupt to auto quit
              const quitLoop = setTimeout(() => {
                this.setState({
                  loop: 0,
                  loopQuitCount: this.loopQuitMs / 1000,
                });
                clearTimeout(countDown);
              }, this.loopQuitMs);

              const countDown = setInterval(() => {
                this.setState((state) => ({
                  loopQuitCount: state.loopQuitCount - 1,
                }));
              }, 1000);

              this.loopQuitTimer = [quitLoop, countDown];
            }

            this.setState({
              tpAnswered: tpAnswered,
              tpElapsed: tpElapsed,
            });
            interruptAnimation();
          } else {
            setMediaSessionPlaybackState("paused");
          }
        }

        keyPressHandler();
        break;
      }
    }
  }

  setOrder() {
    let filteredVocab = termFilterByType(
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
      this.props.logger("Randomized", DebugLevel.DEBUG);
      newOrder = randomOrder(filteredVocab);
    } else if (this.props.filterType === TermFilterBy.SPACE_REP) {
      // repetition order
      this.props.logger("Space Rep", DebugLevel.DEBUG);

      if (this.props.reinforce === true) {
        // if reinforce, place reinforced/frequency terms
        // at the end
        const [freqTerms, nonFreqTerms] = partition(filteredVocab, (o) =>
          this.props.frequency.includes(o.uid)
        );
        filteredVocab = [...nonFreqTerms, ...freqTerms];

        const nonFreqOrder = spaceRepOrder(nonFreqTerms, this.props.repetition);
        const freqOrder = freqTerms.map((f, i) => nonFreqTerms.length + i);
        newOrder = [...nonFreqOrder, ...freqOrder];
      } else {
        newOrder = spaceRepOrder(filteredVocab, this.props.repetition);
      }
    } else {
      // alphabetized
      this.props.logger("Alphabetic", DebugLevel.DEBUG);
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
    let newSel = (l + this.state.selectedIndex + 1) % l;

    if (newSel === this.state.errorSkipIndex) {
      newSel = (l + newSel + 1) % l;
    }

    this.verbNonVerbTransition({ nextIndex: newSel }).then(() => {
      this.setState({
        lastNext: Date.now(),
        reinforcedUID: undefined,
        selectedIndex: newSel,
      });
    });
  }

  gotoNextSlide() {
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
      newSel = (l + i) % l;
    }

    if (newSel === this.state.errorSkipIndex) {
      newSel = (l + newSel - 1) % l;
    }

    this.verbNonVerbTransition({ nextIndex: newSel });

    this.setState({
      lastNext: Date.now(),
      reinforcedUID: undefined,
      selectedIndex: newSel,
    });
  }

  /**
   * @param {string} uid
   */
  updateReinforcedUID(uid) {
    this.verbNonVerbTransition({ nextUID: uid });

    this.setState({
      reinforcedUID: uid,
    });
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
    /** @type {function} */
    let swipeHandler = this.swipeActionHandler;
    const noop = () => {};
    let interruptAnimation = () => {
      setTimeout(() => {
        this.setState({ tpAnimation: 0 });
        setTimeout(() => {
          this.setState((state) => {
            if (state.tpAnimation === 0) {
              return { tpAnimation: undefined };
            }
          });
        }, 1000);
      }, 1500);
    };
    const tEl = /** @type {Element} */ (e.target);

    if (
      Array.from(document.getElementsByClassName("loop-stop-btn")).some((el) =>
        el.contains(tEl)
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
      // interrupt loop
      if (this.abortLoop()) {
        const direction = getSwipeDirection(
          this.state.swiping.touchObject,
          true
        );

        /** @type {boolean|undefined} */
        let tpAnswered;
        let tpElapsed;
        const duringQuery =
          this.state.tpAnimation === undefined &&
          this.state.tpTimeStamp !== undefined;
        // const duringCountDown =
        //   this.state.tpAnimation !== undefined &&
        //   this.state.tpTimeStamp !== undefined;
        const duringResponse =
          this.state.tpAnimation === undefined &&
          this.state.tpTimeStamp === undefined;

        if (direction === "up") {
          ({ tpElapsed } = this.getElapsedTimedPlay());
          tpAnswered = true;

          if (duringQuery) {
            interruptAnimation = noop;
          } else if (duringResponse) {
            tpAnswered = false;
            swipeHandler = noop; // avoid replaying ontop of loop
            interruptAnimation = noop;
          }
        } else {
          if (duringResponse) {
            interruptAnimation = noop;
          }

          // interrupt to auto quit
          const quitLoop = setTimeout(() => {
            this.setState({ loop: 0, loopQuitCount: this.loopQuitMs / 1000 });
            clearTimeout(countDown);
          }, this.loopQuitMs);

          const countDown = setInterval(() => {
            this.setState((state) => ({
              loopQuitCount: state.loopQuitCount - 1,
            }));
          }, 1000);

          this.loopQuitTimer = [quitLoop, countDown];
        }

        this.setState({
          tpAnswered: tpAnswered,
          tpElapsed: tpElapsed,
        });
        interruptAnimation();
      }
    }

    swipeEnd(e, {
      ...this.state.swiping,
      dragging: true,
      verticalSwiping: true,
      listHeight: 1,
      touchThreshold: 5,
      onSwipe: swipeHandler,
    });
  }

  /**
   * During timed play interrupt
   */
  getElapsedTimedPlay() {
    let tpElapsed;

    const uid =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredVocab
      );
    const term = getTerm(uid, this.props.vocab);
    const msg = msgInnerTrim(term.english, 30);

    if (this.state.tpTimeStamp !== undefined) {
      // guessed within time

      const dateThen = this.state.tpTimeStamp;
      tpElapsed = Math.abs(Date.now() - dateThen);
      const elapStr = " " + answerSeconds(tpElapsed) + "s";

      this.props.logger("Timed Play [" + msg + "]" + elapStr, DebugLevel.DEBUG);
    } else {
      // guessed too late

      this.props.logger("Timed Play [" + msg + "] X-( ", DebugLevel.DEBUG);
    }

    return { tpElapsed };
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
          this.props.logger("Swipe Play Error " + e, DebugLevel.ERROR);
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
          this.props.logger("Swipe Play Error " + e, DebugLevel.ERROR);
        }

        if (this.props.autoPlay !== AutoPlaySetting.EN_JP) {
          this.props.pushedPlay(true);
        }
      }
    }
    return swipePromise || Promise.reject();
  }

  render() {
    if (this.state.errorMsgs.length > 0) {
      const minState = logify(this.state);
      const minProps = logify(this.props);

      const messages = [
        ...this.state.errorMsgs,
        { msg: "props:", lvl: DebugLevel.WARN, css: "px-2" },
        { msg: minProps, lvl: DebugLevel.WARN, css: "px-4" },
        { msg: "state:", lvl: DebugLevel.WARN, css: "px-2" },
        { msg: minState, lvl: DebugLevel.WARN, css: "px-4" },
      ];

      return (
        <MinimalUI next={this.gotoNext} prev={this.gotoPrev}>
          <div className="d-flex flex-column justify-content-around">
            <Console messages={messages} />
          </div>
        </MinimalUI>
      );
    }

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

    if (this.state.scrollJOrder) {
      pIdx = this.state.selectedIndex;
      pList = this.state.jbare;
    } else {
      pIdx = this.state.jbare[this.state.selectedIndex].idx;
      pList = this.state.ebare;
    }

    let loopActionBtn;
    if (this.state.loop > 0 && this.loopAbortControllers === undefined) {
      loopActionBtn = (
        <LoopStartBtn
          countDown={
            this.loopQuitTimer !== undefined
              ? this.state.loopQuitCount
              : undefined
          }
          onClick={this.beginLoop}
        />
      );
    } else if (this.state.loop > 0 && this.loopAbortControllers !== undefined) {
      loopActionBtn = (
        <LoopStopBtn
          onClick={() => {
            this.abortLoop();
            this.setState({
              loop: 0,
              tpTimeStamp: undefined,
              tpAnimation: undefined,
            });
          }}
        />
      );
    }

    const progress =
      ((this.state.selectedIndex + 1) / this.state.filteredVocab.length) * 100;

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
            />
          ) : (
            <VocabularyMain
              vocabulary={vocabulary}
              reCache={this.state.recacheAudio}
              showHint={showHint}
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
                      this.loopQuitTimer = undefined;
                      this.setState((state) => {
                        const zero = state.loop === 3;

                        return {
                          loop: /** @type {VocabularyState["loop"]} */ (
                            !zero ? state.loop + 1 : 0
                          ),
                          tpAnswered: !zero ? state.tpAnswered : undefined,
                        };
                      });
                    }}
                  />
                </div>
                <div className="sm-icon-grp">{loopActionBtn}</div>
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
                <TimePlayVerifyBtns
                  visible={this.state.tpAnswered !== undefined}
                  hover={this.state.tpBtn}
                  onPronunciation={() => {
                    this.setState((state) => ({
                      tpAnswered: false,
                      tpBtn:
                        state.tpBtn === "pronunciation"
                          ? undefined
                          : "pronunciation",
                    }));
                  }}
                  onIncorrect={() => {
                    this.setState((state) => ({
                      tpAnswered: false,
                      tpBtn:
                        state.tpBtn === "incorrect" ? undefined : "incorrect",
                    }));
                  }}
                  onReset={() => {
                    this.setState((state) => ({
                      tpAnswered: false,
                      tpBtn: state.tpBtn === "reset" ? undefined : "reset",
                    }));
                  }}
                />
                <ShowHintBtn
                  visible={this.props.hintEnabled}
                  active={isHintable}
                  setState={(state) => this.setState(state)}
                />
                <ToggleFuriganaBtn
                  active={hasFurigana}
                  toggle={
                    toggleFuriganaSettingHelper(
                      vocabulary.uid,
                      this.props.repetition
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
            variant={
              this.state.tpAnimation === undefined ? "determinate" : "buffer"
            }
            value={this.state.tpAnimation === undefined ? progress : 0}
            valueBuffer={
              this.state.tpAnimation === undefined
                ? undefined
                : this.state.tpAnimation
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
    motionThreshold: state.settings.global.motionThreshold,
    debugLevel: state.settings.global.debug,
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
  setWordTPCorrect: PropTypes.func,
  setWordTPIncorrect: PropTypes.func,
  logger: PropTypes.func,
  verbForm: PropTypes.string,
  pushedPlay: PropTypes.func,
  touchSwipe: PropTypes.bool,
  motionThreshold: PropTypes.number,
  toggleFurigana: PropTypes.func,
  debugLevel: PropTypes.number,
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
  setWordTPCorrect,
  setWordTPIncorrect,
  logger,
  pushedPlay,
})(Vocabulary);

export { VocabularyMeta };
