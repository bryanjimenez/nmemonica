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
import { getVocabulary } from "../../actions/vocabularyAct";
import {
  faBan,
  faDice,
  faGlasses,
  faHeadphones,
  faPencilAlt,
  faRunning,
} from "@fortawesome/free-solid-svg-icons";
import { faDotCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
  toggleAutoVerbView,
  toggleVocabularyFilter,
} from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { htmlElementHint, JapaneseText } from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { Avatar, Grow, LinearProgress } from "@material-ui/core";
import { orderBy } from "lodash/collection";
import StackOrderSlider from "../Form/StackOrderSlider";
import VocabularyMain from "./VocabularyMain";
import VerbMain from "./VerbMain";
import { deepOrange } from "@material-ui/core/colors";
import { getTerm, play } from "../../helper/gameHelper";

const VocabularyMeta = {
  location: "/vocabulary/",
  label: "Vocabulary",
};

class Vocabulary extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.updateReinforcedUID = this.updateReinforcedUID.bind(this);
  }

  componentDidMount() {
    if (this.props.vocab && this.props.vocab.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }
  }

  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.vocab.length != prevProps.vocab.length) {
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
      if (this.props.freqFilter && this.props.frequency.length === 0) {
        this.setOrder();
      } else {
        const filteredKeys = this.state.filteredVocab.map((f) => f.uid);
        const frequency = this.props.frequency.filter((f) =>
          filteredKeys.includes(f)
        );
        // console.log('frequency word changed');
        // props.frequency is all frequency words
        // state.frequency is a subset of frequency words within current active group
        this.setState({ frequency });
      }
    }
  }

  setOrder() {
    let filteredVocab = this.props.vocab;

    if (this.props.freqFilter) {
      // frequency filtering
      if (this.props.frequency.length > 0) {
        filteredVocab = this.props.vocab.filter((v) =>
          this.props.frequency.includes(v.uid)
        );
      } else {
        // last frequency word was just removed
        this.props.toggleVocabularyFilter();
      }
    } else {
      // group filtering
      if (this.props.activeGroup.length > 0) {
        filteredVocab = this.props.vocab.filter(
          (w) =>
            this.props.activeGroup.includes(w.grp) ||
            this.props.activeGroup.includes(w.grp + "." + w.subGrp)
        );
      }
    }

    const newOrder = filteredVocab.map((v, i) => i);
    let jbare = [];
    let ebare = [];

    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    } else {
      filteredVocab = orderBy(filteredVocab, ["japanese"], ["asc"]);

      filteredVocab.forEach((v, i) => {
        jbare = [
          ...jbare,
          {
            uid: v.uid,
            label: JapaneseText.parse(v.japanese).getPronunciation(),
          },
        ];
        ebare = [
          ...ebare,
          { uid: v.uid, label: v.english.toLowerCase(), idx: i },
        ];
      });

      ebare = orderBy(ebare, ["label"], ["asc"]);

      ebare.forEach((e, i) => {
        jbare[e.idx] = { ...jbare[e.idx], idx: i };
      });
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

  gotoNext() {
    const l = this.state.filteredVocab.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showEng: false,
      showMeaning: false,
      showRomaji: false,
      showHint: false,
    });
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
    this.setState({
      reinforcedUID: uid,
      showMeaning: false,
      showRomaji: false,
      showHint: false,
    });
  }

  render() {
    if (this.state.filteredVocab.length < 1)
      return <NotReady addlStyle="main-panel" />;

    const vocabulary = getTerm(
      this.state.reinforcedUID,
      this.state.frequency,
      this.state.selectedIndex,
      this.state.order,
      this.state.filteredVocab
    );

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
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--yellow"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          {isVerb && this.props.autoVerbView ? (
            <VerbMain verb={vocabulary} verbForm={false} />
          ) : (
            <VocabularyMain vocabulary={vocabulary} />
          )}

          <StackNavButton
            color={"--yellow"}
            ariaLabel="Next"
            action={() => {
              play(
                this.props.reinforce,
                this.props.freqFilter,
                this.state.frequency,
                this.state.filteredVocab,
                this.state.reinforcedUID,
                this.updateReinforcedUID,
                this.gotoNext,
                this.props.removeFrequencyWord
              );
            }}
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
                {this.props.autoPlay && (
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
            <div className="col text-center" style={{maxHeight:'24px'}}>
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
              {!this.state.showHint &&
                this.props.freqFilter &&
                this.props.frequency.length > 0 && (
                  <FontAwesomeIcon className="clickable" icon={faDice} />
                )}
              {!this.state.showHint &&
                !this.props.freqFilter &&
                this.props.activeGroup.length > 0 && (
                  <FontAwesomeIcon className="clickable" icon={faDotCircle} />
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
            if (this.props.isOrdered) {
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
    freqFilter: state.settings.vocabulary.filter,
    frequency: state.settings.vocabulary.frequency,
    activeGroup: state.settings.vocabulary.activeGroup,
    autoPlay: state.settings.vocabulary.autoPlay,
    scrollingDone: !state.settings.global.scrolling,
    autoVerbView: state.settings.vocabulary.autoVerbView,
    reinforce: state.settings.vocabulary.reinforce,
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
  autoPlay: PropTypes.bool,
  scrollingDone: PropTypes.bool,
  scrollingState: PropTypes.func,
  autoVerbView: PropTypes.bool,
  toggleAutoVerbView: PropTypes.func,
  freqFilter: PropTypes.bool,
  toggleVocabularyFilter: PropTypes.func,
  reinforce: PropTypes.bool,
};

export default connect(mapStateToProps, {
  getVocabulary,
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
  toggleAutoVerbView,
  toggleVocabularyFilter,
})(Vocabulary);

export { VocabularyMeta };
