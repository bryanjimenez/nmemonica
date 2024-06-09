import { Slider } from "@mui/material";
import React, { useState } from "react";
import "../../css/VocabularyOrderSlider.css";

export interface BareIdx {
  uid: string;
  label: string;
  idx: number;
}

interface VocabularyOrderSliderProps {
  initial: number;
  list: BareIdx[];
  setIndex: (index: number) => void;
}

export default function VocabularyOrderSlider(
  props: VocabularyOrderSliderProps
) {
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
