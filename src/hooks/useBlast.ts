import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";

import { useWindowSize } from "./useWindowSize";

interface BlastDefaults {
  top?: number;
}
/**
 * Display a fading text on the center of the screen
 */
export function useBlast({ top }: BlastDefaults = {}) {
  const [text, setText] = useState("");
  const floating = useRef<HTMLDivElement>(null);

  const wSize = useWindowSize();
  const [{ xOffset, yOffset }, setScreenOffset] = useState({
    xOffset: 0,
    yOffset: top ?? 0,
  });

  useEffect(() => {
    // force a recalculate on
    // window resize
    if (wSize.width !== undefined && wSize.height !== undefined) {
      const yOffset = top ?? wSize.height / 2; //   horizontal alignment spacing
      const xOffset = wSize.width / 2; //   vertical spacing

      setScreenOffset({ xOffset, yOffset });
    }
  }, [wSize.height, wSize.width, top]);

  const style = useMemo(() => {
    return {
      position: "absolute",
      top: `${yOffset}px`,
      left: `${xOffset}px`,
      transform:
        top !== undefined ? "translate(-50%,0)" : "translate(-50%,-50%)",
    };
  }, [xOffset, yOffset, top]);

  if (floating.current !== null) {
    const inlineClasses = floating.current.className
      .split(" ")
      .reduce((acc, c) => {
        return { ...acc, [c]: true };
      }, {});
    floating.current.className = classNames({
      ...inlineClasses,
      "dark-mode-color": true,
      "notification-fade": text.length > 0,
      "text-center": true,
    });

    Object.keys(style).forEach((k) => {
      const key = k as keyof typeof style;
      const propStyle = style[key];
      if (floating.current !== null && propStyle !== undefined) {
        floating.current.style[key] = propStyle;
      }
    });
  }

  return {
    blastElRef: floating,
    text,
    setText,
  };
}
