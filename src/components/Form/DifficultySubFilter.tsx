import { Slider } from "@mui/material";
import { SortAscIcon, SortDescIcon } from "@primer/octicons-react";
import PropTypes from "prop-types";
import { useState } from "react";

interface DifficultySubFilterProps {
  memoThreshold: number;
  setThreshold: (value: number) => void;
}

export function DifficultySubFilter(props: DifficultySubFilterProps) {
  const { memoThreshold, setThreshold } = props;
  const [defaultValue] = useState(Math.abs(memoThreshold));

  return (
    <div className="d-flex justify-content-end">
      <Slider
        defaultValue={defaultValue}
        track={memoThreshold < 0 ? undefined : "inverted"}
        onChangeCommitted={(e, newValue) => {
          const sign = memoThreshold < 0 ? -1 : 1;
          if (typeof newValue === "number") {
            setThreshold(sign * newValue);
          }
        }}
        valueLabelDisplay="auto"
      />

      <div
        className="mt-2 ms-3 "
        onClick={() => {
          return setThreshold(-1 * memoThreshold);
        }}
      >
        {memoThreshold < 0 ? <SortDescIcon /> : <SortAscIcon />}
      </div>
    </div>
  );
}

DifficultySubFilter.propTypes = {
  memoThreshold: PropTypes.number,
  setThreshold: PropTypes.func,
};
