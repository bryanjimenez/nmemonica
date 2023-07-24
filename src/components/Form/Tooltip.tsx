import { arrow, offset, shift, useFloating } from "@floating-ui/react-dom";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { XIcon } from "@primer/octicons-react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { TouchSwipeIgnoreCss } from "../../helper/TouchSwipe";
import "../../css/Tooltip.css";
import { useWindowSize } from "../../hooks/useWindowSize";

interface TooltipProps {
  className?: string;
}

export function Tooltip(props: PropsWithChildren<TooltipProps>) {
  const { children } = props;
  const w = useWindowSize();

  const [showSlider, setShowSlider] = useState(false);
  const arrowRef = useRef(null);

  // https://floating-ui.com/docs/react
  const xOffset = 8; // horizontal alignment spacing
  const yOffset = 10; // vertical spacing between tooltip and element
  const arrowW = 8; // arrow width
  const { x, y, strategy, refs, middlewareData, update } = useFloating({
    placement: "top",
    middleware: [
      offset({ mainAxis: xOffset, crossAxis: yOffset }),
      shift(),
      arrow({ element: arrowRef }),
    ],
  });

  useEffect(() => {
    // force a recalculate on
    // window resize
    // term navigation (term properties change)
    update();
    setShowSlider(false);
  }, [update, w.height, w.width, children]);

  return (
    <>
      <div
        ref={refs.setReference}
        className={classNames({
          "sm-icon-grp clickable": true,
          ...(props.className ? { [props.className]: true } : {}),
        })}
        aria-label="Set difficulty"
        onClick={() => setShowSlider((s) => !s)}
      >
        <FontAwesomeIcon icon={faBullseye} />
      </div>
      <div
        id="tooltip"
        ref={refs.setFloating}
        style={{
          height: "200px",
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
          width: "max-content",
        }}
        className={classNames({
          invisible: !showSlider,
          "tooltip-fade": !showSlider,
          [TouchSwipeIgnoreCss]: true,
          "d-flex": true,
        })}
      >
        {props.children}
        <div className="x-button" onClick={() => setShowSlider(false)}>
          <XIcon className="clickable" size="small" aria-label="remove" />
        </div>

        <div
          ref={arrowRef}
          id="arrow"
          style={{
            position: strategy,
            height: arrowW,
            width: arrowW,
            bottom: -arrowW / 2,
            left: xOffset + (middlewareData.arrow?.x ?? 0),
          }}
        />
      </div>
    </>
  );
}

Tooltip.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  manualUpdate: PropTypes.string,
};
