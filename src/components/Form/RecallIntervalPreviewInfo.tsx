import { KebabHorizontalIcon } from "@primer/octicons-react";
import PropTypes from "prop-types";

import { daysSince } from "../../helper/consoleHelper";
import { calculateDaysBetweenReviews } from "../../helper/recallHelper";
import type { MetaDataObj } from "../../typings/raw";

interface RecallIntervalPreviewInfoProps {
  metadata?: MetaDataObj;
}

/**
 * Show current interval and preview next
 */
export function RecallIntervalPreviewInfo(
  props: RecallIntervalPreviewInfoProps
) {
  const { accuracyP, difficultyP, daysBetweenReviews, lastReview } =
    props.metadata ?? {};

  let prevInterval = null;
  let nextIntervalText = null;
  let icon = null;
  let prevIntervalText = null;
  if (accuracyP && difficultyP) {
    const daysSinceReview =
      lastReview !== undefined ? daysSince(lastReview) : undefined;
    const next = calculateDaysBetweenReviews({
      accuracy: accuracyP / 100,
      difficulty: difficultyP / 100,
      daysBetweenReviews,
      daysSinceReview,
    });
    prevInterval =
      daysBetweenReviews !== undefined ? daysBetweenReviews.toFixed(0) : "";
    nextIntervalText = <span>{next.toFixed(0)}</span>;
    icon = (
      <div className="my-2 rotate-90">
        <KebabHorizontalIcon size="small" aria-label="calculated" />
      </div>
    );

    prevIntervalText = (
      <div className="h-100 d-flex flex-column justify-content-end">
        <span className="rotate-270 w-0 text-nowrap">
          {"Interval:    " + prevInterval}
        </span>
      </div>
    );
  }

  return (
    <div className="h-100 d-flex flex-column justify-content-center align-items-center">
      {nextIntervalText}
      {icon}
      {prevIntervalText}
    </div>
  );
}

RecallIntervalPreviewInfo.propTypes = {
  prev: PropTypes.object,
};
