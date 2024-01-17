import { offset, shift, useFloating } from "@floating-ui/react-dom";
import { useEffect, useState } from "react";
import { useWindowSize } from "./helperHK";
import classNames from "classnames";

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

  const blastEl = (
    <div
      ref={refs.setFloating}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
        width: "max-content",

        fontWeight: "bold",
        fontSize: "xxx-large",
      }}
      className={classNames({
        "dark-mode-color": true,
        "notification-fade": text.length > 0,
      })}
    >
      {text}
    </div>
  );

  return { blastEl, anchorElRef: refs.setReference, text, setText };
}
