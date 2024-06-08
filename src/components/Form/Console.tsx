import classNames from "classnames";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import type { RootState } from "../../slices";
import { DebugLevel } from "../../slices/settingHelper";

const MAX_CONSOLE_MESSAGES = 6;
const COLLAPSE_T = 3000;
const SCROLL_COLLAPSE_T = 10000;

export interface ConsoleMessage {
  msg: string;
  lvl: number;
  css?: string;
  /** Used to distinguish between UI and SW msg */
  type?: string;
  time?: number;
}

interface ConsoleProps {
  connected?: boolean;
  messages?: ConsoleMessage[];
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

  const messages = useSelector<RootState, ConsoleMessage[]>(
    ({ global }: RootState) => {
      if (!isConnected && props.messages) {
        return props.messages;
      } else {
        return global.console;
      }
    }
    // shallowEqual
  );

  const [window, setWindow] = useState(MAX_CONSOLE_MESSAGES); // Max number of messages to display
  const [scroll, setScroll] = useState(0); // Number of lines to scroll up
  const collapse = useRef<number | undefined>();

  useEffect(() => {
    if (debug === DebugLevel.OFF) {
      setScroll(0);
    } else {
      setScroll(0);
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
  }, [isConnected, debug, messages]);

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
        "mw-75": props.connected === true,
        "text-break": true,
      })}
    >
      {m.map((e) => {
        const key = `${e.time}+${e.msg}+${e.lvl}`;
        const mClass = classNames({
          "app-sm-fs-xx-small": true,
          ...(e.css ? { [e.css]: true } : {}),
          "correct-color": e.lvl === DebugLevel.DEBUG,
          "question-color": e.lvl === DebugLevel.WARN,
          "incorrect-color": e.lvl === DebugLevel.ERROR,
        });

        return (
          <div key={key} className={mClass} onClick={scrollUp}>
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
