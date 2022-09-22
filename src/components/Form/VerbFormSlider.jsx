import React from "react";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import "./VerbFormSlider.css";

function populateMarks(max) {
  const marks = [];
  const min = 0;
  for (let x = min; x < max + 1; x++) {
    const slide = ((x - min) / (max + 1 - min)) * 100;

    marks.push({ value: slide, raw: x });
  }
  marks.push({ value: 100, raw: max + 1 });

  return marks;
}

function slideToRaw(slide, marks) {
  const idx = marks.findIndex((mark) => mark.value === slide);
  return marks[idx].raw;
}

/**
 * Shows the count of verb forms for the selected side
 * @param {number} slide
 * @returns {number}
 */
function slideToLabels(slide, marks, max) {
  const idx = marks.findIndex((mark) => mark.value === slide);
  const half = Math.trunc((max + 1) / 2);

  let lbl = half + Math.abs(half - marks[idx].raw);
  if ((max + 1) % 2 !== 0 && idx <= half) {
    lbl++;
  }

  if ((max + 1) % 2 === 0 && idx === half) {
    // at the half way point
  } else if (idx < half + 1) {
    lbl = lbl + " " + (max + 1 - lbl);
  } else {
    lbl = max + 1 - lbl + " " + lbl;
  }

  return lbl;
}

function rawToSlide(raw, marks, max) {
  if (raw > max + 1 || raw < 0) {
    console.log("VerbFormSlider bad input");
    return marks[0].value;
  }

  return marks[marks.findIndex((m) => m.raw === raw)].value;
}

const handleChange = (event, newValue, props, marks) => {
  const prevVal = props.initial;
  const curVal = slideToRaw(newValue, marks);

  if (curVal !== prevVal) {
    props.setChoiceN(curVal);
  }
};

export default function VerbFormSlider(props) {
  const max = props.max - 1;
  const marks = populateMarks(max);

  const rts = (raw) => rawToSlide(raw, marks, max);
  const stl = (slide) => slideToLabels(slide, marks, max);

  return (
    <div className="verb-form-slider-root">
      <Typography id="discrete-slider-restrict" gutterBottom>
        {props.statusText}
      </Typography>
      <Slider
        value={rts(props.initial)}
        valueLabelFormat={stl}
        getAriaValueText={stl}
        aria-labelledby="discrete-slider-restrict"
        step={null}
        valueLabelDisplay="auto"
        marks={marks}
        onChange={(event, newValue) => {
          handleChange(event, newValue, props, marks);
        }}
      />
    </div>
  );
}

VerbFormSlider.propTypes = {
  statusText: PropTypes.string,
  initial: PropTypes.number,
  setChoiceN: PropTypes.func,
};
