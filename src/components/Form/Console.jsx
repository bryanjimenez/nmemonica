import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import classNames from "classnames";
import {
  DEBUG_ERROR,
  DEBUG_OFF,
  DEBUG_ON,
  DEBUG_WARN,
} from "../../actions/settingsAct";

/**
 * @typedef {{msg:string, lvl:number}} ConsoleMessage
 */

/**
 * @typedef {{
 * window: number,
 * scroll: number,
 * messages: ConsoleMessage[]}} ConsoleState
 */

/**
 * @typedef {{
 * debug: number,
 * messages: ConsoleMessage[]}} ConsoleProps
 */

class Console extends Component {
  constructor(props) {
    super(props);

    /** @type {ConsoleState} */
    this.state = {
      window: 6,
      scroll: 0,
      messages: this.squashSeqMsgs(this.props.messages),
    };
    this.scrollUp = this.scrollUp.bind(this);
  }

  /** @param {ConsoleProps} prevProps */
  componentDidUpdate(prevProps) {
    if (
      this.props.debug === DEBUG_OFF &&
      this.props.debug !== prevProps.debug
    ) {
      this.setState({ scroll: 0, messages: [] });
    }

    if (this.props.messages.length !== prevProps.messages.length) {
      const messages = this.squashSeqMsgs(this.props.messages);
      this.setState({ scroll: 0, messages });
    }
  }

  scrollUp() {
    const messages = this.state.messages;
    const window = this.state.window;
    const max = messages.length - window > -1 ? messages.length - window : 0;

    if (this.state.scroll < max) {
      this.setState((/** @type {ConsoleState} */ state) => ({
        scroll: state.scroll + 1,
      }));
    }
  }

  /**
   * squashes sequential messages that are the same
   * incrementing a counter on the final message
   * @param {ConsoleMessage[]} messages
   */
  squashSeqMsgs(messages) {
    /** @type {ConsoleMessage[]} */
    let squashed = [];
    let count = 0;

    messages.forEach((element, i) => {
      if (i > 0 && element.msg === messages[i - 1].msg) {
        count++;
      } else {
        if (count > 0) {
          const front = squashed.slice(0, -1);
          const last = squashed.slice(-1)[0];

          squashed = [
            ...front,
            { ...last, msg: last.msg + " " + (count + 1) + "+" },
            element,
          ];
          count = 0;
        } else {
          squashed = [...squashed, element];
        }
      }
    });

    // update last line's count
    // if(count>0 && squashed.length>0){
    //   const front = squashed.slice(0,-1);
    //   const last = squashed.slice(-1)[0];
    //   squashed = [...front,{...last, msg:last.msg+" "+(count+1)+"+"}]
    // }

    return squashed;
  }

  render() {
    const window = this.state.window;
    const start = -window - this.state.scroll;
    const end = this.state.scroll > 0 ? -1 * this.state.scroll : undefined;
    const messages = this.state.messages.slice(start, end);

    // const tester = [{msg:'a'},{msg:'a'},{msg:'a'},{msg:'c'},{msg:'d'},{msg:'d'},{msg:'a'},{msg:'a'}]
    // const ar = this.squashSeqMsgs(tester);
    // console.log(ar)

    return (
      <div className="console position-absolute p-1">
        {messages.map((e, i) => {
          const mClass = classNames({
            "app-sm-fs-xx-small": true,
            "correct-color": e.lvl === DEBUG_ON,
            "question-color": e.lvl === DEBUG_WARN,
            "incorrect-color": e.lvl === DEBUG_ERROR,
          });

          return (
            <div key={i} className={mClass} onClick={this.scrollUp}>
              {e.msg}
            </div>
          );
        })}
      </div>
    );
  }
}

Console.propTypes = {
  messages: PropTypes.array,
  debug: PropTypes.number,
};

const mapStateToProps = (state) => {
  return {
    messages: state.settings.global.console,
    debug: state.settings.global.debug,
  };
};

export default connect(mapStateToProps, {})(Console);
