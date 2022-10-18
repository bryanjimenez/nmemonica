import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  ProjectIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import { getPhrases } from "../../actions/phrasesAct";
import {
  faDice,
  faGlasses,
  faPencilAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  faPlayCircle,
  faStopCircle,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  addFrequencyPhrase,
  updateSpaceRepPhrase,
  flipPhrasesPracticeSide,
  removeFrequencyPhrase,
  togglePhrasesFilter,
  AUTOPLAY_JP_EN,
  AUTOPLAY_OFF,
  AUTOPLAY_EN_JP,
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
} from "../../helper/gameHelper";
import { FILTER_FREQ, FILTER_REP } from "../../actions/settingsAct";
import { logger } from "../../actions/consoleAct";
import { spaceRepLog } from "../../helper/consoleHelper";
import { pushedPlay, setPreviousWord } from "../../actions/vocabularyAct";
import AudioItem from "../Form/AudioItem";
import {
  swipeEnd,
  swipeMove,
  swipeStart,
} from "react-slick/lib/utils/innerSliderUtils";
import { pronounceEndoint } from "../../../environment.development";
import { addParam } from "../../helper/urlHelper";
import classNames from "classnames";
import BtnLoop from "../Form/BtnLoop";
import {
  mediaSessionAttach,
  mediaSessionDetachAll,
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
} from "../../helper/mediaHelper";

/**
 * @typedef {import("react").TouchEventHandler} TouchEventHandler
 * @typedef {import("../../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 * @typedef {{nextUID:string, nextIndex?:undefined}|{nextUID?:undefined, nextIndex:number}} MEid
 * @typedef {import("../../typings/raw").ActionHandlerTuple} ActionHandlerTuple
 */

/**
 * @typedef {{
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
 * getPhrases: function,
 * phrases: RawPhrase[],
 * isOrdered: boolean,
 * flipPhrasesPracticeSide: function,
 * practiceSide: boolean,
 * romajiActive: boolean,
 * removeFrequencyPhrase: function,
 * addFrequencyPhrase: function,
 * frequency: string[],
 * filterType: number,
 * togglePhrasesFilter: function,
 * reinforce: boolean,
 * activeGroup: string[],
 * repetition: SpaceRepetitionMap,
 * lastNext: number,
 * updateSpaceRepPhrase: function,
 * logger: function,
 * prevTerm: RawPhrase,
 * prevPushPlay: boolean,
 * pushedPlay: function,
 * setPreviousWord: function,
 * autoPlay: number,
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
    this.props.setPreviousWord(undefined);

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
        const uid =
          this.state.reinforcedUID ||
          getTermUID(
            this.state.selectedIndex,
            this.state.order,
            this.state.filteredPhrases
          );
        const term = getTerm(uid, this.props.phrases);

        spaceRepLog(this.props.logger, term, this.props.repetition);

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

          this.props.setPreviousWord({ ...prevPhrase }).then(() => {
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
        this.props.filterType === FILTER_FREQ &&
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
      [" ", this.props.flipPhrasesPracticeSide],
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
    const filteredPhrases = termFilterByType(
      this.props.filterType,
      this.props.phrases,
      this.props.frequency,
      this.props.activeGroup,
      this.props.togglePhrasesFilter
    );

    let newOrder;

    if (!this.props.isOrdered && this.props.filterType !== FILTER_REP) {
      // randomized
      this.props.logger("Randomized", 3);
      newOrder = randomOrder(filteredPhrases);
    } else if (this.props.filterType === FILTER_REP) {
      // space repetition order
      this.props.logger("Space Rep", 3);
      newOrder = spaceRepOrder(filteredPhrases, this.props.repetition);
    } else {
      // alphabetized
      this.props.logger("Alphabetic", 3);
      ({ order: newOrder } = alphaOrder(filteredPhrases));
    }

    const filteredKeys = filteredPhrases.map((f) => f.uid);
    const frequency = this.props.frequency.filter((f) =>
      filteredKeys.includes(f)
    );

    this.setState({ filteredPhrases, order: newOrder, frequency });
  }

  gotoNextSlide() {
    const uid =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredPhrases
      );
    let phrase = getTerm(uid, this.props.phrases);

    // prevent updates when quick scrolling
    if (minimumTimeForSpaceRepUpdate(this.state.lastNext)) {
      const shouldIncrement = !this.state.frequency.includes(phrase.uid);
      const repO = this.props.updateSpaceRepPhrase(phrase.uid, shouldIncrement);
      spaceRepLog(this.props.logger, phrase, { [phrase.uid]: repO });
    }

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

  gotoNext() {
    const l = this.state.filteredPhrases.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      lastNext: Date.now(),
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
      showLit: false,
    });
  }

  gotoPrev() {
    const l = this.state.filteredPhrases.length;
    const i = this.state.selectedIndex - 1;

    let newSel;
    if (this.state.reinforcedUID) {
      newSel = this.state.selectedIndex;
    } else {
      newSel = i < 0 ? (l + i) % l : i % l;
    }

    this.setState({
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
      showLit: false,
    });
  }

  /**
   * @param {string} uid
   */
  updateReinforcedUID(uid) {
    this.setState({
      reinforcedUID: uid,
      showMeaning: false,
      showRomaji: false,
      showLit: false,
    });

    const phrase = getTerm(uid, this.props.phrases);

    const text =
      phrase.english.length < 15
        ? phrase.english
        : phrase.english.slice(0, 15) + "...";

    this.props.logger("reinforce (" + text + ")", 3);
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
      this.abortLoop();
      this.forceUpdate();
      setMediaSessionPlaybackState("paused");
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
        const inEnglish = phrase.english;
        const audioUrl = addParam(pronounceEndoint, {
          tl: "en",
          q: inEnglish,
          uid: phrase.uid + ".en",
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

    const japanesePhrase = JapaneseText.parse(phrase).toHTML();

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

    let playButton;

    if (this.state.loop > 0 && !this.loopAbortControllers) {
      playButton = (
        <div className="d-flex justify-content-center">
          <FontAwesomeIcon
            size="2x"
            className="clickable"
            onClick={this.beginLoop}
            icon={faPlayCircle}
          />
        </div>
      );
    } else if (this.state.loop > 0 && this.loopAbortControllers) {
      playButton = (
        <div className="d-flex justify-content-center">
          <FontAwesomeIcon
            size="2x"
            className="clickable"
            onClick={() => {
              this.setState({ loop: 0 });
            }}
            icon={faStopCircle}
          />
        </div>
      );
    } else if (this.state.loop === 0) {
      playButton = (
        <AudioItem
          visible={!this.props.touchSwipe}
          word={audioWords}
          autoPlay={!this.state.audioPlay ? AUTOPLAY_OFF : this.props.autoPlay}
          onPushedPlay={() => {
            if (this.props.autoPlay !== AUTOPLAY_JP_EN) {
              this.props.pushedPlay(true);
            }
          }}
          onAutoPlayDone={() => {
            this.props.pushedPlay(false);
          }}
        />
      );
    }

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
            <h1>{topValue}</h1>
            {this.props.romajiActive && romaji && (
              <h5>
                <span
                  onClick={() => {
                    this.setState((/** @type {PhrasesState} */ state) => ({
                      showRomaji: !state.showRomaji,
                    }));
                  }}
                  className="clickable"
                >
                  {this.state.showRomaji ? romaji : "[Romaji]"}
                </span>
              </h5>
            )}
            <h2>
              <span
                onClick={() => {
                  this.setState((/** @type {PhrasesState} */ state) => ({
                    showMeaning: !state.showMeaning,
                  }));
                }}
                className="clickable"
              >
                {this.state.showMeaning ? bottomValue : bottomLabel}
              </span>
            </h2>

            {playButton}
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
        <div className="row">
          <div className="col">
            <div className="d-flex justify-content-start">
              <div>
                <FontAwesomeIcon
                  className="clickable"
                  onClick={this.props.flipPhrasesPracticeSide}
                  icon={this.props.practiceSide ? faGlasses : faPencilAlt}
                />
              </div>

              <div className="sm-icon-grp">
                <BtnLoop
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
            </div>
          </div>
          <div className="col text-center" style={{ maxHeight: "24px" }}>
            {this.state.reinforcedUID && (
              <FontAwesomeIcon className="clickable" icon={faDice} />
            )}
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              {phrase.lit && (
                <div
                  className={classNames({
                    "sm-icon-grp": true,
                    "info-color": this.state.showLit,
                  })}
                  onClick={() =>
                    this.setState((/** @type {PhrasesState} */ state) => ({
                      showLit: !state.showLit,
                    }))
                  }
                >
                  <ProjectIcon
                    className="clickable"
                    size="small"
                    aria-label="Literal english translation available"
                  />
                </div>
              )}

              {this.props.frequency.includes(phrase.uid) ? (
                <div
                  className="sm-icon-grp"
                  onClick={() => {
                    this.props.removeFrequencyPhrase(phrase.uid);
                  }}
                >
                  <XCircleIcon
                    className="clickable"
                    size="small"
                    aria-label="Remove frequency phrase"
                  />
                </div>
              ) : (
                <div
                  className="sm-icon-grp"
                  onClick={() => {
                    this.props.addFrequencyPhrase(phrase.uid);
                  }}
                >
                  <PlusCircleIcon
                    className="clickable"
                    size="small"
                    aria-label="Add frequency phrase"
                  />
                </div>
              )}
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
    frequency: state.settings.phrases.frequency,
    activeGroup: state.settings.phrases.activeGroup,
    filterType: state.settings.phrases.filter,
    reinforce: state.settings.phrases.reinforce,
    repetition: state.settings.phrases.repetition,

    touchSwipe: state.settings.global.touchSwipe,
    // TODO: vocabulary?
    prevTerm: state.vocabulary.previous,
    prevPushPlay: state.vocabulary.pushedPlay,
    autoPlay: state.settings.vocabulary.autoPlay,
  };
};

Phrases.propTypes = {
  getPhrases: PropTypes.func.isRequired,
  phrases: PropTypes.array.isRequired,
  isOrdered: PropTypes.bool,
  flipPhrasesPracticeSide: PropTypes.func,
  practiceSide: PropTypes.bool,
  romajiActive: PropTypes.bool,
  removeFrequencyPhrase: PropTypes.func,
  addFrequencyPhrase: PropTypes.func,
  frequency: PropTypes.array,
  filterType: PropTypes.number,
  togglePhrasesFilter: PropTypes.func,
  reinforce: PropTypes.bool,
  activeGroup: PropTypes.array,
  repetition: PropTypes.object,
  lastNext: PropTypes.number,
  updateSpaceRepPhrase: PropTypes.func,
  logger: PropTypes.func,
  prevTerm: PropTypes.shape({
    japanese: PropTypes.string.isRequired,
    english: PropTypes.string.isRequired,
    uid: PropTypes.string.isRequired,
  }),
  prevPushPlay: PropTypes.bool,
  pushedPlay: PropTypes.func,
  setPreviousWord: PropTypes.func,
  autoPlay: PropTypes.number,
  touchSwipe: PropTypes.bool,
};

export default connect(mapStateToProps, {
  getPhrases,
  flipPhrasesPracticeSide,
  removeFrequencyPhrase,
  addFrequencyPhrase,
  togglePhrasesFilter,
  updateSpaceRepPhrase,
  logger,
  setPreviousWord,
  pushedPlay,
})(Phrases);

export { PhrasesMeta };
