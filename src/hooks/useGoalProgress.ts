import { type MetaDataObj } from "nmemonica";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { initGoalPending } from "../helper/gameHelper";

export function useGoalProgress(
  viewGoal: number | undefined,
  metadata: React.RefObject<Record<string, MetaDataObj | undefined>>
): {
  goalPendingREF: React.RefObject<number>;
  progressBarColor: "primary" | "success" | "warning";
  goalProgress: number | null;
  setGoalProgress: React.Dispatch<React.SetStateAction<number | null>>;
} {
  /** Number of review items still pending
   * -1: no goal
   * -2: met goal
   * */
  const goalPendingREF = useRef<number>(-1);
  const userSetGoal = useRef(viewGoal);
  const [goalProgress, setGoalProgress] = useState<number | null>(null);

  const initialLoad = useRef({
    goal: userSetGoal.current,
    meta: metadata.current,
  });

  useEffect(() => {
    const { goal, meta } = initialLoad.current;

    goalPendingREF.current = initGoalPending(goal, meta);
  }, []);

  const color = goalProgressColor(goalProgress, goalPendingREF.current);

  return {
    goalPendingREF,
    progressBarColor: color,
    goalProgress,
    setGoalProgress,
  };
}

export function goalProgressColor(
  goalProgress: number | null,
  goalPending: number
) {
  return goalProgress === null
    ? goalPending !== -2
      ? "primary"
      : "success"
    : "warning";
}
