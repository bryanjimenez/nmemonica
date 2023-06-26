import classNames from "classnames";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { shallowEqual, useSelector } from "react-redux";

import type { RootState } from "../../slices";
import { DebugLevel } from "../../slices/settingHelper";

const MAX_CONSOLE_MESSAGES = 6;
const COLLAPSE_T = 3000;
const SCROLL_COLLAPSE_T = 10000;

export interface ConsoleMessage {
  msg: string;
  lvl: number;
  css?: string;
  type?: string;
}

interface ConsoleProps {
  connected?: boolean;
  messages?: ConsoleMessage[];
}

/**
 * squashes sequential messages that are the same
 * incrementing a counter on the final message
 * @param {ConsoleMessage[]} messages
 */
function squashSeqMsgs(messages: ConsoleMessage[]) {
  let squashed: ConsoleMessage[] = [];
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
          { ...last, msg: `${last.msg} ${count + 1} +` },
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

export default function Console(props: ConsoleProps) {
  const isConnected = props.connected === true;

  const debug = useSelector(({ global }: RootState) => {
    if (!isConnected && props.messages) {
      return DebugLevel.DEBUG;
    } else {
      return global.debug;
    }
  });

  const pMessages = useSelector<RootState, ConsoleMessage[]>(
    ({ global }: RootState) => {
      if (!isConnected && props.messages) {
        return props.messages;
      } else {
        return global.console;
      }
    },
    shallowEqual
  );

  const [window, setWindow] = useState(MAX_CONSOLE_MESSAGES); // Max number of messages to display
  const [scroll, setScroll] = useState(0); // Number of lines to scroll up
  const [messages, setMessages] = useState(squashSeqMsgs(pMessages));
  const collapse = useRef<number | undefined>();

  useEffect(() => {
    if (debug === DebugLevel.OFF) {
      setScroll(0);
      setMessages([]);
    } else {
      const squashed = squashSeqMsgs(pMessages);
      setScroll(0);
      setMessages(squashed);
      setWindow(MAX_CONSOLE_MESSAGES);

      if (collapse.current !== undefined) {
        clearTimeout(collapse.current);
      }

      if (isConnected) {
        const t = setTimeout(() => {
          setWindow(3);
          collapse.current = undefined;
        }, COLLAPSE_T);

        collapse.current = Number(t);
      }
    }
  }, [isConnected, debug, pMessages]);

  const start = -window - scroll;
  const end = scroll > 0 ? -1 * scroll : undefined;
  const m = messages.slice(start, end);

  const scrollUp = useCallback(() => {
    const max = messages.length - window > -1 ? messages.length - window : 0;

    if (scroll < max) {
      setWindow(MAX_CONSOLE_MESSAGES);
      setScroll((s) => s + 1);

      if (collapse.current !== undefined) {
        clearTimeout(collapse.current);
      }

      const t = setTimeout(() => {
        setWindow(3);
        setScroll(0);
        collapse.current = undefined;
      }, SCROLL_COLLAPSE_T);

      collapse.current = Number(t);
    }
  }, [window, scroll, messages]);

  return (
    <div
      className={classNames({
        "console p-1": true,
        "position-absolute": props.connected === true,
        "mw-50": props.connected === true,
      })}
    >
      {m.map((e) => {
        const mClass = classNames({
          "app-sm-fs-xx-small": true,
          ...(e.css ? { [e.css]: true } : {}),
          "correct-color": e.lvl === DebugLevel.DEBUG,
          "question-color": e.lvl === DebugLevel.WARN,
          "incorrect-color": e.lvl === DebugLevel.ERROR,
        });

        return (
          <div key={`${e.msg} ${e.lvl}`} className={mClass} onClick={scrollUp}>
            {e.msg}
          </div>
        );
      })}
    </div>
  );
}

Console.propTypes = {
  connected: PropTypes.bool,
  messages: PropTypes.array,
};
