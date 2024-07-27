import { arrow, offset, shift, useFloating } from "@floating-ui/react-dom";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, ClickAwayListener } from "@mui/material";
import classNames from "classnames";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { TouchSwipeIgnoreCss } from "../../helper/TouchSwipe";
import "../../css/Tooltip.css";
import { useWindowSize } from "../../hooks/useWindowSize";

interface TooltipProps {
  disabled?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  idKey: string;
  className?: string;
  notification?: string;
  /** Optional timeout to close tooltip after a value change */
  timeout?: number;
}

const READY = -1;

export function Tooltip(props: PropsWithChildren<TooltipProps>) {
  const { children, idKey, timeout, reviewed } = props;
  const w = useWindowSize();

  const [showSlider, setShowSlider] = useState(false);
  const arrowRef = useRef(null);
  const oldKey = useRef(idKey);
  const hiding = useRef<NodeJS.Timeout | typeof READY | undefined>();
  const fadeTimeout = useRef(timeout);

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
    if (idKey !== oldKey.current) {
      oldKey.current = idKey;
      setShowSlider(false);
      if (fadeTimeout.current !== undefined) {
        clearTimeout(hiding.current);
        hiding.current = undefined;
      }
    } else {
      if (fadeTimeout.current !== undefined) {
        if (hiding.current === READY) {
          hiding.current = setTimeout(() => {
            setShowSlider(false);
            hiding.current = undefined;
          }, fadeTimeout.current);
        } else if (hiding.current !== undefined) {
          clearTimeout(hiding.current);
          hiding.current = setTimeout(() => {
            setShowSlider(false);
            hiding.current = undefined;
          }, fadeTimeout.current);
        }
      }
    }
  }, [update, w.height, w.width, children, idKey]);

  const onCloseCB = useCallback(() => {
    setShowSlider(false);
    if (hiding.current !== undefined) {
      clearTimeout(hiding.current);
      hiding.current = undefined;
    }
  }, []);

  const onTooltipToggleCB = useCallback(() => {
    setShowSlider((s) => !s);
    hiding.current = READY;
  }, []);

  return (
    <>
      <div
        ref={refs.setReference}
        className={classNames({
          "sm-icon-grp": true,
          "disabled-color": reviewed === true,
        })}
        aria-label="Set difficulty"
      >
        <div
          className={classNames({
            "d-inline": true,
            "opacity-50": reviewed !== true,
            clickable: true,
            ...(props.className !== undefined
              ? { [props.className]: true }
              : {}),
          })}
          onClick={props.disabled !== true ? onTooltipToggleCB : undefined}
        >
          <FontAwesomeIcon icon={faBullseye} />
        </div>
        {props.notification !== undefined && (
          <span className="notification">{props.notification}</span>
        )}
      </div>
      <ClickAwayListener
        onClickAway={onCloseCB}
        mouseEvent={showSlider ? "onMouseUp" : false}
        touchEvent={showSlider ? "onTouchEnd" : false}
      >
        {/* <Box component={Grid} boxShadow={3}> */}
        <Box
          // component={Grid}
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
          boxShadow={3}
        >
          {props.children}
          {/* <div className="x-button" onClick={onCloseCB}>
          <XIcon className="clickable" size="small" aria-label="close" />
        </div> */}
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
        </Box>
      </ClickAwayListener>
    </>
  );
}
