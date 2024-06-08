import { LinearProgress } from "@mui/material";
import { useCallback, useState } from "react";

import SimpleListMenu from "./SimpleListMenu";
import { TermSortBy, TermSortByLabel } from "../../slices/settingHelper";
import { ValuesOf } from "../../typings/utils";

interface GoalResumeMessageProps {
  viewGoal?: number;
  /**
   * **Positive**: goal *not reached* yet pending `goalPending`  
   * **Negative**: goal *exceeded* by `goalPending`
   **/
  goalPending: number;
  setResumeSort: (i: number) => void;
  allowed: ValuesOf<typeof TermSortBy>[];
}

export function GoalResumeMessage(props: GoalResumeMessageProps) {
  const { viewGoal, goalPending, setResumeSort, allowed } = props;

  const resumeWithSortCB = useCallback(
    (sort: number) => {
      setResumeSort(sort);
    },
    [setResumeSort]
  );

  const [goalProgress, setGoalProgress] = useState(0);

  const msg =
    viewGoal === undefined ? (
      "No goal set"
    ) : goalPending > 0 ? (
      <span>
        <strong>{String(goalPending)}</strong> pending to meet daily goal
      </span>
    ) : (
      `Met the ${String(viewGoal)}${goalPending < 0 ? " goal (+" + Math.abs(goalPending) + ")" : ""}`
    );

  setTimeout(() => {
    // goalPending can be negative (denotes goal exceeded by)
    const p =
      viewGoal === undefined
        ? 1
        : Math.min((viewGoal - goalPending) / viewGoal, 1) * 100;

    setGoalProgress(p);
  }, 1000);

  return (
    <>
      <div className="main-panel d-flex flex-column justify-content-center text-center h-100">
        <div>
          <span className="fs-3">{msg}</span>
        </div>
        <div className="mt-3 d-flex justify-content-center">
          <div className="fs-4 mt-5">resume sorting by</div>
          <SimpleListMenu
            options={TermSortByLabel}
            initial={-1}
            allowed={allowed}
            onChange={resumeWithSortCB}
          />
        </div>
      </div>
      <LinearProgress
        variant="buffer"
        color="warning"
        value={0}
        valueBuffer={goalProgress}
      />
    </>
  );
}
