import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";

const useStyles = makeStyles({
  root: {
    width: 300,
  },
});

const min = 4;
const max = 16;
const wide = 32;

let marks = [];
for (let x = min; x < max + 1; x++) {
  const slide = ((x - min) / (max + 1 - min)) * 75;

  marks.push({ value: slide, raw: x });
}
marks.push({ value: 100, raw: wide });

function slideToRaw(slide) {
  const idx = marks.findIndex((mark) => mark.value === slide);
  return marks[idx].raw;
}

function rawToSlide(raw) {
  return marks[marks.findIndex((m) => m.raw === raw)].value;
}

const handleChange = (event, newValue, props) => {
  const prevVal = props.initial;
  const curVal = slideToRaw(newValue);

  if (curVal !== wide && prevVal !== wide && curVal !== prevVal) {
    props.setChoiceN(curVal);
    if (props.wideMode) {
      props.toggleWide();
    }
  } else if (curVal !== wide && prevVal === wide && curVal !== prevVal) {
    props.setChoiceN(curVal);
    if (props.wideMode) {
      props.toggleWide();
    }
  } else if (curVal === wide && curVal !== prevVal) {
    props.setChoiceN(curVal);
    if (!props.wideMode) {
      props.toggleWide();
    }
  }
};

export default function HiraganaOptionsSlider(props) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography id="discrete-slider-restrict" gutterBottom>
        Difficulty
      </Typography>
      <Slider
        value={rawToSlide(props.initial)}
        valueLabelFormat={slideToRaw}
        getAriaValueText={slideToRaw}
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

HiraganaOptionsSlider.propTypes = {
  initial: PropTypes.number,
  wideMode: PropTypes.bool,
  setChoiceN: PropTypes.func,
  toggleWide: PropTypes.func,
};
