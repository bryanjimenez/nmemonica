import { arrow, offset, shift, useFloating } from "@floating-ui/react-dom";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Slider } from "@mui/material";
import classNames from "classnames";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

import { lerp } from "../../helper/arrayHelper";
import { DIFFICULTY_THRLD, MEMORIZED_THRLD } from "../../helper/gameHelper";
import { TouchSwipeIgnoreCss } from "../../helper/TouchSwipe";
import "../../css/Difficulty.css";
import { useWindowSize } from "../../hooks/useWindowSize";

interface DifficultySliderProps {
  value?: number; //difficulty value
  onChange: (value: number) => void; //is called after touch event ends
  manualUpdate: string; // a changing value that will trigger an update to useFloating
}

export function DifficultySlider(props: DifficultySliderProps) {
  const defaultDifficulty = props.value ?? 30;
  const [value, setValue] = useState(defaultDifficulty);

  useEffect(() => {
    setValue(defaultDifficulty);
  }, [defaultDifficulty]);

  const t = value / 100;

  const [rB, gB, bB] = [13, 110, 256]; // nice blue

  const RY = [255, lerp(0, 255, t), 0]; // [255,0,0],   [255,255,0]
  const YG = [lerp(255, 0, t), 255, 0]; // [255,255,0], [0,255,0]
  const GB = [rB, lerp(255, gB, t), lerp(0, bB, t)]; // [0,255,0],   [0,0,255]

  const RY_YG = [
    lerp(RY[0], YG[0], t),
    lerp(RY[1], YG[1], t),
    lerp(RY[2], YG[2], t),
  ];
  const YG_GB = [
    lerp(YG[0], GB[0], t),
    lerp(YG[1], GB[1], t),
    lerp(YG[2], GB[2], t),
  ];
  const colorVals = [
    lerp(RY_YG[0], YG_GB[0], t),
    lerp(RY_YG[1], YG_GB[1], t),
    lerp(RY_YG[2], YG_GB[2], t),
  ];

  const [r, g, b] = colorVals.map((v) => Math.floor(v));
  const a = 0.25;
  // console.log( r, g, b)
  const difficultyColor = `rgb(${r},${g},${b},${a})`;

  const marks = [
    {
      value: MEMORIZED_THRLD,
      // label: "memorized"
    },
    {
      value: DIFFICULTY_THRLD,
      // label: "cutoff",
    },
  ];

  const w = useWindowSize();

  const [showSlider, setShowSlider] = useState(-1);
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
  }, [update, w.height, w.width, props.manualUpdate]);

  return (
    <>
      <div
        ref={refs.setReference}
        className="sm-icon-grp clickable"
        aria-label="Set difficulty"
        onClick={() => {
          setShowSlider((v) => {
            if (v > 0) {
              clearTimeout(v);
            }
            const t = setTimeout(() => setShowSlider(-1), 3500);
            return Number(t);
          });
        }}
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
          invisible: showSlider < 0,
          "tooltip-fade": showSlider < 0,
          [TouchSwipeIgnoreCss]: true,
        })}
      >
        <Slider
          sx={{ color: difficultyColor }}
          orientation="vertical"
          value={value}
          onChange={(e, newValue) => {
            clearTimeout(showSlider);
            setShowSlider(0);

            if (typeof newValue === "number") {
              setValue(newValue);
            }
          }}
          onChangeCommitted={(e, newValue) => {
            const t = setTimeout(() => setShowSlider(-1), 1000);
            setShowSlider(Number(t));

            if (
              typeof props.onChange === "function" &&
              typeof newValue === "number"
            ) {
              props.onChange(newValue);
            }
          }}
          marks={marks}
          step={10}
          // valueLabelDisplay="on"
          valueLabelFormat={(value) =>
            value > DIFFICULTY_THRLD ? "Pass" : "Fail"
          }
        />
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

DifficultySlider.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  manualUpdate: PropTypes.string,
};
