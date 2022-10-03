import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";

/**
 * @typedef {{ value: number, raw: number }} Marks
 */

/**
 * @typedef {{
 * initial: number,
 * wideMode: boolean,
 * setChoiceN: function,
 * toggleWide: function,
 * }} HiraganaOptionsSliderProps
 */

const useStyles = makeStyles({
  root: {
    width: 300,
  },
});

/** @param {HiraganaOptionsSliderProps} props */
export default function HiraganaOptionsSlider(props) {
  const classes = useStyles();

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
   * @template T
   * @param {import("react").ChangeEvent<T>} event
   * @param {number} newValue
   */
  const handleChange = (event, newValue) => {
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

  return (
    <div className={classes.root}>
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
            handleChange(event, newValue);
          }
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
