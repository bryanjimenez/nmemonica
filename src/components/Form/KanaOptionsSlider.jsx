import React from "react";
import PropTypes from "prop-types";
import { Slider, Typography } from "@mui/material";

import "./KanaOptionsSlider.css";

/**
 * @typedef {{ value: number, raw: number }} Marks
 */

/**
 * @typedef {Object} KanaOptionsSliderProps
 * @property {number} initial
 * @property {function} setChoiceN
 * @property {boolean} [wideMode]
 * @property {function} [toggleWide]
 */

/** @param {KanaOptionsSliderProps} props */
export default function KanaOptionsSlider(props) {
  const min = 4;
  const max = 16;
  const wide = 32;

  /** @type {Marks[]} */
  let marks = [];
  /** @type {{[key:string]:number}} */
  let marksMap = {};

  for (let x = min; x < max + 1; x++) {
    const slide = ((x - min) / (max + 1 - min)) * 75;
    marks = [...marks, { value: slide, raw: x }];
    marksMap["r" + slide] = x;
    marksMap["s" + x] = slide;
  }
  marks = [...marks, { value: 100, raw: wide }];
  marksMap["r" + 100] = wide;
  marksMap["s" + wide] = 100;

  /** @param {number} slide */
  const slideToRaw = (slide) => {
    return marksMap["r" + slide];
  };

  /** @param {number} slide */
  const slideToRawString = (slide) => {
    return "" + slideToRaw(slide);
  };

  /** @param {number} raw */
  const rawToSlide = (raw) => {
    return marksMap["s" + raw];
  };

  /**
   * @param {number} newValue
   */
  const handleChange = (newValue) => {
    const prevVal = props.initial;
    const curVal = slideToRaw(newValue);

    if (curVal !== wide && prevVal !== wide && curVal !== prevVal) {
      props.setChoiceN(curVal);
      if (props.wideMode === true && typeof props.toggleWide === "function") {
        props.toggleWide();
      }
    } else if (curVal !== wide && prevVal === wide && curVal !== prevVal) {
      props.setChoiceN(curVal);
      if (props.wideMode === true && typeof props.toggleWide === "function") {
        props.toggleWide();
      }
    } else if (curVal === wide && curVal !== prevVal) {
      props.setChoiceN(curVal);
      if (props.wideMode === false && typeof props.toggleWide === "function") {
        props.toggleWide();
      }
    }
  };

  return (
    <div className="kana-slider">
      <Typography id="discrete-slider-restrict" gutterBottom>
        Difficulty
      </Typography>
      <Slider
        value={rawToSlide(props.initial)}
        valueLabelFormat={slideToRaw}
        getAriaValueText={slideToRawString}
        aria-labelledby="discrete-slider-restrict"
        step={null}
        valueLabelDisplay="auto"
        marks={marks}
        onChange={(event, newValue) => {
          if (typeof newValue === "number") {
            handleChange(newValue);
          }
        }}
      />
    </div>
  );
}

KanaOptionsSlider.propTypes = {
  initial: PropTypes.number,
  wideMode: PropTypes.bool,
  setChoiceN: PropTypes.func,
  toggleWide: PropTypes.func,
};
