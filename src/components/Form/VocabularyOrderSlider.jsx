import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/core/Slider";

/**
 * @typedef {{ uid: string, label: string, idx: number }} BareIdx
 * @typedef {{ value: number, raw: number }} Marks
 */

/**
 * @typedef {{
 * initial: number,
 * list: BareIdx[],
 * setIndex: (index:number)=>void,
 * }} VocabularyOrderSliderProps
 */

const useStyles = makeStyles({
  root: { maxHeight: "43px" },
});

/**
 * @param {VocabularyOrderSliderProps} props
 */
export default function VocabularyOrderSlider(props) {
  const classes = useStyles();

  const min = 1;
  const max = props.list.length;
  const safeInitial = Math.min(max, props.initial);

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
   * @template T
   * @param {import("react").ChangeEvent<T>} event
   * @param {number} newValue
   */
  const handleChange = (event, newValue) => {
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
    <div className={classes.root}>
      <Slider
        value={rawToSlide(safeInitial)}
        valueLabelFormat={slideToLabel}
        getAriaValueText={slideToRawString}
        aria-label="Quick card scroll"
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

VocabularyOrderSlider.propTypes = {
  initial: PropTypes.number.isRequired,
  list: PropTypes.array.isRequired,
  setIndex: PropTypes.func.isRequired,
};
