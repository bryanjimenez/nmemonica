import { Slider } from "@mui/material";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

import { heatMap } from "../../helper/colorHelper";
import { DIFFICULTY_THRLD, MEMORIZED_THRLD } from "../../helper/gameHelper";

interface DifficultySliderProps {
  difficulty?: number;
  /** is called after touch event ends */
  onChange: (difficulty?: null | number) => void;
  /** Causes component to reset */
  resetOn: string;
}

export function DifficultySlider(props: DifficultySliderProps) {
  const { resetOn } = props;
  const difficultyREF = useRef(0);
  difficultyREF.current = props.difficulty ?? 30;
  const [difficulty, setDifficulty] = useState(difficultyREF.current);
  const touched = useRef(false);

  useEffect(() => {
    touched.current = false;
    setDifficulty(difficultyREF.current);
  }, [resetOn]);

  const c = heatMap(difficulty);
  const gray = `rgb(${189},${189},${189},${0.25})`; //"#bdbdbd"


  const difficultyMarks = [
    {
      value: MEMORIZED_THRLD,
      // label: "memorized"
    },
    {
      value: DIFFICULTY_THRLD,
      // label: "difficult",
    },
  ];

  return (
    <Slider
      orientation="vertical"
      sx={{ color: difficulty === 0 || !touched.current ? gray : c }}
      value={difficulty}
      onChange={(e, newValue) => {
        if (typeof newValue === "number") {
          touched.current = true;
          setDifficulty(newValue);
        }
      }}
      onChangeCommitted={(e, newValue) => {
        touched.current = true;

        if (
          typeof props.onChange === "function" &&
          typeof newValue === "number"
        ) {
          const d = newValue === 0 ? null : newValue;
          props.onChange(d);
        }
      }}
      marks={difficultyMarks}
      step={10}
      valueLabelFormat={(value) => (value > DIFFICULTY_THRLD ? "Pass" : "Fail")}
    />
  );
}

DifficultySlider.propTypes = {
  difficulty: PropTypes.number,
  onChange: PropTypes.func,
  resetOn: PropTypes.string,
};
