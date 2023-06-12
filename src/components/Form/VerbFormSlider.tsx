import React, { useState } from "react";
import PropTypes from "prop-types";
import { Slider, Typography } from "@mui/material";
import "./VerbFormSlider.css";

interface Marks {
  value: number, raw: number
}

interface VerbFormSliderProps {
  initial:number;
  max:number;
  statusText:string;
  setChoiceN:(slipt:number)=>void
}

export default function VerbFormSlider(props:VerbFormSliderProps) {
  const [initVal] = useState(props.initial);

  const safeInitial = Math.min(props.max, initVal);
  const max = props.max;
  const min = 0;

  
  let marks:Marks[] = [];
  let marksMap:{[key:string]:number} = {};

  for (let x = min; x < max + 1; x++) {
    const slide = ((x - min) / (max - min)) * 100;
    marks = [...marks, { value: slide, raw: x }];
    marksMap["r" + slide] = x;
    marksMap["s" + x] = slide;
  }

  const slideToRaw = (slide:number) => {
    return marksMap["r" + slide];
  };

  const rawToSlide = (raw:number) => {
    return marksMap["s" + raw];
  };

  const slideToLabel = (slide:number) => {
    const idx = slideToRaw(slide);
    const half = Math.trunc(max / 2);

    let label = "";
    let splt = half + Math.abs(half - idx);
    if (max % 2 !== 0 && idx <= half) {
      splt++;
      label = splt + "";
    }

    if (max % 2 === 0 && idx === half) {
      // at the half way point
    } else if (idx < half + 1) {
      label = splt + " " + (max - splt);
    } else {
      label = max - splt + " " + splt;
    }

    return label;
  };

  const handleChange = (newValue:number) => {
    const prevVal = safeInitial;
    const curVal = slideToRaw(newValue);

    if (curVal !== prevVal) {
      props.setChoiceN(curVal);
    }
  };

  return (
    <div className="verb-form-slider-root">
      <Typography id="discrete-slider-restrict" gutterBottom>
        {props.statusText}
      </Typography>
      <Slider
        defaultValue={rawToSlide(safeInitial)}
        valueLabelFormat={slideToLabel}
        getAriaValueText={slideToLabel}
        aria-labelledby="discrete-slider-restrict"
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

VerbFormSlider.propTypes = {
  statusText: PropTypes.string,
  initial: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  setChoiceN: PropTypes.func.isRequired,
};
