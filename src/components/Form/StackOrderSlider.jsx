import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/core/Slider";

const useStyles = makeStyles({
  root: { maxHeight: "43px" },
});

export default function StackOrderSlider(props) {
  const classes = useStyles();

  const min = 1;
  const max = props.list.length;

  let marks = [];
  let marksMap = {};

  for (let x = min; x <= max; x++) {
    const slide = (x / max) * 100;
    marks = [...marks, { value: slide, raw: x - 1 }];
    marksMap["s" + slide] = { raw: x - 1 };
    marksMap["r" + (x - 1)] = { slide };
  }

  const handleChange = (event, newValue, props) => {
    const prevVal = props.initial;
    const curVal = slideToRaw(newValue);

    if (curVal !== prevVal) {
      props.setIndex(curVal);
    }
  };

  const slideToRaw = (slide) => {
    // const idx = marks.findIndex((mark) => mark.value === slide);
    // return marks[idx].raw;
    return marksMap["s" + slide].raw;
  };

  const slideToLabel = (slide) => {
    // const idx = marks.findIndex((mark) => mark.value === slide);
    // return props.list[marks[idx].raw].label[0];
    const raw = marksMap["s" + slide].raw;
    return props.list[raw].label[0];
  };

  const rawToSlide = (raw) => {
    // return marks[marks.findIndex((m) => m.raw === raw)].value;
    return marksMap["r" + raw].slide;
  };

  return (
    <div className={classes.root}>
      <Slider
        value={rawToSlide(props.initial)}
        valueLabelFormat={slideToLabel}
        getAriaValueText={slideToRaw}
        aria-label="Quick card scroll"
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

StackOrderSlider.propTypes = {
  initial: PropTypes.number.isRequired,
  list: PropTypes.array.isRequired,
  setIndex: PropTypes.func.isRequired,
};
