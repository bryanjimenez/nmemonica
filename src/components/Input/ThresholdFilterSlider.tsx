import { Slider } from "@mui/material";
import { SortAscIcon, SortDescIcon } from "@primer/octicons-react";
import { useCallback, useState } from "react";

import { heatMap } from "../../helper/colorHelper";
import { DIFFICULTY_THRLD, MEMORIZED_THRLD } from "../../helper/sortHelper";

interface ThresholdFilterSliderProps {
  threshold: number;
  setThreshold: (value: number) => void;
}

export function ThresholdFilterSlider(props: ThresholdFilterSliderProps) {
  const { threshold, setThreshold } = props;
  const [defaultValue] = useState(Math.abs(threshold));

  const c = heatMap(Math.abs(threshold) / 100, 0.75);
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

  const flipThresholdCB = useCallback(() => {
    setThreshold(-1 * threshold);
  }, [setThreshold, threshold]);

  return (
    <>
      <div className="w-100 d-flex flex-column">
        <div className="text-nowrap fs-x-small text-start">
          {`Difficulty filter: ${threshold}`}
        </div>
        <div className="d-flex">
          <Slider
            sx={{ color: c }}
            defaultValue={defaultValue}
            marks={difficultyMarks}
            track={threshold < 0 ? undefined : "inverted"}
            onChangeCommitted={(e, newValue) => {
              const sign = threshold < 0 ? -1 : 1;
              if (typeof newValue === "number") {
                if (newValue === 0) {
                  setThreshold(Number(sign));
                } else {
                  setThreshold(sign * newValue);
                }
              }
            }}
            valueLabelDisplay="auto"
          />
          <div className="mt-2 ms-3 " onClick={flipThresholdCB}>
            {threshold < 0 ? <SortAscIcon /> : <SortDescIcon />}
          </div>
        </div>
      </div>
    </>
  );
}
