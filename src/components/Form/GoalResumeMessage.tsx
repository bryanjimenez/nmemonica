import { LinearProgress } from "@mui/material";
import { type MetaDataObj } from "nmemonica";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NotReady } from "./NotReady";
import SimpleListMenu from "./SimpleListMenu";
import { getLastViewCounts } from "../../helper/statsHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { TermSortBy, TermSortByLabel } from "../../slices/settingHelper";
import { ValuesOf } from "../../typings/utils";

interface GoalResumeMessageProps {
  goal: string;
  setResumeSort: (i: number) => void;
  allowed: ValuesOf<typeof TermSortBy>[];
}

/**
 * Calculate the partial goal progress (0-100)
 * @param totalPending Total goal minus already completed goals (Only pending total)
 * @param partialGoal Goal for **current** dataset
 * @param partialPending Pending for **current** dataset (negative denotes past complete)
 */
export function partialGoal(
  totalPending: number,
  partialGoal?: number,
  partialPending?: number
) {
  // goal complete
  if (partialPending === undefined) {
    return 100;
  }

  // no goal set
  if (partialGoal === undefined) {
    return 1;
  }

  return ((partialGoal - partialPending) / totalPending) * 100;
}

/**
 * Calculate partial (not percentage)
 * @param goal
 * @param pending
 */
export function partialProgress(goal?: number, pending?: number) {
  // goal complete
  if (pending === undefined || pending < 1) {
    return goal ?? 0;
  }

  // no goal
  if (goal === undefined) {
    return 0;
  }

  return goal - pending;
}

export function GoalResumeMessage(props: GoalResumeMessageProps) {
  const { goal, setResumeSort, allowed } = props;
  if (!["Phrases", "Vocabulary", "Kanji"].includes(goal)) {
    throw new Error(`Unexpected goal: ${goal}`);
  }

  const { viewGoal: kanjiGoal, repetition: kanjiMeta } = useConnectKanji();
  const { viewGoal: vocabGoal, repetition: vocabMeta } = useConnectVocabulary();
  const { viewGoal: phraseGoal, repetition: phraseMeta } = useConnectPhrase();

  const timer = useRef<number | undefined>(-1);

  const {
    kPend,
    vPend,
    pPend,
    viewGoal,
    goalPending,
  }: {
    kPend?: number;
    vPend?: number;
    pPend?: number;
    viewGoal?: number;
    /** undefined: calculation not finished */
    goalPending?: number;
  } = useMemo(() => {
    const kPend = calcGoalPending(kanjiGoal, kanjiMeta);
    const vPend = calcGoalPending(vocabGoal, vocabMeta);
    const pPend = calcGoalPending(phraseGoal, phraseMeta);

    let viewGoal, goalPending;
    switch (goal) {
      case "Phrases":
        viewGoal = phraseGoal;
        goalPending = pPend;
        break;
      case "Vocabulary":
        viewGoal = vocabGoal;
        goalPending = vPend;
        break;
      default:
        // case "Kanji":
        viewGoal = kanjiGoal;
        goalPending = kPend;
        break;
    }

    return { kPend, vPend, pPend, viewGoal, goalPending };
  }, [
    goal,
    kanjiGoal,
    kanjiMeta,
    phraseGoal,
    phraseMeta,
    vocabGoal,
    vocabMeta,
  ]);

  const total = (kanjiGoal ?? 0) + (vocabGoal ?? 0) + (phraseGoal ?? 0);
  const totalPending =
    total -
    ((kPend === undefined && kanjiGoal !== undefined ? kanjiGoal : 0) +
      (vPend === undefined && vocabGoal !== undefined ? vocabGoal : 0) +
      (pPend === undefined && phraseGoal !== undefined ? phraseGoal : 0));

  const k = partialProgress(kanjiGoal, kPend);
  const v = partialProgress(vocabGoal, vPend);
  const p = partialProgress(phraseGoal, pPend);

  useEffect(() => {
    if (typeof timer.current === "number") {
      clearTimeout(timer.current);

      //@ts-expect-error NodeJS.timer
      timer.current = setTimeout(() => {
        clearTimeout(timer.current);

        // goalPending can be negative (denotes goal exceeded by)
        const g = partialGoal(totalPending, viewGoal, goalPending);
        const t = ((k + v + p) / total) * 100;

        // hide partial goal when all goals met
        setGoalProgress(t === 100 ? 0 : g);
        setTotalProgress(t);
      }, 2000);
    }
  });

  const resumeWithSortCB = useCallback(
    (sort: number) => {
      setResumeSort(sort);
    },
    [setResumeSort]
  );

  const [goalProgress, setGoalProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);

  if (goalPending === undefined)
    return <NotReady addlStyle="main-panel" text="Calculating ..." />;
  if (viewGoal === undefined)
    return <NotReady addlStyle="main-panel" text="No goal set" />;

  const msg =
    goalPending > 0 ? (
      <span>
        <strong>{String(goalPending)}</strong> pending to meet daily {goal} goal
      </span>
    ) : (
      `Met the ${String(viewGoal)}${goalPending < 0 ? ` ${goal} goal (+` + Math.abs(goalPending) + ")" : ""}`
    );

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
        color={goalPending > 0 ? "warning" : "success"}
        value={goalProgress}
        valueBuffer={totalProgress}
      />
    </>
  );
}

function calcGoalPending(
  viewGoal: number | undefined,
  repetition: Record<string, MetaDataObj | undefined>
) {
  if (viewGoal === undefined) {
    return undefined;
  }
  // get todays viewed total
  const [alreadyViewedToday] = getLastViewCounts(repetition, 1);

  return viewGoal - alreadyViewedToday;
}
