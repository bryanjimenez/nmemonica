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
  faGlasses,
  faHeadphones,
  faPencilAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
} from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { htmlElementHint, JapaneseText } from "../../helper/JapaneseText";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { Avatar, Grow, LinearProgress } from "@material-ui/core";
import AudioItem from "../Form/AudioItem";
import { isHiragana } from "../../helper/hiraganaHelper";
import { orderBy } from "lodash/collection";
import StackOrderSlider from "../Form/StackOrderSlider";
import { deepOrange } from "@material-ui/core/colors";

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
      frequency: [],
    };

    if (this.props.vocab.length === 0) {
      this.props.getVocabulary();
    }

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.play = this.play.bind(this);
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
      const filteredKeys = this.state.filteredVocab.map((f) => f.uid);
      const frequency = this.props.frequency.filter((f) =>
        filteredKeys.includes(f)
      );
      // console.log('frequency word changed');
      this.setState({ frequency });
    }
  }

  setOrder() {
    let filteredVocab = this.props.vocab;
    if (this.props.activeGroup.length > 0) {
      filteredVocab = this.props.vocab.filter(
        (w) =>
          this.props.activeGroup.includes(w.grp) ||
          this.props.activeGroup.includes(w.grp + "." + w.subGrp)
      );
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

  play() {
    // some games will come from the reinforced list
    const reinforced = [false, false, true][Math.floor(Math.random() * 3)];
    if (reinforced && this.state.frequency.length > 0) {
      const min = 0;
      const max = Math.floor(this.state.frequency.length);
      const idx = Math.floor(Math.random() * (max - min) + min);
      const vocabulary = this.state.filteredVocab.filter(
        (v) => this.state.frequency[idx] === v.uid
      )[0];

      if (vocabulary) {
        if (this.state.reinforcedUID !== vocabulary.uid) {
          this.setState({
            reinforcedUID: vocabulary.uid,
            showMeaning: false,
            showRomaji: false,
            showHint: false,
          });
        } else {
          // avoid repeating the same reinforced word
          this.gotoNext();
        }
      } else {
        console.warn("uid no longer exists");
        this.props.removeFrequencyWord(this.state.frequency[idx]);
        this.gotoNext();
      }
    } else {
      this.gotoNext();
    }
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
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      reinforcedUID: undefined,
      selectedIndex: newSel,
      showEng: false,
      showMeaning: false,
      showRomaji: false,
      showHint: false,
    });
  }

  getVocabularyWord(selectedIndex, randomOrder, filteredVocab, reinforcedUID) {
    let vocabulary;
    if (this.state.reinforcedUID) {
      vocabulary = filteredVocab.filter((v) => reinforcedUID === v.uid)[0];
    } else {
      if (randomOrder) {
        const index = randomOrder[selectedIndex];
        vocabulary = filteredVocab[index];
      } else {
        vocabulary = filteredVocab[selectedIndex];
      }
    }

    vocabulary.reinforce = this.state.frequency.includes(vocabulary.uid);
    return vocabulary;
  }

  pronunciation(vocabulary) {
    let q;
    if (vocabulary.pronounce) {
      const isHiraganaWord = !vocabulary.pronounce
        .split("")
        .some((c) => !isHiragana(c));
      if (isHiraganaWord) {
        q = vocabulary.pronounce;
      } else {
        console.warn("pronunciation is not hiragana");
      }
    } else {
      const w = JapaneseText.parse(vocabulary.japanese);
      q = w.getSpelling();
    }
    return q;
  }

  render() {
    if (this.state.filteredVocab.length < 1)
      return <NotReady addlStyle="main-panel" />;

    const vocabulary = this.getVocabularyWord(
      this.state.selectedIndex,
      this.state.order,
      this.state.filteredVocab,
      this.state.reinforcedUID
    );

    let inJapanese = JapaneseText.parse(vocabulary.japanese).toHTML();
    let inEnglish = vocabulary.english;
    let romaji = vocabulary.romaji;

    let shownSide, hiddenSide, shownCaption, hiddenCaption, hintActive, hint;
    if (this.props.practiceSide) {
      shownSide = inEnglish;
      hiddenSide = inJapanese;
      shownCaption = "[English]";
      hiddenCaption = "[Japanese]";

      hint = htmlElementHint(vocabulary.japanese);
      hintActive = hint && this.props.hintActive;
    } else {
      shownSide = inJapanese;
      hiddenSide = inEnglish;
      shownCaption = "[Japanese]";
      hiddenCaption = "[English]";
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
          <div className="pt-3 d-flex flex-column justify-content-around text-center">
            {this.props.autoPlay && this.props.practiceSide ? (
              <h1
                onClick={() => {
                  this.setState((state) => ({ showEng: !state.showEng }));
                }}
              >
                {this.state.showEng ? shownSide : shownCaption}
              </h1>
            ) : (
              <h1>{shownSide}</h1>
            )}
            {this.props.romajiActive && (
              <h5
                onClick={() => {
                  this.setState((state) => ({ showRomaji: !state.showRomaji }));
                }}
                className="clickable"
              >
                {this.state.showRomaji ? romaji : "[Romaji]"}
              </h5>
            )}
            <h2
              onClick={() => {
                this.setState((state) => ({ showMeaning: !state.showMeaning }));
              }}
              className="clickable"
            >
              {this.state.showMeaning ? hiddenSide : hiddenCaption}
            </h2>

            <AudioItem
              word={this.pronunciation(vocabulary)}
              autoPlay={this.props.scrollingDone && this.props.autoPlay}
            />
          </div>

          <StackNavButton
            color={"--yellow"}
            ariaLabel="Next"
            action={this.play}
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
              </div>
            </div>
            <div className="col text-center">
              {hintActive && (
                <h5
                  onClick={() => {
                    this.setState((state) => ({ showHint: !state.showHint }));
                  }}
                  className="clickable"
                >
                  {this.state.showHint ? hint : ""}
                </h5>
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
          <LinearProgress variant="determinate" value={progress} />
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
              left: "75vw",
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
    frequency: state.settings.vocabulary.frequency,
    activeGroup: state.settings.vocabulary.activeGroup,
    autoPlay: state.settings.vocabulary.autoPlay,
    scrollingDone: !state.settings.global.scrolling,
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
};

export default connect(mapStateToProps, {
  getVocabulary,
  flipVocabularyPracticeSide,
  addFrequencyWord,
  removeFrequencyWord,
  scrollingState,
})(Vocabulary);

export { VocabularyMeta };
