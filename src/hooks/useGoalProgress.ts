import { type MetaDataObj } from "nmemonica";
import React, { useEffect, useRef, useState } from "react";

import { wasToday } from "../helper/consoleHelper";
import { minimumTimeForSpaceRepUpdate } from "../helper/gameHelper";
import { getLastViewCounts } from "../helper/statsHelper";

const enum GoalStatus {
  // Pending >= 0
  Completed = -1,
  Undefined = -2,
}

const enum GoalStatusColor {
  Pending = "warning",
  Completed = "success",
  Undefined = "primary",
}

interface DailyGoal {
  lastView: string | undefined;
  selectedIndex: number;
  prevSelectedIndex: number;
  /** Previous scroll action timestamp */
  prevTimestamp: number;
  /** Total number of items */
  progressTotal: number;
  /** User-set goal */
  viewGoal: number | undefined;
  /** pending goal items */
  goalPending: React.RefObject<number>;

  /** notification message */
  msg: string;

  /** progress bar setter */
  setGoalProgress: React.Dispatch<React.SetStateAction<number | null>>;
  /** notification setter */
  setText: React.Dispatch<React.SetStateAction<string>>;
}

export function useGoalProgress(
  viewGoal: number | undefined,
  metadata: React.RefObject<Record<string, MetaDataObj | undefined>>
) {
  /** Number of review items still pending */
  const goalPendingREF = useRef<
    GoalStatus.Undefined | GoalStatus.Completed | number
  >(GoalStatus.Undefined);
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

/**
 * Logic to show progress and notification for set-goals
 */
export function updateDailyGoal({
  lastView,
  selectedIndex,
  prevSelectedIndex,
  prevTimestamp,
  progressTotal,
  viewGoal,
  goalPending,
  msg,
  setGoalProgress,
  setText,
}: DailyGoal) {
  if (goalPending.current === 0) {
    setText(`${viewGoal} ${msg}`);
    goalPending.current = GoalStatus.Completed;
  } else if (
    viewGoal !== undefined &&
    goalPending.current > 0 &&
    !wasToday(lastView) && //                       term has not yet been viewed
    prevSelectedIndex < selectedIndex && //         on scroll forward only
    minimumTimeForSpaceRepUpdate(prevTimestamp) //  no update on quick scrolls
  ) {
    goalPending.current -= 1;

    const goalProgress = ((viewGoal - goalPending.current) / viewGoal) * 100;
    const totalProgress = ((selectedIndex + 1) / progressTotal) * 100;

    // LinearProgress animation
    setGoalProgress(totalProgress);
    setTimeout(() => {
      setGoalProgress(goalProgress);
    }, 150);
    setTimeout(() => {
      setGoalProgress(null);
    }, 2000);
  }
}

/**
 * Initialize goalPending with count of items pending till goal
 * @returns
 * -1: no goal
 * -2: met goal
 * @param viewGoal User-set goal
 * @param repetition
 */
function initGoalPending(
  viewGoal: number | undefined,
  repetition: Record<string, MetaDataObj | undefined>
) {
  // get todays viewed total
  const [alreadyViewedToday] = getLastViewCounts(repetition, 1);
  // set goalPending to countdown if goal not yet reached
  if (viewGoal !== undefined) {
    const rem = viewGoal - alreadyViewedToday;

    return rem < 1 ? GoalStatus.Completed : rem;
  }

  return GoalStatus.Undefined;
}

export function goalProgressColor(
  goalProgress: number | null,
  goalPending: number
) {
  if (goalProgress !== null) {
    return GoalStatusColor.Pending;
  }

  // eslint-disable-next-line  @typescript-eslint/no-unsafe-enum-comparison
  if (goalPending === GoalStatus.Completed) {
    return GoalStatusColor.Completed;
  }

  return GoalStatusColor.Undefined;
}
