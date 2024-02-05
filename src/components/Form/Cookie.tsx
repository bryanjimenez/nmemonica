import { arrow, offset, shift, useFloating } from "@floating-ui/react-dom";
import { Box, ClickAwayListener } from "@mui/material";
import { InfoIcon, XIcon } from "@primer/octicons-react";
import classNames from "classnames";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { TouchSwipeIgnoreCss } from "../../helper/TouchSwipe";
import { useWindowSize } from "../../hooks/useWindowSize";
import "../../css/Cookie.css";

interface CookieProps {
  disabled?: boolean;
  className?: string;
  notification?: string;
  /** Optional timeout to close tooltip after a value change */
  timeout?: number;
}

const READY = -1;

export function Cookie(props: PropsWithChildren<CookieProps>) {
  const { children, timeout } = props;
  const w = useWindowSize();

  const [showSlider, setShowSlider] = useState(false);
  const arrowRef = useRef(null);
  const hiding = useRef<NodeJS.Timeout | typeof READY | undefined>();
  const fadeTimeout = useRef(timeout);

  // https://floating-ui.com/docs/react
  const xOffset = 50; // horizontal alignment spacing
  const yOffset = 0; // vertical spacing between tooltip and element
  const arrowW = 8; // arrow width
  const { /*x,*/ y, strategy, refs /*, middlewareData*/, update } = useFloating(
    {
      placement: "bottom",
      middleware: [
        offset({ mainAxis: xOffset, crossAxis: yOffset }),
        shift(),
        arrow({ element: arrowRef }),
      ],
    }
  );

  useEffect(() => {
    // force a recalculate on
    // window resize
    update();

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
  }, [update, w.height, w.width, children]);

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
        })}
        aria-label="Cookie Policy Information"
      >
        <div
          className={classNames({
            "position-absolute pt-2 clickable": true,
            ...(props.className ? { [props.className]: true } : {}),
          })}
          onClick={props.disabled !== true ? onTooltipToggleCB : undefined}
        >
          <InfoIcon size="medium" />
        </div>
        {props.notification && (
          <span className="notification">{props.notification}</span>
        )}
      </div>
      <ClickAwayListener
        onClickAway={onCloseCB}
        mouseEvent={showSlider ? "onMouseUp" : false}
        touchEvent={showSlider ? "onTouchEnd" : false}
      >
        <Box
          id="cookie"
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: 0,
            width: "false",
          }}
          className={classNames({
            invisible: !showSlider,
            "cookie-fade": !showSlider,
            [TouchSwipeIgnoreCss]: true,
            "d-flex mx-2": true,
            ...(props.className ? { [props.className]: true } : {}),
          })}
          boxShadow={3}
        >
          <div
            ref={arrowRef}
            id="arrow"
            style={{
              position: strategy,
              height: arrowW,
              width: arrowW,
              top: -arrowW / 2,
              left: 20, //xOffset + (middlewareData.arrow?.x ?? 0),
            }}
          />
          <div className="d-flex flex-column">
            <div className="x-button align-self-end pe-2" onClick={onCloseCB}>
              <XIcon className="clickable" size="small" aria-label="close" />
            </div>
            <div>{props.children}</div>
          </div>
        </Box>
      </ClickAwayListener>
    </>
  );
}
