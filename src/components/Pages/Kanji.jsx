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
import { getTerm, getTermUID, randomOrder } from "../../helper/gameHelper";
import { logger } from "../../actions/consoleAct";

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
      showEng: false,
    };

    if (this.props.kanji.length === 0) {
      this.props.getKanji();
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

  componentDidUpdate(prevProps, prevState) {
    if (this.props.kanji.length !== prevProps.kanji.length) {
      // console.log("got game data");
      this.setOrder();
    }
  }

  setOrder() {
    const filteredVocab = this.props.kanji;

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
      showEng: false,
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
      showEng: false,
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

          <div className="text-center">
            <div className="">
              <h1 className="pt-3">
                <span>{term.kanji}</span>
              </h1>
              <h3
                className="pt-3"
                onClick={() => {
                  this.setState((state) => ({
                    showOn: !state.showOn,
                  }));
                }}
              >
                <span>{this.state.showOn ? term.on : "[On]"}</span>
              </h3>
              <h3
                className="pt-3"
                onClick={() => {
                  this.setState((state) => ({
                    showKun: !state.showKun,
                  }));
                }}
              >
                <span>{this.state.showKun ? term.kun : "[Kun]"}</span>
              </h3>
              <h3
                className="pt-3"
                onClick={() => {
                  this.setState((state) => ({
                    showEng: !state.showEng,
                  }));
                }}
              >
                <span>{this.state.showEng ? term.eng : "[Meaning]"}</span>
              </h3>

              {/* debug
              <br />
              {JSON.stringify(kanji)} */}
            </div>
          </div>

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
    touchSwipe: state.settings.global.touchSwipe,
  };
};

Kanji.propTypes = {
  kanji: PropTypes.array,
  touchSwipe: PropTypes.bool,
  getKanji: PropTypes.func,
  logger: PropTypes.func,
};

export default connect(mapStateToProps, {
  getKanji,
  logger,
})(Kanji);

export { KanjiMeta };
