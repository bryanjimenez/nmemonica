import { offset, shift, useFloating } from "@floating-ui/react-dom";
import classNames from "classnames";
import { useEffect, useState } from "react";

import { useWindowSize } from "./useWindowSize";

/**
 * Display a fading text on the center of the screen
 */
export function useBlast() {
  const [text, setText] = useState("");

  const [floatDim, setOffset] = useState({ w: 0, h: 0 });
  const w = useWindowSize();
  const { x, y, strategy, refs, update } = useFloating({
    placement: "bottom",
    middleware: [
      offset({
        mainAxis: w.height === undefined ? 0 : w.height / 2 - floatDim.h,
        crossAxis: 0,
      }),
      shift(),
    ],
  });

  // get wrong answer float dimensions
  useEffect(() => {
    const floatW = refs.floating.current?.clientWidth;
    const floatH = refs.floating.current?.clientHeight;

    if (text.length > 0 && floatW && floatW > 0 && floatH && floatH > 0) {
      setOffset({
        w: floatW,
        h: floatH,
      });
      update();
    }
  }, [text, setOffset, refs.floating, update]);

  if (refs.floating.current !== null) {
    refs.floating.current.style.top = "";
    const style = {
      position: strategy,
      top: `${y ?? 0}px`,
      left: `${x ?? 0}px`,
      width: "max-content",

      fontWeight: "bold",
      fontSize: "xxx-large",
    };

    refs.floating.current.className = classNames({
      "dark-mode-color": true,
      "notification-fade": text.length > 0,
    });

    Object.keys(style).forEach((k) => {
      if (refs.floating.current !== null) {
        const key = k as keyof typeof style;
        refs.floating.current.style[key] = style[key];
      }
    });
  }

  // const blastEl = (
  //   <div
  //     ref={refs.setFloating}
  //     style={{
  //       position: strategy,
  //       top: y ?? 0,
  //       left: x ?? 0,
  //       width: "max-content",

  //       fontWeight: "bold",
  //       fontSize: "xxx-large",
  //     }}
  //     className={classNames({
  //       "dark-mode-color": true,
  //       "notification-fade": text.length > 0,
  //     })}
  //   >
  //     {text}
  //   </div>
  // );

  return {
    /*blastEl,*/
    blastElRef: refs.setFloating,
    anchorElRef: refs.setReference,
    text,
    setText,
  };
}
