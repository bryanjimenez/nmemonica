import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import partition from "lodash/partition";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getVocabulary } from "../../actions/vocabularyAct";
import {
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  updateSpaceRepWord,
  toggleFurigana,
  TermFilterBy,
  DebugLevel,
  setWordTPCorrect,
  setWordTPIncorrect,
  TermSortBy,
} from "../../actions/settingsAct";
import { audioPronunciation, JapaneseText } from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { Avatar, Grow, LinearProgress } from "@mui/material";
import VocabularyOrderSlider from "../Form/VocabularyOrderSlider";
import VocabularyMain from "./VocabularyMain";
import VerbMain from "./VerbMain";
// import { deepOrange } from "@mui/material";
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
  dateViewOrder,
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
  getSwipeDirection,
  swipeEnd,
  swipeMove,
  swipeStart,
} from "../../helper/TouchSwipe";
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
 * @typedef {Object} VocabularyState
 * @property {import("../Form/Console").ConsoleMessage[]} errorMsgs,
 * @property {number} errorSkipIndex
 * @property {number} lastNext
 * @property {number} selectedIndex
 * @property {string} [reinforcedUID]
 * @property {boolean} showHint
 * @property {RawVocabulary[]} filteredVocab
 * @property {string[]} frequency     subset of frequency words within current active group
 * @property {number[]} [order]
 * @property {string} [naFlip]
 * @property {any} [swiping]
 * @property {boolean} [showPageBar]
 * @property {boolean} recacheAudio
 * @property {boolean} [scrollJOrder]
 * @property {BareIdx[]} ebare
 * @property {BareIdx[]} jbare
 * @property {0|1|2|3} loop           loop response repetition setting value
 * @property {number} loopQuitCount   countdown for auto disable loop
 * @property {boolean} [tpAnswered]   timed play answered
 * @property {"incorrect"|"pronunciation"|"reset"} [tpBtn]  answer verify options
 * @property {number} [tpAnimation]   progress/time bar value
 * @property {number} [tpTimeStamp]   timed play answer timestamp
 * @property {number} [tpElapsed]     time elapsed from prompt to answer (ms)
 */

/**
 * @typedef {Object} VocabularyProps
 * @property {string[]} activeGroup
 * @property {typeof addFrequencyWord} addFrequencyWord
 * @property {typeof removeFrequencyWord} removeFrequencyWord
 * @property {{uid: string, count: number}} frequency       value of *last* frequency word update
 * @property {typeof getVocabulary} getVocabulary
 * @property {RawVocabulary[]} vocab
 * @property {boolean} hintEnabled
 * @property {boolean} romajiActive
 * @property {typeof flipVocabularyPracticeSide} flipVocabularyPracticeSide
 * @property {boolean} practiceSide   true: English, false: Japanese
 * @property {typeof TermSortBy[keyof TermSortBy]} termsOrder
 * @property {boolean} scrollingDone
 * @property {function} scrollingState
 * @property {boolean} autoVerbView
 * @property {typeof toggleAutoVerbView} toggleAutoVerbView
 * @property {typeof TermFilterBy[keyof TermFilterBy]} filterType
 * @property {typeof toggleVocabularyFilter} toggleVocabularyFilter
 * @property {boolean} reinforce
 * @property {SpaceRepetitionMap} repetition
 * @property {number} lastNext
 * @property {import("../../actions/settingsAct").updateSpaceRepWordYield} updateSpaceRepWord
 * @property {import("../../actions/settingsAct").setWordTPCorrectYield} setWordTPCorrect
 * @property {import("../../actions/settingsAct").setWordTPIncorrectYield} setWordTPIncorrect
 * @property {typeof logger} logger
 * @property {string} verbForm
 * @property {number} swipeThreshold
 * @property {number} motionThreshold
 * @property {function} motionThresholdCondition
 * @property {import("../../actions/settingsAct").toggleFuriganaYield} toggleFurigana
 * @property {typeof DebugLevel[keyof DebugLevel]} debugLevel
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
      frequency: [],
      recacheAudio: false,
      jbare: [],
      ebare: [],
      loop: 0,
      loopQuitCount: this.loopQuitMs / 1000,
    };

    /** @type {VocabularyProps} */
    this.props;

    /** @type {import("../../typings/raw").SetState<VocabularyState>} */
    this.setState;

    if (this.props.vocab.length === 0) {
      this.props.getVocabulary();
    }

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoNextSlide = this.gotoNextSlide.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.updateReinforcedUID = this.updateReinforcedUID.bind(this);
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
      this.props.termsOrder != prevProps.termsOrder
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
        const filteredKeys = this.state.filteredVocab.map((f) => f.uid);
        const frequency = filteredKeys.reduce(
          (/** @type {string[]} */ acc, cur) => {
            if (this.props.repetition[cur]?.rein === true) {
              acc = [...acc, cur];
            }
            return acc;
          },
          []
        );
        // props.frequency is a count of frequency words
        // state.frequency is a subset list of frequency words within current active group
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
          if (this.props.repetition[uid].pron === true) {
            // reset incorrect pronunciation
            if (this.state.tpElapsed !== undefined) {
              this.props.setWordTPCorrect(uid, this.state.tpElapsed, {
                pronunciation: null,
              });
            }
          }
          // else don't grade ... skip
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

    /** @type {(ac: AbortController) => Promise<[void] | [void, void]>} */
    let gamePropmt;
    /** @type {(ac: AbortController) => Promise<void>} */
    let gameResponse;
    if (this.props.practiceSide) {
      gamePropmt = (ac) => this.looperSwipe("down", ac);

      gameResponse = (ac) =>
        loopN(this.state.loop, () => this.looperSwipe("up", ac), 1500, ac);
    } else {
      gamePropmt = (ac) => this.looperSwipe("up", ac);

      gameResponse = (ac) =>
        loopN(this.state.loop, () => this.looperSwipe("down", ac), 1500, ac);
    }

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
        return gamePropmt(ac2).catch((error) => {
          if (error.cause?.code === "UserAborted") {
            // skip all playback
            throw error;
          } else {
            // caught trying to fetch gamePrompt
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
        return gameResponse(ac4)
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
              // caught trying to fetch gameResponse
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
      if (action === event.key) {
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

            if (
              (action === "ArrowUp" && this.props.practiceSide) ||
              (action === "ArrowDown" && !this.props.practiceSide)
            ) {
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

              // interrupt-to-auto-quit
              const countDown = setInterval(() => {
                this.setState((state) => {
                  const zero = state.loopQuitCount === 1;
                  if (zero) {
                    clearTimeout(countDown);
                  }

                  return {
                    loopQuitCount: !zero
                      ? state.loopQuitCount - 1
                      : this.loopQuitMs / 1000,
                    loop: !zero ? state.loop : 0,
                  };
                });
              }, 1000);

              this.loopQuitTimer = [countDown];
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
    const allFrequency = Object.keys(this.props.repetition).reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (this.props.repetition[cur].rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    let filteredVocab = termFilterByType(
      this.props.filterType,
      this.props.vocab,
      allFrequency,
      this.props.activeGroup,
      this.props.toggleVocabularyFilter
    );

    let newOrder;
    /** @type {BareIdx[]} */
    let jbare = [];
    /** @type {BareIdx[]} */
    let ebare = [];

    if (this.props.termsOrder === TermSortBy.RANDOM) {
      this.props.logger("Randomized", DebugLevel.DEBUG);
      newOrder = randomOrder(filteredVocab);
    } else if (this.props.termsOrder === TermSortBy.VIEW_DATE) {
      this.props.logger("Date Viewed", DebugLevel.DEBUG);
      newOrder = dateViewOrder(filteredVocab, this.props.repetition);
    } else if (this.props.termsOrder === TermSortBy.GAME) {
      this.props.logger("Space Rep", DebugLevel.DEBUG);

      if (this.props.reinforce === true) {
        // if reinforce, place reinforced/frequency terms
        // at the end
        const [freqTerms, nonFreqTerms] = partition(
          filteredVocab,
          (o) => this.props.repetition[o.uid]?.rein === true
        );
        filteredVocab = [...nonFreqTerms, ...freqTerms];

        const nonFreqOrder = spaceRepOrder(nonFreqTerms, this.props.repetition);
        const freqOrder = freqTerms.map((f, i) => nonFreqTerms.length + i);
        newOrder = [...nonFreqOrder, ...freqOrder];
      } else {
        newOrder = spaceRepOrder(filteredVocab, this.props.repetition);
      }
    } else {
      this.props.logger("Alphabetic", DebugLevel.DEBUG);
      ({
        order: newOrder,
        jOrder: jbare,
        eOrder: ebare,
      } = alphaOrder(filteredVocab));
    }

    const filteredKeys = filteredVocab.map((f) => f.uid);
    const frequency = filteredKeys.reduce(
      (/** @type {string[]} */ acc, cur) => {
        if (this.props.repetition[cur]?.rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
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

  gotoNext() {
    const l = this.state.filteredVocab.length;
    let newSel = (l + this.state.selectedIndex + 1) % l;

    if (newSel === this.state.errorSkipIndex) {
      newSel = (l + newSel + 1) % l;
    }

    this.setState({
      lastNext: Date.now(),
      reinforcedUID: undefined,
      selectedIndex: newSel,
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
    this.setState({
      reinforcedUID: uid,
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
    const targetIsStopBtn = Array.from(
      document.getElementsByClassName("loop-stop-btn")
    ).some((el) => el.contains(tEl));
    const targetIsClickAllowed = Array.from(
      document.getElementsByClassName("loop-no-interrupt")
    ).some((el) => el.contains(tEl));
    const eventIsNotSwipe =
      this.state.swiping?.touchObject?.swipeLength === undefined ||
      this.state.swiping.touchObject.swipeLength <
        this.state.swiping.touchThreshold;

    if (targetIsStopBtn) {
      this.setState({ loop: 0 });
      return;
    } else if (targetIsClickAllowed && eventIsNotSwipe) {
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
        const duringCountDown =
          this.state.tpAnimation !== undefined &&
          this.state.tpTimeStamp !== undefined;
        const duringResponse =
          this.state.tpAnimation === undefined &&
          this.state.tpTimeStamp === undefined;

        if (direction === "up" || direction === "down") {
          ({ tpElapsed } = this.getElapsedTimedPlay());
          tpAnswered = true;

          if (duringQuery) {
            interruptAnimation = noop;
          } else if (duringCountDown) {
            // force incorrect direction to correct handler
            const correctDirection = this.props.practiceSide ? "up" : "down";
            swipeHandler = (
              /** @type {string} */ wrongDirection,
              /** @type {AbortController | undefined} */ AC
            ) => this.swipeActionHandler(correctDirection, AC);
          } else if (duringResponse) {
            tpAnswered = false;
            swipeHandler = noop; // avoid replaying ontop of loop
            interruptAnimation = noop;
          }
        } else {
          if (duringResponse) {
            interruptAnimation = noop;
          }

          // interrupt-to-auto-quit
          const countDown = setInterval(() => {
            this.setState((state) => {
              const zero = state.loopQuitCount === 1;
              if (zero) {
                clearTimeout(countDown);
              }

              return {
                loopQuitCount: !zero
                  ? state.loopQuitCount - 1
                  : this.loopQuitMs / 1000,
                loop: !zero ? state.loop : 0,
              };
            });
          }, 1000);

          this.loopQuitTimer = [countDown];
        }

        this.setState({
          tpAnswered: tpAnswered,
          tpElapsed: tpElapsed,
        });
        interruptAnimation();
      }
    }

    swipeEnd(e, { ...this.state.swiping, onSwipe: swipeHandler });
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
      // guessed too late or too early

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

          this.setState((s) => ({
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
    const vocabulary_reinforce =
      this.props.repetition[vocabulary.uid]?.rein === true;

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
          onClick={() => {
            if (this.loopQuitTimer !== undefined) {
              // abort interrupt-to-auto-quit
              const [countDown] = this.loopQuitTimer;
              clearInterval(countDown);
              this.setState({ loopQuitCount: this.loopQuitMs / 1000 });
            }

            this.beginLoop();
          }}
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
          onTouchStart={
            this.props.swipeThreshold > 0 ? this.startMove : undefined
          }
          onTouchMove={this.props.swipeThreshold > 0 ? this.inMove : undefined}
          onTouchEnd={this.props.swipeThreshold > 0 ? this.endMove : undefined}
        >
          <StackNavButton ariaLabel="Previous" action={this.gotoPrev}>
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

          <StackNavButton ariaLabel="Next" action={this.gotoNextSlide}>
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
                  action={() => {
                    if (this.abortLoop()) {
                      this.setState({
                        tpTimeStamp: undefined,
                        tpAnimation: undefined,
                      });
                    }
                    this.props.flipVocabularyPracticeSide();
                  }}
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
                  prevMissPronu={this.props.repetition[uid]?.pron === true}
                  onPronunciation={() => {
                    if (this.props.repetition[uid].pron === true) {
                      this.setState((state) => ({
                        tpAnswered: false,
                        tpBtn: state.tpBtn === "reset" ? undefined : "reset",
                      }));
                    } else {
                      this.setState((state) => ({
                        tpAnswered: false,
                        tpBtn:
                          state.tpBtn === "pronunciation"
                            ? undefined
                            : "pronunciation",
                      }));
                    }
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
          className="progress-line flex-shrink-1"
          onClick={() => {
            if (this.props.termsOrder === TermSortBy.ALPHABETIC) {
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
              // backgroundColor: deepOrange[500],
            }}
          >
            <div
              onClick={() => {
                this.setState((state) => ({
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
    termsOrder: state.settings.vocabulary.ordered,
    romajiActive: state.settings.vocabulary.romaji,
    hintEnabled: state.settings.vocabulary.hintEnabled,
    filterType: state.settings.vocabulary.filter,
    frequency: state.settings.vocabulary.frequency,
    activeGroup: state.settings.vocabulary.activeGroup,
    scrollingDone: !state.settings.global.scrolling,
    autoVerbView: state.settings.vocabulary.autoVerbView,
    reinforce: state.settings.vocabulary.reinforce,
    repetition: state.settings.vocabulary.repetition,
    verbForm: state.vocabulary.verbForm,
    swipeThreshold: state.settings.global.swipeThreshold,
    motionThreshold: state.settings.global.motionThreshold,
    debugLevel: state.settings.global.debug,
  };
};

Vocabulary.propTypes = {
  getVocabulary: PropTypes.func.isRequired,
  activeGroup: PropTypes.array,
  addFrequencyWord: PropTypes.func.isRequired,
  removeFrequencyWord: PropTypes.func.isRequired,
  frequency: PropTypes.object,
  vocab: PropTypes.array.isRequired,
  hintEnabled: PropTypes.bool,
  romajiActive: PropTypes.bool,
  flipVocabularyPracticeSide: PropTypes.func.isRequired,
  practiceSide: PropTypes.bool,
  termsOrder: PropTypes.number,
  scrollingDone: PropTypes.bool,
  scrollingState: PropTypes.func,
  autoVerbView: PropTypes.bool,
  toggleAutoVerbView: PropTypes.func,
  filterType: PropTypes.number,
  toggleVocabularyFilter: PropTypes.func,
  reinforce: PropTypes.bool,
  clearPreviousTerm: PropTypes.func,
  repetition: PropTypes.object,
  lastNext: PropTypes.number,
  updateSpaceRepWord: PropTypes.func,
  setWordTPCorrect: PropTypes.func,
  setWordTPIncorrect: PropTypes.func,
  logger: PropTypes.func,
  verbForm: PropTypes.string,
  swipeThreshold: PropTypes.number,
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
  updateSpaceRepWord,
  setWordTPCorrect,
  setWordTPIncorrect,
  logger,
})(Vocabulary);

export { VocabularyMeta };
