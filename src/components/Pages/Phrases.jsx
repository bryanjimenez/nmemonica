import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getPhrases } from "../../actions/phrasesAct";
import {
  addFrequencyPhrase,
  updateSpaceRepPhrase,
  flipPhrasesPracticeSide,
  removeFrequencyPhrase,
  togglePhrasesFilter,
  AutoPlaySetting,
  TermFilterBy,
  DebugLevel,
} from "../../actions/settingsAct";
import { audioPronunciation, JapaneseText } from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { LinearProgress } from "@material-ui/core";
import {
  alphaOrder,
  play,
  minimumTimeForSpaceRepUpdate,
  randomOrder,
  spaceRepOrder,
  termFilterByType,
  audioWordsHelper,
  getTermUID,
  getTerm,
  labelPlacementHelper,
  loopN,
  pause,
  fadeOut,
} from "../../helper/gameHelper";
import { logger } from "../../actions/consoleAct";
import { logify, spaceRepLog } from "../../helper/consoleHelper";
import {
  clearPreviousTerm,
  pushedPlay,
  setPreviousTerm,
} from "../../actions/vocabularyAct";
import AudioItem from "../Form/AudioItem";
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
  FrequencyTermIcon,
  ToggleFrequencyTermBtn,
  ToggleLiteralPhraseBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { MinimalUI } from "../Form/MinimalUI";
import Console from "../Form/Console";
import Sizable from "../Form/Sizable";

/**
 * @typedef {import("react").TouchEventHandler} TouchEventHandler
 * @typedef {import("../../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {{nextUID:string, nextIndex?:undefined}|{nextUID?:undefined, nextIndex:number}} MEid
 * @typedef {import("../../typings/raw").ActionHandlerTuple} ActionHandlerTuple
 */

/**
 * @typedef {{
 * errorMsgs: import("../Form/Console").ConsoleMessage[],
 * errorSkipIndex: number,
 * lastNext: number,
 * selectedIndex: number,
 * showMeaning: boolean,
 * showRomaji: boolean,
 * showLit: boolean,
 * filteredPhrases: RawPhrase[],
 * frequency: string[], // subset of frequency words within current active group
 * prevPhrase: RawPhrase,
 * audioPlay: boolean,
 * prevPlayed: boolean,
 * order?: number[],
 * reinforcedUID?: string,
 * swiping?: any,
 * loop: 0|1|2|3,
 * }} PhrasesState
 */

/**
 * @typedef {{
 * getPhrases: typeof getPhrases,
 * phrases: RawPhrase[],
 * isOrdered: boolean,
 * flipPhrasesPracticeSide: typeof flipPhrasesPracticeSide,
 * practiceSide: boolean,
 * romajiActive: boolean,
 * removeFrequencyPhrase: typeof removeFrequencyPhrase,
 * addFrequencyPhrase: typeof addFrequencyPhrase,
 * frequency: string[],
 * filterType: typeof TermFilterBy[keyof TermFilterBy],
 * togglePhrasesFilter: typeof togglePhrasesFilter,
 * reinforce: boolean,
 * activeGroup: string[],
 * repetition: SpaceRepetitionMap,
 * lastNext: number,
 * updateSpaceRepPhrase: import("../../actions/settingsAct").updateSpaceRepPhraseYield,
 * logger: typeof logger,
 * prevTerm: RawPhrase,
 * prevPushPlay: boolean,
 * pushedPlay: typeof pushedPlay,
 * clearPreviousTerm: typeof clearPreviousTerm,
 * setPreviousTerm: typeof setPreviousTerm,
 * autoPlay: typeof AutoPlaySetting[keyof AutoPlaySetting],
 * touchSwipe: boolean,
 * }} PhrasesProps
 */

const PhrasesMeta = {
  location: "/phrases/",
  label: "Phrases",
};

class Phrases extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {PhrasesState} */
    this.state = {
      errorMsgs: [],
      errorSkipIndex: -1,
      lastNext: Date.now(),
      selectedIndex: 0,
      showMeaning: false,
      showRomaji: false,
      showLit: false,
      filteredPhrases: [],
      frequency: [], // subset of frequency words within current active group
      prevPhrase: this.props.prevTerm,
      audioPlay: true,
      prevPlayed: this.props.prevPushPlay,
      loop: 0,
    };

    /** @type {PhrasesProps} */
    this.props;

    this.props.getPhrases();

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
  }

  componentDidMount() {
    // clear existing previous word on mount
    this.props.clearPreviousTerm();

    if (this.props.phrases && this.props.phrases.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }
    document.addEventListener("keydown", this.arrowKeyPress, true);

    setMediaSessionMetadata("Phrases Loop");
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
   * @param {PhrasesProps} nextProps
   * @param {PhrasesState} nextState
   */
  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.state.prevPhrase !== undefined &&
      this.state.audioPlay !== nextState.audioPlay &&
      nextState.audioPlay === false
    ) {
      return false;
    }

    return true;
  }

  /**
   * @param {PhrasesProps} prevProps
   * @param {PhrasesState} prevState
   */
  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.order !== prevState.order ||
      this.state.selectedIndex !== prevState.selectedIndex ||
      this.state.reinforcedUID !== prevState.reinforcedUID
    ) {
      if (this.state.filteredPhrases.length > 0) {
        if (
          this.state.selectedIndex !== prevState.selectedIndex ||
          this.state.reinforcedUID !== prevState.reinforcedUID
        ) {
          const prevUID =
            prevState.reinforcedUID ||
            getTermUID(
              prevState.selectedIndex,
              this.state.order,
              this.state.filteredPhrases
            );
          const prevTerm = getTerm(prevUID, this.props.phrases);

          const prevPhrase = {
            japanese: prevTerm.japanese,
            english: prevTerm.english,
            uid: prevTerm.uid,
          };

          this.props.setPreviousTerm({ lastTerm: prevPhrase }).then(() => {
            this.setState({
              prevPhrase,
              audioPlay: true,
              prevPlayed: this.props.prevPushPlay,
            });
          });
        }
      }
    }

    if (
      this.props.phrases.length != prevProps.phrases.length ||
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("got game data");
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

    if (this.props.filterType != prevProps.filterType) {
      this.setOrder();
    }

    if (
      this.props.frequency.length != prevProps.frequency.length ||
      this.props.frequency.some((e) => !prevProps.frequency.includes(e)) ||
      prevProps.frequency.some((e) => !this.props.frequency.includes(e))
    ) {
      // console.log('frequency word changed');
      if (
        this.props.filterType === TermFilterBy.FREQUENCY &&
        this.props.frequency.length === 0
      ) {
        this.setOrder();
      } else {
        const filteredKeys = this.state.filteredPhrases.map((f) => f.uid);
        const frequency = this.props.frequency.filter((f) =>
          filteredKeys.includes(f)
        );
        // console.log('frequency word changed');
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
          this.state.filteredPhrases
        );

      if (this.state.loop > 0 && this.loopAbortControllers === undefined) {
        // loop enabled, but not interrupted
        this.beginLoop();
      }

      // prevent updates when quick scrolling
      if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
        const phrase = getTerm(uid, this.props.phrases);

        // don't increment reinforced terms
        const shouldIncrement = uid !== prevState.reinforcedUID;
        const { map, prevMap } = this.props.updateSpaceRepPhrase(
          uid,
          shouldIncrement
        );

        const prevDate = prevMap[uid] && prevMap[uid].d;
        const repStats = { [uid]: { ...map[uid], d: prevDate } };
        spaceRepLog(this.props.logger, phrase, repStats);
      }

      this.setState({
        showMeaning: false,
        showRomaji: false,
        showLit: false,
        errorMsgs: [],
      });
    }

    if (this.state.audioPlay) {
      this.setState({
        audioPlay: false,
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

  componentDidCatch(/*error*/) {
    let errorSkipIndex;
    if (this.state.reinforcedUID) {
      const orderIdx = this.state.filteredPhrases.findIndex(
        (p) => p.uid === this.state.reinforcedUID
      );
      errorSkipIndex = this.state.order?.indexOf(orderIdx);
    } else {
      errorSkipIndex = this.state.selectedIndex;
    }

    this.setState({ errorSkipIndex });
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

    this.abortLoop();
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    const ac3 = new AbortController();
    const ac4 = new AbortController();
    const ac5 = new AbortController();

    this.loopAbortControllers = [ac1, ac2, ac3, ac4, ac5];
    this.forceUpdate();

    const japanese = (/** @type {AbortController} */ ac) =>
      loopN(this.state.loop, () => this.looperSwipe("up", ac), 1500, ac);

    const english = (/** @type {AbortController} */ ac) =>
      this.looperSwipe("down", ac);

    pause(700, ac1)
      .then(() => {
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
      .then(() => pause(3000, ac3))
      .then(() => {
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
      [" ", this.props.flipPhrasesPracticeSide],
    ];

    for (const [action, handler] of actionHandlers) {
      if (action === event.key) {
        if (action !== " ") {
          if (this.abortLoop()) {
            this.forceUpdate();
          } else {
            setMediaSessionPlaybackState("paused");
          }
        }

        handler();
        break;
      }
    }
  }

  setOrder() {
    const filteredPhrases = termFilterByType(
      this.props.filterType,
      this.props.phrases,
      this.props.frequency,
      this.props.activeGroup,
      this.props.togglePhrasesFilter
    );

    let newOrder;

    if (
      !this.props.isOrdered &&
      this.props.filterType !== TermFilterBy.SPACE_REP
    ) {
      // randomized
      this.props.logger("Randomized", DebugLevel.DEBUG);
      newOrder = randomOrder(filteredPhrases);
    } else if (this.props.filterType === TermFilterBy.SPACE_REP) {
      // space repetition order
      this.props.logger("Space Rep", DebugLevel.DEBUG);
      newOrder = spaceRepOrder(filteredPhrases, this.props.repetition);
    } else {
      // alphabetized
      this.props.logger("Alphabetic", DebugLevel.DEBUG);
      ({ order: newOrder } = alphaOrder(filteredPhrases));
    }

    const filteredKeys = filteredPhrases.map((f) => f.uid);
    const frequency = this.props.frequency.filter((f) =>
      filteredKeys.includes(f)
    );

    this.setState({ filteredPhrases, order: newOrder, frequency });
  }

  gotoNext() {
    const l = this.state.filteredPhrases.length;
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
      this.state.filteredPhrases,
      this.state.reinforcedUID,
      this.updateReinforcedUID,
      this.gotoNext,
      this.props.removeFrequencyPhrase
    );
  }

  gotoPrev() {
    const l = this.state.filteredPhrases.length;
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
        // interrupt loop
        if (this.abortLoop()) {
          this.forceUpdate();
        } else {
          setMediaSessionPlaybackState("paused");
        }
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
          this.state.filteredPhrases
        );
      const phrase = getTerm(uid, this.props.phrases);

      if (direction === "up") {
        const inJapanese = audioPronunciation(phrase);
        const audioUrl = addParam(pronounceEndoint, {
          tl: "ja",
          q: inJapanese,
          uid,
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
        const inEnglish = phrase.english;
        const audioUrl = addParam(pronounceEndoint, {
          tl: "en",
          q: inEnglish,
          uid: phrase.uid + ".en",
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

    if (this.state.filteredPhrases.length < 1)
      return <NotReady addlStyle="main-panel" />;

    const uid =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredPhrases
      );
    const phrase = getTerm(uid, this.props.phrases);
    const phrase_reinforce = this.state.frequency.includes(phrase.uid);

    const jObj = JapaneseText.parse(phrase);
    const japanesePhrase = jObj.toHTML();

    const englishPhrase = (
      <span
        // className={classNames({"info-color":this.state.showLit})}
        onClick={
          phrase.lit
            ? () => {
                this.setState((/** @type {PhrasesState} */ state) => ({
                  showLit: !state.showLit,
                }));
              }
            : undefined
        }
      >
        {!this.state.showLit ? phrase.english : phrase.lit}
      </span>
    );

    const romaji = phrase.romaji;

    let eLabel = <span>{"[English]"}</span>;
    let jLabel = <span>{"[Japanese]"}</span>;

    const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
      this.props.practiceSide,
      englishPhrase,
      japanesePhrase,
      eLabel,
      jLabel
    );

    const audioWords = audioWordsHelper(
      this.state.prevPlayed,
      this.props.autoPlay,
      phrase,
      this.state.prevPhrase
    );

    let loopActionBtn;
    if (this.state.loop > 0 && this.loopAbortControllers === undefined) {
      loopActionBtn = <LoopStartBtn onClick={this.beginLoop} />;
    } else if (this.state.loop > 0 && this.loopAbortControllers !== undefined) {
      loopActionBtn = (
        <LoopStopBtn
          onClick={() => {
            this.abortLoop();
            this.setState({ loop: 0 });
          }}
        />
      );
    }

    const playButton = (
      <AudioItem
        visible={!this.props.touchSwipe && this.state.loop === 0}
        word={audioWords}
        autoPlay={
          !this.state.audioPlay ? AutoPlaySetting.OFF : this.props.autoPlay
        }
        onPushedPlay={() => {
          if (this.props.autoPlay !== AutoPlaySetting.JP_EN) {
            this.props.pushedPlay(true);
          }
        }}
        onAutoPlayDone={() => {
          this.props.pushedPlay(false);
        }}
      />
    );

    const shortEN = (phrase.lit?.length || phrase.english.length) < 55;
    const shortJP = jObj.getSpelling().length < 55;

    const progress =
      ((this.state.selectedIndex + 1) / this.state.filteredPhrases.length) *
      100;

    return [
      <div key={0} className="phrases main-panel h-100">
        <div
          className="d-flex justify-content-between h-100"
          onTouchStart={this.props.touchSwipe ? this.startMove : undefined}
          onTouchMove={this.props.touchSwipe ? this.inMove : undefined}
          onTouchEnd={this.props.touchSwipe ? this.endMove : undefined}
        >
          <StackNavButton
            ariaLabel="Previous"
            color={"--orange"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          <div className="pt-3 d-flex flex-column justify-content-around text-center">
            <Sizable
              breakPoint="md"
              largeClassName={{ "fs-display-5": true }}
              smallClassName={
                // {Japanese : English}
                {
                  ...(!this.props.practiceSide
                    ? { [shortJP ? "h1" : "h3"]: true }
                    : { [shortEN ? "h1" : "h3"]: true }),
                }
              }
            >
              {topValue}
            </Sizable>
            {this.props.romajiActive && romaji && (
              <h5>
                <span
                  onClick={() => {
                    this.setState((/** @type {PhrasesState} */ state) => ({
                      showRomaji: !state.showRomaji,
                    }));
                  }}
                  className="clickable loop-no-interrupt"
                >
                  {this.state.showRomaji ? romaji : "[Romaji]"}
                </span>
              </h5>
            )}
            <Sizable
              className={{ "loop-no-interrupt": true }}
              breakPoint="md"
              onClick={() => {
                this.setState((/** @type {PhrasesState} */ state) => ({
                  showMeaning: !state.showMeaning,
                }));
              }}
              largeClassName={{ "fs-display-5": true }}
              smallClassName={
                // {Japanese : English}
                {
                  ...(this.props.practiceSide
                    ? { [shortJP ? "h1" : "h3"]: true }
                    : { [shortEN ? "h1" : "h3"]: true }),
                }
              }
            >
              {this.state.showMeaning ? bottomValue : bottomLabel}
            </Sizable>
            <div className="d-flex justify-content-center">{playButton}</div>
          </div>
          <StackNavButton
            color={"--orange"}
            ariaLabel="Next"
            action={this.gotoNextSlide}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={1} className="options-bar mb-3 flex-shrink-1">
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start">
              <TogglePracticeSideBtn
                toggle={this.props.practiceSide}
                action={this.props.flipPhrasesPracticeSide}
              />

              <div className="sm-icon-grp">
                <LoopSettingBtn
                  active={this.state.loop > 0}
                  loop={this.state.loop}
                  onClick={() => {
                    this.abortLoop();
                    this.setState((/** @type {PhrasesState}*/ state) => ({
                      loop: state.loop < 3 ? state.loop + 1 : 0,
                    }));
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
              <ToggleLiteralPhraseBtn
                visible={phrase.lit !== undefined && phrase.lit !== ""}
                toggle={this.state.showLit}
                action={() => {
                  this.setState((/** @type {PhrasesState} */ state) => ({
                    showLit: !state.showLit,
                  }));
                }}
              />
              <ToggleFrequencyTermBtn
                addFrequencyTerm={this.props.addFrequencyPhrase}
                removeFrequencyTerm={this.props.removeFrequencyPhrase}
                toggle={phrase_reinforce}
                term={phrase}
              />
            </div>
          </div>
        </div>
      </div>,
      <div key={2} className="progress-bar flex-shrink-1">
        <LinearProgress
          variant="determinate"
          value={progress}
          color={phrase_reinforce ? "secondary" : "primary"}
        />
      </div>,
    ];
  }
}
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return {
    phrases: state.phrases.value,
    practiceSide: state.settings.phrases.practiceSide,
    isOrdered: state.settings.phrases.ordered,
    romajiActive: state.settings.phrases.romaji,
    filterType: state.settings.phrases.filter,
    frequency: state.settings.phrases.frequency,
    activeGroup: state.settings.phrases.activeGroup,
    prevPushPlay: state.vocabulary.pushedPlay,
    autoPlay: state.settings.vocabulary.autoPlay,
    reinforce: state.settings.phrases.reinforce,
    prevTerm: state.vocabulary.prevTerm,
    repetition: state.settings.phrases.repetition,
    touchSwipe: state.settings.global.touchSwipe,
  };
};

Phrases.propTypes = {
  getPhrases: PropTypes.func.isRequired,
  activeGroup: PropTypes.array,
  addFrequencyPhrase: PropTypes.func,
  removeFrequencyPhrase: PropTypes.func,
  frequency: PropTypes.array,
  phrases: PropTypes.array.isRequired,
  romajiActive: PropTypes.bool,
  flipPhrasesPracticeSide: PropTypes.func,
  practiceSide: PropTypes.bool,
  isOrdered: PropTypes.bool,
  filterType: PropTypes.number,
  togglePhrasesFilter: PropTypes.func,
  reinforce: PropTypes.bool,
  repetition: PropTypes.object,
  lastNext: PropTypes.number,
  updateSpaceRepPhrase: PropTypes.func,
  logger: PropTypes.func,
  prevTerm: PropTypes.shape({
    japanese: PropTypes.string.isRequired,
    english: PropTypes.string.isRequired,
    uid: PropTypes.string.isRequired,
  }),
  pushedPlay: PropTypes.func,
  prevPushPlay: PropTypes.bool,
  clearPreviousTerm: PropTypes.func,
  setPreviousTerm: PropTypes.func,
  autoPlay: PropTypes.number,
  touchSwipe: PropTypes.bool,
};

export default connect(mapStateToProps, {
  getPhrases,
  flipPhrasesPracticeSide,
  addFrequencyPhrase,
  removeFrequencyPhrase,
  togglePhrasesFilter,
  clearPreviousTerm,
  setPreviousTerm,
  updateSpaceRepPhrase,
  logger,
  pushedPlay,
})(Phrases);

export { PhrasesMeta };
