import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { getVerbFormsArray } from "../../helper/gameHelper";

const useStyles = makeStyles({
  root: {
    width: 300,
  },
});

const min = 0;
const max = getVerbFormsArray("いる").length - 1;

let marks = [];
for (let x = min; x < max + 1; x++) {
  const slide = ((x - min) / (max + 1 - min)) * 100;

  marks.push({ value: slide, raw: x });
}
marks.push({ value: 100, raw: max + 1 });

function slideToRaw(slide) {
  const idx = marks.findIndex((mark) => mark.value === slide);
  return marks[idx].raw;
}

/**
 * Shows the count of verb forms for the selected side
 * @param {Number} slide
 * @returns {Number}
 */
function slideToLabels(slide) {
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

function rawToSlide(raw) {

  if(raw>(max + 1) || raw<0){
    console.log('VerbFormSlider bad input');
    return marks[0].value;
  }

  return marks[marks.findIndex((m) => m.raw === raw)].value;
}

const handleChange = (event, newValue, props) => {
  const prevVal = props.initial;
  const curVal = slideToRaw(newValue);

  if (curVal !== prevVal) {
    props.setChoiceN(curVal);
  }
};

export default function VerbFormSlider(props) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography id="discrete-slider-restrict" gutterBottom>
        {props.statusText}
      </Typography>
      <Slider
        value={rawToSlide(props.initial)}
        valueLabelFormat={slideToLabels}
        getAriaValueText={slideToLabels}
        aria-labelledby="discrete-slider-restrict"
        step={null}
        valueLabelDisplay="auto"
        marks={marks}
        onChange={(event, newValue) => {
          handleChange(event, newValue, props);
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
