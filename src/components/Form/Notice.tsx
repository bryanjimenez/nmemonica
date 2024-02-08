import { arrow, offset, shift, useFloating } from "@floating-ui/react-dom";
import { Box, ClickAwayListener } from "@mui/material";
import { XIcon } from "@primer/octicons-react";
import classNames from "classnames";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { TouchSwipeIgnoreCss } from "../../helper/TouchSwipe";
import { useWindowSize } from "../../hooks/useWindowSize";
import "../../css/Notice.css";

interface NoticeProps {
  disabled?: boolean;
  className?: string;
  label?: string;
  icon?: React.JSX.Element;
  notification?: string;
  /** Timeout to close tooltip after a value change */
  timeout?: number;
  /** Initially render visible */
  initShown?: boolean;
}

const READY = -1;

export function Notice(props: PropsWithChildren<NoticeProps>) {
  const { children, timeout, initShown } = props;
  const w = useWindowSize();

  const [showNotice, setShowNotice] = useState(() => props.initShown === true);
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
          setShowNotice(false);
          hiding.current = undefined;
        }, fadeTimeout.current);
      } else if (hiding.current !== undefined) {
        clearTimeout(hiding.current);
        hiding.current = setTimeout(() => {
          setShowNotice(false);
          hiding.current = undefined;
        }, fadeTimeout.current);
      } else if (
        hiding.current === undefined &&
        initShown === false &&
        showNotice
      ) {
        // initially displayed then rerendered
        hiding.current = setTimeout(() => {
          setShowNotice(false);
          hiding.current = undefined;
        }, fadeTimeout.current);
      }
    }
  }, [update, w.height, w.width, children, initShown, showNotice]);

  const onCloseCB = useCallback(() => {
    setShowNotice(false);
    if (hiding.current !== undefined) {
      clearTimeout(hiding.current);
      hiding.current = undefined;
    }
  }, []);

  const onNoticeToggleCB = useCallback(() => {
    setShowNotice((s) => !s);
    hiding.current = READY;
  }, []);

  return (
    <>
      <div
        ref={refs.setReference}
        className={classNames({
          "sm-icon-grp": true,
        })}
        aria-label={props.label}
      >
        <div
          className={classNames({
            "position-absolute pt-2 clickable": true,
            ...(props.className ? { [props.className]: true } : {}),
          })}
          onClick={props.disabled !== true ? onNoticeToggleCB : undefined}
        >
          {props.icon}
        </div>
        {props.notification && (
          <span className="notification">{props.notification}</span>
        )}
      </div>
      <ClickAwayListener
        onClickAway={onCloseCB}
        mouseEvent={showNotice ? "onMouseUp" : false}
        touchEvent={showNotice ? "onTouchEnd" : false}
      >
        <Box
          id="notice"
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: 0,
            width: "false",
          }}
          className={classNames({
            invisible: !showNotice,
            "notice-fade": !showNotice,
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
