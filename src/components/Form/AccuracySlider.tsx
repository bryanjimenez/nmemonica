import { Slider } from "@mui/material";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

import { SR_CORRECT_TRESHHOLD } from "../../helper/recallHelper";

interface AccuracySliderProps {
  accuracy?: number;
  /** is called after touch event ends */
  onChange: (accuracy?: null | number) => void;
  /** Causes component to reset */
  resetOn: string;
}

export function AccuracySlider(props: AccuracySliderProps) {
  const { resetOn } = props;
  const accuracyRef = useRef(0);
  accuracyRef.current = props.accuracy ?? 0;
  const [accuracy, setAccuracy] = useState(accuracyRef.current);
  const touched = useRef(false);

  useEffect(() => {
    touched.current = false;
    setAccuracy(accuracyRef.current);
  }, [resetOn]);

  const accuracyMarks = [
    {
      // label: "correct"
      value: SR_CORRECT_TRESHHOLD * 100,
    },
  ];

  return (
    <Slider
      orientation="vertical"
      sx={{ color: accuracy === 0 || !touched.current ? "#bdbdbd" : undefined }}
      value={accuracy}
      disabled={accuracy < 0}
      onChange={(e, newValue) => {
        if (typeof newValue === "number") {
          touched.current = true;
          setAccuracy(newValue);
        }
      }}
      onChangeCommitted={(e, newValue) => {
        touched.current = true;
        if (
          typeof props.onChange === "function" &&
          typeof newValue === "number"
        ) {
          const a = newValue === 0 ? null : newValue;
          props.onChange(a);
        }
      }}
      marks={accuracyMarks}
      valueLabelFormat={(value) =>
        value >= SR_CORRECT_TRESHHOLD * 100 ? "Correct" : "Incorrect"
      }
    />
  );
}

AccuracySlider.propTypes = {
  accuracy: PropTypes.number,
  onChange: PropTypes.func,
  resetOn: PropTypes.string,
};
