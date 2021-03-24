import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { getVocabulary } from "../../actions/vocabularyAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { NotReady } from "../Form/NotReady";
import StackNavButton from "../Form/StackNavButton";
import { LinearProgress } from "@material-ui/core";
import VerbMain from "./VerbMain";

const VerbsMeta = {
  location: "/verbs/",
  label: "Verbs",
};

class Verbs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0,
      showMeaning: false,
      showRomaji: false,
    };

    if (this.props.verbs.length === 0) {
      // verbs are filtered from vocabulary
      this.props.getVocabulary();
    }

    this.gotoNext = this.gotoNext.bind(this);
    this.gotoPrev = this.gotoPrev.bind(this);
    this.setVerbsOrder = this.setVerbsOrder.bind(this);
  }

  componentDidMount() {
    if (this.props.verbs && this.props.verbs.length > 0) {
      // page navigation after initial mount
      // data retrival done, set up game
      this.setVerbsOrder();
    }
  }

  componentDidUpdate(prevProps /*, prevState*/) {
    if (
      this.props.verbs.length != prevProps.verbs.length ||
      this.props.isOrdered != prevProps.isOrdered
    ) {
      // console.log("got game data");
      this.setVerbsOrder();
    }
  }

  setVerbsOrder() {
    let newOrder = [];
    this.props.verbs.forEach((v, i) => newOrder.push(i));
    if (!this.props.isOrdered) {
      shuffleArray(newOrder);
    }

    this.setState({
      order: newOrder,
    });
  }

  gotoNext() {
    const l = this.props.verbs.length;
    const newSel = (this.state.selectedIndex + 1) % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  gotoPrev() {
    const l = this.props.verbs.length;
    const i = this.state.selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    this.setState({
      selectedIndex: newSel,
      showMeaning: false,
      showRomaji: false,
    });
  }

  render() {
    if (this.props.verbs.length < 1) return <NotReady addlStyle="main-panel" />;

    let v;
    if (this.state.order) {
      const index = this.state.order[this.state.selectedIndex];
      v = this.props.verbs[index];
    } else {
      v = this.props.verbs[this.state.selectedIndex];
    }

    const progress =
      ((this.state.selectedIndex + 1) / this.props.verbs.length) * 100;

    return [
      <div key={0} className="verbs main-panel h-100">
        <div className="d-flex justify-content-between h-100">
          <StackNavButton
            ariaLabel="Previous"
            color={"--red"}
            action={this.gotoPrev}
          >
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          <VerbMain verb={v} verbForm={this.props.masu} />

          <StackNavButton
            color={"--red"}
            ariaLabel="Next"
            action={this.gotoNext}
          >
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>,
      <div key={1} className="progress-bar flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>,
    ];
  }
}

const mapStateToProps = (state) => {
  return {
    verbs: state.verbs.value,
    isOrdered: state.settings.verbs.ordered,
    masu: state.settings.verbs.masu,
  };
};

Verbs.propTypes = {
  getVocabulary: PropTypes.func.isRequired,
  verbs: PropTypes.array.isRequired,
  isOrdered: PropTypes.bool,
  masu: PropTypes.bool,
};

export default connect(mapStateToProps, { getVocabulary })(Verbs);

export { VerbsMeta };
