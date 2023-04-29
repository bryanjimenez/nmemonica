import React, { useState } from "react";
import PropTypes from "prop-types";
import { Slider } from "@mui/material";

import "./VocabularyOrderSlider.css";

/**
 * @typedef {{ uid: string, label: string, idx: number }} BareIdx
 * @typedef {{ value: number, raw: number }} Marks
 */

/**
 * @typedef {Object} VocabularyOrderSliderProps
 * @property {number} initial
 * @property {BareIdx[]} list
 * @property {(index:number)=>void} setIndex
 */

/**
 * @param {VocabularyOrderSliderProps} props
 */
export default function VocabularyOrderSlider(props) {
  const [initVal] = useState(props.initial);
  const min = 1;
  const max = props.list.length;
  const safeInitial = Math.min(max, initVal);

  /** @type {Marks[]} */
  let marks = [];
  /** @type {{[key:string]:number}} */
  let marksMap = {};

  for (let x = min; x <= max; x++) {
    const slide = (x / max) * 100;
    marks = [...marks, { value: slide, raw: x - 1 }];
    marksMap["r" + slide] = x - 1;
    marksMap["s" + (x - 1)] = slide;
  }

  /**
   * @param {number} newValue
   */
  const handleChange = (newValue) => {
    const prevVal = safeInitial;
    const curVal = slideToRaw(newValue);

    if (curVal !== prevVal) {
      props.setIndex(curVal);
    }
  };

  /** @param {number} slide */
  const slideToRaw = (slide) => {
    return marksMap["r" + slide];
  };

  /** @param {number} slide */
  const slideToRawString = (slide) => {
    return "" + slideToRaw(slide);
  };

  /** @param {number} slide */
  const slideToLabel = (slide) => {
    const raw = marksMap["r" + slide];
    return props.list[raw].label[0];
  };

  /** @param {number} raw */
  const rawToSlide = (raw) => {
    return marksMap["s" + raw];
  };

  return (
    <div className="vocabulary-slider">
      <Slider
        defaultValue={rawToSlide(safeInitial)}
        valueLabelFormat={slideToLabel}
        getAriaValueText={slideToRawString}
        aria-label="Quick card scroll"
        step={null}
        valueLabelDisplay="auto"
        marks={marks}
        onChangeCommitted={(event, newValue) => {
          if (typeof newValue === "number") {
            handleChange(newValue);
          }
        }}
      />
    </div>
  );
}

VocabularyOrderSlider.propTypes = {
  initial: PropTypes.number.isRequired,
  list: PropTypes.array.isRequired,
  setIndex: PropTypes.func.isRequired,
};
