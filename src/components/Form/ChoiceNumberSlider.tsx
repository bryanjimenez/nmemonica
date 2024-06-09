import { Slider, Typography } from "@mui/material";
import { useState } from "react";
import "../../css/ChoiceNumberSlider.css";

interface Marks {
  value: number;
  raw: number;
}

interface ChoiceNumberSliderProps {
  initial: number;
  setChoiceN: (n: number) => void;
  /** Override choice size in wideMode */
  wideN?: number;
  wideMode?: boolean;
  toggleWide?: () => void;
}

export default function ChoiceNumberSlider(props: ChoiceNumberSliderProps) {
  const [initVal] = useState(props.initial);

  const min = 4;
  const max = 16;
  const wide = props.wideN ?? 32;

  let marks: Marks[] = [];
  let marksMap: Record<string, number> = {};

  for (let x = min; x < max + 1; x++) {
    const slide = ((x - min) / (max + 1 - min)) * 75;
    marks = [...marks, { value: slide, raw: x }];
    marksMap[`r ${slide}`] = x;
    marksMap[`s ${x}`] = slide;
  }
  marks = [...marks, { value: 100, raw: wide }];
  marksMap[`r 100`] = wide;
  marksMap[`s ${wide}`] = 100;

  const slideToRaw = (slide: number) => {
    return marksMap[`r ${slide}`];
  };

  const slideToRawString = (slide: number) => {
    return String(slideToRaw(slide));
  };

  const rawToSlide = (raw: number) => {
    return marksMap[`s ${raw}`];
  };

  const handleChange = (newValue: number) => {
    const prevVal = props.initial;
    const curVal = slideToRaw(newValue);

    if (curVal !== wide && prevVal !== wide && curVal !== prevVal) {
      props.setChoiceN(curVal);
      if (props.wideMode === true && typeof props.toggleWide === "function") {
        props.toggleWide();
      }
    } else if (curVal !== wide && prevVal === wide && curVal !== prevVal) {
      props.setChoiceN(curVal);
      if (props.wideMode === true && typeof props.toggleWide === "function") {
        props.toggleWide();
      }
    } else if (curVal === wide && curVal !== prevVal) {
      props.setChoiceN(curVal);
      if (props.wideMode === false && typeof props.toggleWide === "function") {
        props.toggleWide();
      }
    }
  };

  return (
    <div className="kana-slider">
      <Typography id="discrete-slider-restrict" gutterBottom>
        Difficulty
      </Typography>
      <Slider
        defaultValue={rawToSlide(initVal)}
        valueLabelFormat={slideToRaw}
        getAriaValueText={slideToRawString}
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
