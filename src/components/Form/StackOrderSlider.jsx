import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/core/Slider";
import { JapaneseText } from "../../helper/JapaneseText";

const useStyles = makeStyles({
  root: { maxHeight: "43px" },
});

export default function StackOrderSlider(props) {
  const classes = useStyles();

  const min = 1;
  const max = props.list.length;

  let marks = [];
  for (let x = min; x <= max; x++) {
    const slide = (x / max) * 100;
    marks.push({ value: slide, raw: x - 1 });
  }

  const handleChange = (event, newValue, props) => {
    const prevVal = props.initial;
    const curVal = slideToRaw(newValue);

    if (curVal !== prevVal) {
      props.setIndex(curVal);
    }
  };

  const slideToRaw = (slide) => {
    const idx = marks.findIndex((mark) => mark.value === slide);
    return marks[idx].raw;
  };

  const slideToLabel = (slide) => {
    const idx = marks.findIndex((mark) => mark.value === slide);
    const text = JapaneseText.parse(props.list[marks[idx].raw].japanese);
    return text.getPronunciation()[0];
  };

  const rawToSlide = (raw) => {
    return marks[marks.findIndex((m) => m.raw === raw)].value;
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
