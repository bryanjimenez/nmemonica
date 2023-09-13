import { arrow, offset, shift, useFloating } from "@floating-ui/react-dom";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { XIcon } from "@primer/octicons-react";
import classNames from "classnames";
import PropTypes from "prop-types";
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
  idKey: string;
  className?: string;
  notification?: string;
}

const READY = -1;

export function Tooltip(props: PropsWithChildren<TooltipProps>) {
  const { children, idKey } = props;
  const w = useWindowSize();

  const [showSlider, setShowSlider] = useState(false);
  const arrowRef = useRef(null);
  const oldKey = useRef(idKey);
  const hiding = useRef<NodeJS.Timeout | typeof READY | undefined>();

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
      clearTimeout(hiding.current);
      hiding.current = undefined;
    } else {
      if (hiding.current === READY) {
        hiding.current = setTimeout(() => {
          setShowSlider(false);
          hiding.current = undefined;
        }, 2000);
      } else if (hiding.current !== undefined) {
        clearTimeout(hiding.current);
        hiding.current = setTimeout(() => {
          setShowSlider(false);
          hiding.current = undefined;
        }, 2000);
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
        })}
        aria-label="Set difficulty"
      >
        <div
          className={classNames({
            "d-inline": true,
            clickable: true,
            ...(props.className ? { [props.className]: true } : {}),
          })}
          onClick={onTooltipToggleCB}
        >
          <FontAwesomeIcon icon={faBullseye} />
        </div>
        {props.notification && (
          <span className="notification">{props.notification}</span>
        )}
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
        <div className="x-button" onClick={onCloseCB}>
          <XIcon className="clickable" size="small" aria-label="close" />
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
