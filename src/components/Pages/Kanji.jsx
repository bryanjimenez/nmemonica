import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";

import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import {
  swipeEnd,
  swipeMove,
  swipeStart,
} from "react-slick/lib/utils/innerSliderUtils";
import { getKanji } from "../../actions/kanjiAct";
import {
  getTerm,
  getTermUID,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { logger } from "../../actions/consoleAct";
import { FILTER_GRP } from "../../reducers/settingsRed";
import { getVocabulary } from "../../actions/vocabularyAct";
import { JapaneseText } from "../../helper/JapaneseText";
import classNames from "classnames";

import "./Kanji.css";

const KanjiMeta = {
  location: "/kanji/",
  label: "Kanji",
};

class Kanji extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      filteredVocab: [],
      frequency: [], // subset of frequency words within current active group
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
    };

    if (this.props.kanji.length === 0) {
      this.props.getKanji();
    }

    if (this.props.vocabulary.length === 0) {
      this.props.getVocabulary();
    }

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoNextSlide = this.gotoNextSlide.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.startMove = this.startMove.bind(this);
    this.inMove = this.inMove.bind(this);
    this.endMove = this.endMove.bind(this);
    this.swipeActionHandler = this.swipeActionHandler.bind(this);
  }

  componentDidMount() {
    if (this.props.kanji && this.props.kanji.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setOrder();
    }
  }

  componentDidUpdate(prevProps /*, prevState*/) {
    if (this.props.kanji.length !== prevProps.kanji.length) {
      // console.log("got game data");
      this.setOrder();
    }
  }

  setOrder() {
    const filteredVocab = termFilterByType(
      FILTER_GRP,
      this.props.kanji,
      null,
      this.props.activeGroup,
      null
    );

    const order = randomOrder(filteredVocab);

    this.setState({
      filteredVocab,
      order,
    });
  }

  gotoNext() {
    const l = this.state.filteredVocab.length;
    const newSel = (this.state.selectedIndex + 1) % l;

    this.setState({
      selectedIndex: newSel,
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
    });
  }

  gotoNextSlide() {
    this.gotoNext();
  }

  gotoPrev() {
    const l = this.state.filteredVocab.length;
    const i = this.state.selectedIndex - 1;

    let newSel = i < 0 ? (l + i) % l : i % l;

    this.setState({
      selectedIndex: newSel,
      showOn: false,
      showKun: false,
      showEx: false,
      showMeaning: false,
    });
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
      if (direction === "up") {
        // up
        // kun
      } else if (direction === "down") {
        // down
        // on
      }
    }
  }

  render() {
    if (this.state.filteredVocab.length < 1)
      return <NotReady addlStyle="main-panel" />;

    const uid = getTermUID(
      this.state.selectedIndex,
      this.state.order,
      this.state.filteredVocab
    );

    const term = getTerm(uid, this.props.kanji);

    const found = this.props.vocabulary.filter((v) =>
      JapaneseText.parse(v).getSpelling().includes(term.kanji)
    );

    const maxShowEx = 3;
    const examples = found.slice(0, maxShowEx).map((el, k, arr) => (
      <React.Fragment key={k}>
        {el.english + " "}
        {JapaneseText.parse(el).toHTML()}
        {k < arr.length - 1 ? "; " : ""}
        <wbr />
      </React.Fragment>
    ));

    let page = [
      <div key={0} className="kanji main-panel h-100">
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

          <div className="grp-info">
            <div>
              <div>{term.grp}</div>
              <div>{term.subGrp.replace("_", " ")}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="">
              <h1 className="pt-0">
                <span>{term.kanji}</span>
              </h1>
              {/* temp spacer */}
              {!term.on && !term.kun && (
                <div>
                  <h3 className="pt-0">.</h3>
                  <h3 className="pt-2">.</h3>
                </div>
              )}

              {term.on && (
                <h3
                  className="pt-0"
                  onClick={() => {
                    this.setState((state) => ({
                      showOn: !state.showOn,
                    }));
                  }}
                >
                  <span>{this.state.showOn ? term.on : "[On]"}</span>
                </h3>
              )}
              {term.kun && (
                <h3
                  className="pt-2"
                  onClick={() => {
                    this.setState((state) => ({
                      showKun: !state.showKun,
                    }));
                  }}
                >
                  <span>{this.state.showKun ? term.kun : "[Kun]"}</span>
                </h3>
              )}
              {[examples].length > 0 && (
                <div
                  className={classNames({
                    "example-blk a h6 pt-2": true,
                    "disabled-color": examples.length === 0,
                  })}
                  onClick={() => {
                    this.setState((state) => ({
                      showEx: !state.showEx,
                    }));
                  }}
                >
                  <span className="text-nowrap">
                    {this.state.showEx && examples.length > 0
                      ? examples
                      : "[Examples]"}
                  </span>
                </div>
              )}
              <h3
                className="pt-2"
                onClick={() => {
                  this.setState((state) => ({
                    showMeaning: !state.showMeaning,
                  }));
                }}
              >
                <span>{this.state.showMeaning ? term.eng : "[Meaning]"}</span>
              </h3>
            </div>
          </div>
          <div className="right-info"></div>

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

    return page;
  }
}

const mapStateToProps = (state) => {
  return {
    kanji: state.kanji.value,
    vocabulary: state.vocabulary.value,

    activeGroup: state.settings.kanji.activeGroup,
    touchSwipe: state.settings.global.touchSwipe,
  };
};

Kanji.propTypes = {
  kanji: PropTypes.array,
  vocabulary: PropTypes.array,
  activeGroup: PropTypes.array,
  touchSwipe: PropTypes.bool,
  getKanji: PropTypes.func,
  getVocabulary: PropTypes.func,
  logger: PropTypes.func,
};

export default connect(mapStateToProps, {
  getKanji,
  getVocabulary,
  logger,
})(Kanji);

export { KanjiMeta };
