import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Slider } from "@mui/material";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { lerp } from "../../helper/arrayHelper";
import { TouchSwipeIgnoreCss } from "../../helper/TouchSwipe";

import "./Difficulty.css";

/**
 * @typedef {Object} DifficultySliderProps
 * @property {number} value difficulty value
 * @property {(value:number)=>void} onChange is called after touch event ends
 */

/**
 * @param {DifficultySliderProps} props
 */
export function DifficultySlider(props) {
  const defaultDifficulty = props.value !== undefined ? props.value : 30;
  const [value, setValue] = useState(defaultDifficulty);

  useEffect(() => {
    setValue(defaultDifficulty);
  }, [defaultDifficulty, setValue]);

  const t = value / 100;

  const RY = [255, lerp(0, 255, t), 0]; // [255,0,0],   [255,255,0]
  const YG = [lerp(255, 0, t), 255, 0]; // [255,255,0], [0,255,0]
  const GB = [0, lerp(255, 0, t), lerp(0, 255, t)]; // [0,255,0],   [0,0,255]

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
  const difficultyColor = "rgb(" + r + "," + g + "," + b + "," + a + ")";

  const marks = [
    {
      value: 30,
      // label: "cutoff",
    },
  ];

  // FIXME: cleanup
  // const refactorStyle = {
  //   height: "200px",
  //   transformOrigin: "bottom",
  //   transform: "rotate(25deg)",
  // };

  // https://popper.js.org/react-popper/v2/
  // https://popper.js.org/docs/v2/modifiers/arrow/
  const [referenceElement, setReferenceElement] = useState(
    /** @type {HTMLDivElement | null}*/ (null)
  );
  const [popperElement, setPopperElement] = useState(
    /** @type {HTMLDivElement | null}*/ (null)
  );
  const [showSlider, setShowSlider] = useState(-1);
  const [arrowElement, setArrowElement] = useState(
    /** @type {HTMLDivElement | null}*/ (null)
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "top-start",
    modifiers: [{ name: "arrow", options: { element: arrowElement } }],
  });

  return (
    <>
      <div
        ref={setReferenceElement}
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
        ref={setPopperElement}
        className={classNames({
          invisible: showSlider < 0,
          [TouchSwipeIgnoreCss]: true,
        })}
        style={{ height: "200px", ...styles.popper }}
        {...attributes.popper}
      >
        <Slider
          sx={{ color: difficultyColor }}
          orientation="vertical"
          value={value}
          // defaultValue={defaultDiffVal}
          onChange={(e, newValue) => {
            if (showSlider > 0) {
              clearTimeout(showSlider);
            }
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
          valueLabelFormat={(value) => (value > 35 ? "Pass" : "Fail")}
        />
        <div ref={setArrowElement} /*id="arrow"*/ style={styles.arrow} />
      </div>
    </>
  );
}

DifficultySlider.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
};
