import { Slider } from "@mui/material";
import PropTypes from "prop-types";
import React, { useState } from "react";
import "./VocabularyOrderSlider.css";

/**
 * @typedef {{ uid: string, label: string, idx: number }} BareIdx
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
  const min = 0;
  const max = props.list.length - 1;
  const [value, setValue] = useState(() => Math.min(max, props.initial));

  return (
    <div className="vocabulary-slider">
      <Slider
        key={value}
        defaultValue={value}
        valueLabelFormat={(i) => props.list[i].label}
        getAriaValueText={(i) => props.list[i].label}
        aria-label="Alphabetic quick scroll"
        step={1}
        min={min}
        max={max}
        valueLabelDisplay="auto"
        onChangeCommitted={(event, newValue) => {
          if (typeof newValue === "number") {
            props.setIndex(newValue);
            setValue(newValue);
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
