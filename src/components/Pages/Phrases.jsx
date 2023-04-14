import { LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";
import { pronounceEndoint } from "../../../environment.development";
import { logger } from "../../slices/settingSlice";
import { getPhrase } from "../../slices/phraseSlice";
import {
  addFrequencyPhrase,
  flipPhrasesPracticeSide,
  removeFrequencyPhrase,
  updateSpaceRepPhrase,
  togglePhrasesFilter,
} from "../../slices/phraseSlice";
import {
  DebugLevel,
  TermFilterBy,
  TermSortBy,
} from "../../slices/settingHelper";
import { fetchAudio } from "../../helper/audioHelper.development";
import { logify, spaceRepLog } from "../../helper/consoleHelper";
import {
  alphaOrder,
  dateViewOrder,
  getCacheUID,
  getTerm,
  getTermUID,
  labelPlacementHelper,
  loopN,
  minimumTimeForSpaceRepUpdate,
  pause,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { audioPronunciation, JapaneseText } from "../../helper/JapaneseText";
import {
  mediaSessionAttach,
  mediaSessionDetachAll,
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
} from "../../helper/mediaHelper";
import { swipeEnd, swipeMove, swipeStart } from "../../helper/TouchSwipe";
import { addParam } from "../../helper/urlHelper";
import AudioItem from "../Form/AudioItem";
import { LoopSettingBtn, LoopStartBtn, LoopStopBtn } from "../Form/BtnLoop";
import Console from "../Form/Console";
import { MinimalUI } from "../Form/MinimalUI";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ReCacheAudioBtn,
  ToggleFrequencyTermBtnMemo,
  ToggleLiteralPhraseBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import Sizable from "../Form/Sizable";
import StackNavButton from "../Form/StackNavButton";

/**
 * @typedef {import("react").TouchEventHandler} TouchEventHandler
 * @typedef {import("../../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {{nextUID:string, nextIndex?:undefined}|{nextUID?:undefined, nextIndex:number}} MEid
 * @typedef {import("../../typings/raw").ActionHandlerTuple} ActionHandlerTuple
 */

/**
 * @typedef {Object} PhrasesState
 * @property {import("../Form/Console").ConsoleMessage[]} errorMsgs
 * @property {number} errorSkipIndex
 * @property {number} lastNext        timestamp of last swipe
 * @property {number} selectedIndex
 * @property {boolean} showMeaning
 * @property {boolean} showRomaji
 * @property {boolean} showLit
 * @property {RawPhrase[]} filteredPhrases
 * @property {string[]} frequency subset of frequency words within current active group
 * @property {number[]} [order]
 * @property {string} [reinforcedUID]
 * @property {any} [swiping]
 * @property {boolean} recacheAudio
 * @property {0|1|2|3} loop
 */

/**
 * @typedef {Object} PhrasesProps
 * @property {typeof getPhrase} getPhrase
 * @property {RawPhrase[]} phrases
 * @property {typeof TermSortBy[keyof TermSortBy]} termsOrder
 * @property {typeof flipPhrasesPracticeSide} flipPhrasesPracticeSide
 * @property {boolean} practiceSide   true: English, false: Japanese
 * @property {boolean} romajiActive
 * @property {typeof removeFrequencyPhrase} removeFrequencyPhrase
 * @property {typeof addFrequencyPhrase} addFrequencyPhrase
 * @property {{uid: string, count: number}} frequency       value of *last* frequency word update
 * @property {typeof TermFilterBy[keyof TermFilterBy]} filterType
 * @property {typeof togglePhrasesFilter} togglePhrasesFilter
 * @property {boolean} reinforce
 * @property {string[]} activeGroup
 * @property {SpaceRepetitionMap} repetition
 * @property {typeof updateSpaceRepPhrase} updateSpaceRepPhrase
 * @property {typeof logger} logger
 * @property {number} swipeThreshold
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
      frequency: [],
      recacheAudio: false,
      loop: 0,
    };

    /** @type {PhrasesProps} */
    this.props;

    /** @type {import("../../typings/raw").SetState<PhrasesState>} */
    this.setState;

    if (this.props.phrases.length === 0) {
      this.props.getPhrase();
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
  }

  componentDidMount() {
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
   * @param {PhrasesProps} prevProps
   * @param {PhrasesState} prevState
   */
  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.phrases.length != prevProps.phrases.length ||
      this.props.termsOrder != prevProps.termsOrder
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
      this.props.frequency.uid != prevProps.frequency.uid ||
      this.props.frequency.count != prevProps.frequency.count
    ) {
      // console.log('frequency word changed');
      if (
        this.props.filterType === TermFilterBy.FREQUENCY &&
        this.props.frequency.count === 0
      ) {
        // last frequency phrase was removed
        this.setOrder();
      } else {
        const filteredKeys = this.state.filteredPhrases.map((f) => f.uid);
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
        this.props
          .updateSpaceRepPhrase({uid, shouldIncrement})
          .then(({ payload }) => {
            const { map, prevMap } = payload;

            const prevDate = prevMap[uid] && prevMap[uid].d;
            const repStats = { [uid]: { ...map[uid], d: prevDate } };
            spaceRepLog(this.props.logger, phrase, repStats, {
              frequency: prevState.reinforcedUID !== undefined,
            });
          });
      }

      this.setState({
        showMeaning: false,
        showRomaji: false,
        showLit: false,
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
    const allFrequency = Object.keys(this.props.repetition).reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (this.props.repetition[cur].rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    const filteredPhrases = termFilterByType(
      this.props.filterType,
      this.props.phrases,
      allFrequency,
      this.props.activeGroup,
      this.props.togglePhrasesFilter
    );

    let newOrder;

    if (this.props.termsOrder === TermSortBy.RANDOM) {
      this.props.logger("Randomized", DebugLevel.DEBUG);
      newOrder = randomOrder(filteredPhrases);
    } else if (this.props.termsOrder === TermSortBy.VIEW_DATE) {
      this.props.logger("Date Viewed", DebugLevel.DEBUG);
      newOrder = dateViewOrder(filteredPhrases, this.props.repetition);
    } else {
      this.props.logger("Alphabetic", DebugLevel.DEBUG);
      ({ order: newOrder } = alphaOrder(filteredPhrases));
    }

    const filteredKeys = filteredPhrases.map((f) => f.uid);
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
      filteredPhrases,
      frequency,
      order: newOrder,
    });
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
    // const direction = getSwipeDirection(this.state.swiping.touchObject, true);
    if (this.state.loop && this.loopAbortControllers) {
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
          this.forceUpdate();
        } else {
          setMediaSessionPlaybackState("paused");
        }
      }
    }

    swipeEnd(e, { ...this.state.swiping, onSwipe: this.swipeActionHandler });
  }

  /**
   * @param {string} direction
   * @param {AbortController} [AbortController]
   */
  swipeActionHandler(direction, AbortController) {
    // this.props.logger("swiped " + direction, DebugLevel.WARN);
    let swipePromise;

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
      const override = this.state.recacheAudio ? "/override_cache" : "";

      if (direction === "up") {
        const inJapanese = audioPronunciation(phrase);
        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "ja",
          q: inJapanese,
          uid,
        });

        swipePromise = fetchAudio(audioUrl, AbortController);
      } else if (direction === "down") {
        const inEnglish = phrase.english;

        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "en",
          q: inEnglish,
          uid: phrase.uid + ".en",
        });

        swipePromise = fetchAudio(audioUrl, AbortController);
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
    const phrase_reinforce = this.props.repetition[phrase.uid]?.rein === true;

    const jObj = JapaneseText.parse(phrase);
    const japanesePhrase = jObj.toHTML();

    const englishPhrase = (
      <span
        // className={classNames({"info-color":this.state.showLit})}
        onClick={
          phrase.lit
            ? () => {
                this.setState((state) => ({
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

    const audioWords = this.props.practiceSide
      ? { tl: "en", q: phrase.english, uid: phrase.uid + ".en" }
      : {
          tl: "ja",
          q: audioPronunciation(phrase),
          uid: getCacheUID(phrase),
        };

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
        visible={this.props.swipeThreshold === 0 && this.state.loop === 0}
        word={audioWords}
        reCache={this.state.recacheAudio}
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
          onTouchStart={
            this.props.swipeThreshold > 0 ? this.startMove : undefined
          }
          onTouchMove={this.props.swipeThreshold > 0 ? this.inMove : undefined}
          onTouchEnd={this.props.swipeThreshold > 0 ? this.endMove : undefined}
        >
          <StackNavButton ariaLabel="Previous" action={this.gotoPrev}>
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
                    this.setState((state) => ({
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
                this.setState((state) => ({
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
          <StackNavButton ariaLabel="Next" action={this.gotoNextSlide}>
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
              <div className="sm-icon-grp">
                <LoopSettingBtn
                  active={this.state.loop > 0}
                  loop={this.state.loop}
                  onClick={() => {
                    this.abortLoop();
                    this.setState((state) => ({
                      loop: /** @type {PhrasesState["loop"]} */ (
                        state.loop < 3 ? state.loop + 1 : 0
                      ),
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
                  this.setState((state) => ({
                    showLit: !state.showLit,
                  }));
                }}
              />
              <ToggleFrequencyTermBtnMemo
                addFrequencyTerm={this.props.addFrequencyPhrase}
                removeFrequencyTerm={this.props.removeFrequencyPhrase}
                toggle={phrase_reinforce}
                term={phrase}
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
          color={phrase_reinforce ? "secondary" : "primary"}
        />
      </div>,
    ];
  }
}

const mapStateToProps = (/** @type {RootState} */ state) => {
  return {
    phrases: state.phrases.value,
    practiceSide: state.phrases.setting.practiceSide,
    termsOrder: state.phrases.setting.ordered,
    romajiActive: state.phrases.setting.romaji,
    filterType: state.phrases.setting.filter,
    frequency: state.phrases.setting.frequency,
    activeGroup: state.phrases.setting.activeGroup,
    reinforce: state.phrases.setting.reinforce,
    repetition: state.phrases.setting.repetition,
    swipeThreshold: state.setting.global.swipeThreshold,
  };
};

Phrases.propTypes = {
  activeGroup: PropTypes.array,
  frequency: PropTypes.object,
  phrases: PropTypes.array.isRequired,
  romajiActive: PropTypes.bool,
  practiceSide: PropTypes.bool,
  termsOrder: PropTypes.number,
  filterType: PropTypes.number,
  reinforce: PropTypes.bool,
  repetition: PropTypes.object,
  swipeThreshold: PropTypes.number,

  getPhrase: PropTypes.func.isRequired,
  addFrequencyPhrase: PropTypes.func,
  removeFrequencyPhrase: PropTypes.func,
  flipPhrasesPracticeSide: PropTypes.func,
  togglePhrasesFilter: PropTypes.func,
  updateSpaceRepPhrase: PropTypes.func,
  logger: PropTypes.func,
};

export default connect(mapStateToProps, {
  getPhrase,
  flipPhrasesPracticeSide,
  addFrequencyPhrase,
  removeFrequencyPhrase,
  togglePhrasesFilter,
  updateSpaceRepPhrase,
  logger,
})(Phrases);

export { PhrasesMeta };
