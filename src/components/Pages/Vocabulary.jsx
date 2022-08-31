import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GiftIcon,
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
  faRunning,
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
} from "../../actions/settingsAct";
import {
  audioPronunciation,
  htmlElementHint,
  JapaneseText,
} from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { Avatar, Grow, LinearProgress } from "@material-ui/core";
import StackOrderSlider from "../Form/StackOrderSlider";
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
  cacheIdx,
} from "../../helper/gameHelper";
import { FILTER_FREQ, FILTER_REP } from "../../reducers/settingsRed";
import { logger } from "../../actions/consoleAct";
import { spaceRepLog } from "../../helper/consoleHelper";
import {
  swipeEnd,
  swipeMove,
  swipeStart,
} from "react-slick/lib/utils/innerSliderUtils";
import { pronounceEndoint } from "../../../environment.development";
import { addParam } from "../../helper/urlHelper";
import { gPronounceCacheIndexParam } from "../../constants/paths";

const VocabularyMeta = {
  location: "/vocabulary/",
  label: "Vocabulary",
};

class Vocabulary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lastNext: Date.now(),
      selectedIndex: 0,
      showEng: false,
      showMeaning: false,
      showRomaji: false,
      showHint: false,
      filteredVocab: [],
      frequency: [], // subset of frequency words within current active group
    };

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
  }

  componentDidMount() {
    // clear existing previous word on mount
    this.props.setPreviousWord(undefined);

    if (this.props.vocab && this.props.vocab.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }
  }

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
        this.props.filterType === FILTER_FREQ &&
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
    let jbare = [];
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
    const frequency = this.props.frequency.filter((f) =>
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

  verbNonVerbTransition(nextIndex, nextUID) {
    let aPromise = Promise.resolve();

    const uidPrev =
      this.state.reinforcedUID ||
      getTermUID(
        this.state.selectedIndex,
        this.state.order,
        this.state.filteredVocab
      );
    const prevVocab = getTerm(uidPrev, this.props.vocab);

    const uidNext =
      nextUID ||
      getTermUID(nextIndex, this.state.order, this.state.filteredVocab);
    const nextVocab = getTerm(uidNext, this.props.vocab);

    // non verb to verb
    if (prevVocab.grp !== "Verb" && nextVocab.grp === "Verb") {
      aPromise = this.props.setPreviousWord(prevVocab);
    }

    // verb to non verb
    if (prevVocab.grp === "Verb" && nextVocab.grp !== "Verb") {
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

    this.verbNonVerbTransition(newSel).then(() => {
      this.setState({
        lastNext: Date.now(),
        reinforcedUID: undefined,
        selectedIndex: newSel,
        showEng: false,
        showMeaning: false,
        showRomaji: false,
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

    this.verbNonVerbTransition(newSel);

    this.setState({
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showEng: false,
      showMeaning: false,
      showRomaji: false,
      showHint: false,
    });
  }

  updateReinforcedUID(uid) {
    this.verbNonVerbTransition(undefined, uid);

    this.setState({
      reinforcedUID: uid,
      showMeaning: false,
      showRomaji: false,
      showHint: false,
    });

    const vocabulary = getTerm(uid, this.props.vocab);

    this.props.logger("reinforce (" + vocabulary.english + ")", 3);
  }

  startMove(e) {
    const swiping = swipeStart(e, true, true);
    this.setState({ swiping });
  }

  inMove(e) {
    if (this.state.swiping) {
      const swiping = swipeMove(e, {
        ...this.state.swiping,
        verticalSwiping: true,
      });
      this.setState({ swiping });
    }
  }

  endMove(e) {
    // const direction = getSwipeDirection(this.state.swiping.touchObject,true);
    swipeEnd(e, {
      ...this.state.swiping,
      dragging: true,
      verticalSwiping: true,
      listHeight: 1,
      touchThreshold: 5,
      onSwipe: this.swipeActionHandler,
    });
  }

  swipeActionHandler(direction) {
    // this.props.logger("swiped " + direction, 3);

    if (direction === "left") {
      this.gotoNextSlide();
    } else if (direction === "right") {
      this.gotoPrev();
    } else {
      const uid =
        this.state.reinforcedUID ||
        getTermUID(
          this.state.selectedIndex,
          this.state.order,
          this.state.filteredVocab
        );
      const vocabulary = getTerm(uid, this.props.vocab);

      if (direction === "up") {
        let audioUrl;
        if (vocabulary.grp === "Verb" && this.props.verbForm !== "dictionary") {
          const verb = verbToTargetForm(vocabulary, this.props.verbForm);
          const inJapanese = audioPronunciation({
            japanese: verb.getSpelling(),
          });
          audioUrl = addParam(pronounceEndoint, {
            tl: "ja",
            q: inJapanese,
            // [gPronounceCacheIndexParam]: conjugated verbs aren't overriden
          });
        } else {
          audioUrl = addParam(pronounceEndoint, {
            tl: "ja",
            q: audioPronunciation(vocabulary),
            [gPronounceCacheIndexParam]: cacheIdx(vocabulary),
          });
        }

        let na = addParam(pronounceEndoint, {
          tl: "ja",
          q: "っな",
        });
        const naAudio = new Audio(na);
        const japaneseAudio = new Audio(audioUrl);

        // too slow  .addEventListener("ended", () => {
        japaneseAudio.addEventListener("canplaythrough", () => {
          try {
            japaneseAudio.play().then(() => {
              if (JapaneseText.parse(vocabulary).isNaAdj()) {
                const volume = 0.4;
                const offset = 0.5;
                const naDelay = 1000 * (japaneseAudio.duration - offset);
                // this.props.logger("volume: "+volume, 1);
                // this.props.logger("offset: "+offset, 1);
                // this.props.logger("duration: "+japaneseAudio.duration, 1);
                // this.props.logger("delay: "+naDelay, 1);
                setTimeout(() => {
                  try {
                    naAudio.volume = volume;
                    naAudio.play();
                  } catch (e) {
                    this.props.logger("na-adj play failed " + e, 1);
                  }
                }, naDelay);
              }
            });
          } catch (e) {
            this.props.logger("Swipe Play Error " + e, 1);
          }
        });

        if (this.props.autoPlay !== AUTOPLAY_JP_EN) {
          this.props.pushedPlay(true);
        }
      } else if (direction === "down") {
        const inEnglish = vocabulary.english;
        const audioUrl = addParam(pronounceEndoint, { tl: "en", q: inEnglish });
        const englishAudio = new Audio(audioUrl);
        try {
          englishAudio.play();
        } catch (e) {
          this.props.logger("Swipe Play Error " + e, 1);
        }

        if (this.props.autoPlay !== AUTOPLAY_EN_JP) {
          this.props.pushedPlay(true);
        }
      }
    }
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
    vocabulary.reinforce = this.state.frequency.includes(vocabulary.uid);

    const isVerb = vocabulary.grp === "Verb";

    let hintActive, hint;
    if (this.props.practiceSide) {
      hint = htmlElementHint(vocabulary.japanese);
      hintActive = hint && this.props.hintActive;
    } else {
      hintActive =
        this.props.hintActive && vocabulary.grp && vocabulary.grp !== "";
      hint =
        vocabulary.grp + (vocabulary.subGrp ? ": " + vocabulary.subGrp : "");
    }

    let progress, pIdx, pList;

    progress =
      ((this.state.selectedIndex + 1) / this.state.filteredVocab.length) * 100;

    if (this.state.scrollJOrder) {
      pIdx = this.state.selectedIndex;
      pList = this.state.jbare;
    } else {
      pIdx = this.state.jbare[this.state.selectedIndex].idx;
      pList = this.state.ebare;
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
              practiceSide={this.props.practiceSide}
              linkToOtherTerm={(uid) => this.setState({ reinforcedUID: uid })}
            />
          ) : (
            <VocabularyMain vocabulary={vocabulary} />
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
              </div>
            </div>
            <div className="col text-center" style={{ maxHeight: "24px" }}>
              {this.state.showHint && (
                <h5
                  onClick={() => {
                    this.setState((state) => ({ showHint: !state.showHint }));
                  }}
                  className="clickable"
                >
                  {hint}
                </h5>
              )}
              {!this.state.showHint && this.state.reinforcedUID && (
                <FontAwesomeIcon className="clickable" icon={faDice} />
              )}
            </div>
            <div className="col">
              <div className="d-flex justify-content-end">
                {!hintActive ? null : !this.state.showHint ? (
                  <div
                    className="sm-icon-grp"
                    onClick={() => {
                      this.setState({ showHint: true });
                      setTimeout(() => {
                        this.setState({ showHint: false });
                      }, 1500);
                    }}
                  >
                    <GiftIcon
                      className="clickable"
                      size="small"
                      aria-label="hint"
                    />
                  </div>
                ) : (
                  <div className="sm-icon-grp">
                    <GiftIcon
                      className="disabled disabled-color"
                      size="small"
                      aria-label="hint unavailable"
                    />
                  </div>
                )}
                <div className="sm-icon-grp">
                  {vocabulary.reinforce ? (
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
            color={vocabulary.reinforce ? "secondary" : "primary"}
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
          <StackOrderSlider
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

const mapStateToProps = (state) => {
  return {
    vocab: state.vocabulary.value,
    practiceSide: state.settings.vocabulary.practiceSide,
    isOrdered: state.settings.vocabulary.ordered,
    romajiActive: state.settings.vocabulary.romaji,
    hintActive: state.settings.vocabulary.hint,
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
  hintActive: PropTypes.bool,
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
};

export default connect(mapStateToProps, {
  getVocabulary,
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  setPreviousWord,
  updateSpaceRepWord,
  logger,
  pushedPlay,
})(Vocabulary);

export { VocabularyMeta };
