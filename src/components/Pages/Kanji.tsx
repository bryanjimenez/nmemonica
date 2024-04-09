import { offset, shift, useFloating } from "@floating-ui/react-dom";
import { LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import type { RawVocabulary } from "nmemonica";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import { isGroupLevel } from "./SetTermTagList";
import { shuffleArray } from "../../helper/arrayHelper";
import { daysSince, spaceRepLog } from "../../helper/consoleHelper";
import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import {
  getTerm,
  getTermUID,
  minimumTimeForSpaceRepUpdate,
  play,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import {
  getPercentOverdue,
  recallDebugLogHelper,
  recallNotificationHelper,
  spaceRepetitionOrder,
} from "../../helper/recallHelper";
import {
  dateViewOrder,
  difficultyOrder,
  difficultySubFilter,
  randomOrder,
} from "../../helper/sortHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useWindowSize } from "../../hooks/useWindowSize";
import type { AppDispatch, RootState } from "../../slices";
import { logger } from "../../slices/globalSlice";
import {
  addFrequencyKanji,
  getKanji,
  removeFrequencyKanji,
  removeFromSpaceRepetition,
  setKanjiAccuracy,
  setKanjiDifficulty,
  setSpaceRepetitionMetadata,
  toggleKanjiFilter,
  updateSpaceRepKanji,
} from "../../slices/kanjiSlice";
import {
  DebugLevel,
  TermFilterBy,
  TermSortBy,
} from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import { AccuracySlider } from "../Form/AccuracySlider";
import { type ConsoleMessage } from "../Form/Console";
import { DifficultySlider } from "../Form/DifficultySlider";
import { NotReady } from "../Form/NotReady";
import { ToggleFrequencyTermBtnMemo } from "../Form/OptionsBar";
import { RecallIntervalPreviewInfo } from "../Form/RecallIntervalPreviewInfo";
import StackNavButton from "../Form/StackNavButton";
import "../../css/Kanji.css";
import { Tooltip } from "../Form/Tooltip";

const KanjiMeta = {
  location: "/kanji/",
  label: "Kanji",
};

export default function Kanji() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies } = useSelector(({ global }: RootState) => global);

  const addFrequencyTerm = useCallback(
    (uid: string) => {
      setFrequency((f) => [...f, uid]);
      dispatch(addFrequencyKanji(uid));
    },
    [dispatch]
  );
  const removeFrequencyTerm = useCallback(
    (uid: string) => {
      setFrequency((f) => f.filter((id) => id !== uid));
      dispatch(removeFrequencyKanji(uid));
    },
    [dispatch]
  );

  const {
    kanjiList,

    filterType: filterTypeREF,
    reinforce: reinforceREF,
    difficultyThreshold,
    activeTags,
    orderType: sortMethodREF,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,

    repetition,
  } = useConnectKanji();

  const repMinItemReviewREF = useRef(spaRepMaxReviewItem);
  const difficultyThresholdREF = useRef(difficultyThreshold);

  const { vocabList } = useConnectVocabulary();

  // after initial render
  useEffect(() => {
    if (kanjiList.length === 0) {
      void dispatch(getKanji());
    }
    if (vocabList.length === 0) {
      void dispatch(getVocabulary());
    }
  }, []);

  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef<number>(Date.now());

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const [frequency, setFrequency] = useState<string[]>([]); //subset of frequency words within current active group
  const [showOn, setShowOn] = useState(false);
  const [showKun, setShowKun] = useState(false);
  const [showEx, setShowEx] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  const [log, setLog] = useState<ConsoleMessage[]>([]);
  /** Is not undefined after user modifies accuracyP value */
  const accuracyModifiedRef = useRef<undefined | null | number>();

  const filteredTerms = useMemo(() => {
    if (kanjiList.length === 0) return [];
    if (Object.keys(metadata.current).length === 0 && activeTags.length === 0)
      return kanjiList;

    const allFrequency = Object.keys(metadata.current).reduce<string[]>(
      (acc, cur) => {
        if (metadata.current[cur]?.rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    let filtered = termFilterByType(
      filterTypeREF.current,
      kanjiList,
      allFrequency,
      filterTypeREF.current === TermFilterBy.TAGS ? activeTags : [],
      buildAction(dispatch, toggleKanjiFilter)
    );

    // exclude terms with difficulty beyond difficultyThreshold
    const subFilter = difficultySubFilter(
      difficultyThresholdREF.current,
      filtered,
      metadata.current
    );

    if (subFilter.length > 0) {
      filtered = subFilter;
    } else {
      setLog((l) => [
        ...l,
        {
          msg: "Excluded all terms. Discarding memorized subfiltering.",
          lvl: DebugLevel.WARN,
        },
      ]);
    }

    switch (sortMethodREF.current) {
      case TermSortBy.RECALL:
        // discard the nonPending terms
        const {
          failed,
          overdue,
          overLimit: leftOver,
        } = spaceRepetitionOrder(
          filtered,
          metadata.current,
          repMinItemReviewREF.current
        );
        // if *just one* overLimit then add to pending now
        const overLimit = leftOver.length === 1 ? [] : leftOver;
        const pending =
          leftOver.length === 1
            ? [...failed, ...overdue, ...leftOver]
            : [...failed, ...overdue];

        if (pending.length > 0 && filtered.length !== pending.length) {
          // reduce filtered
          filtered = pending.map((p) => filtered[p]);
        }

        const overdueVals = pending.map((item, i) => {
          const {
            accuracyP = 0,
            lastReview,
            daysBetweenReviews,
            // metadata includes filtered in Recall sort
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          } = metadata.current[filtered[i].uid]!;
          const daysSinceReview = lastReview
            ? daysSince(lastReview)
            : undefined;
          const p = getPercentOverdue({
            accuracy: accuracyP,
            daysSinceReview,
            daysBetweenReviews,
          });

          return p.toFixed(2).replace(".00", "").replace("0.", ".");
        });

        const more = overLimit.length > 0 ? `+${overLimit.length}` : "";

        setLog((l) => [
          ...l,
          {
            msg: `Space Rep 2 (${
              overdueVals.length
            })${more} [${overdueVals.toString()}]`,
            lvl: pending.length === 0 ? DebugLevel.WARN : DebugLevel.DEBUG,
          },
        ]);

        break;
      case TermSortBy.VIEW_DATE:
        if (!includeNew) {
          filtered = filtered.filter(
            (el) => metadata.current[el.uid]?.lastView !== undefined
          );
        }

        if (!includeReviewed) {
          filtered = filtered.filter(
            (el) => metadata.current[el.uid]?.lastReview === undefined
          );
        }

        break;
    }

    const frequency = filtered.reduce<string[]>((acc, cur) => {
      if (metadata.current[cur.uid]?.rein === true) {
        acc = [...acc, cur.uid];
      }
      return acc;
    }, []);
    setFrequency(frequency);

    return filtered;
  }, [
    dispatch,
    filterTypeREF,
    difficultyThresholdREF,
    sortMethodREF,
    kanjiList,
    activeTags,
    includeNew,
    includeReviewed,
  ]);

  const { order, recallGame } = useMemo(() => {
    if (filteredTerms.length === 0) return { order: [], recallGame: -1 };

    let newOrder: number[];
    let recallGame = -1;
    switch (sortMethodREF.current) {
      case TermSortBy.DIFFICULTY:
        newOrder = difficultyOrder(filteredTerms, metadata.current);
        setLog((l) => [
          ...l,
          {
            msg: `Difficulty (${newOrder.length})`,
            lvl: DebugLevel.DEBUG,
          },
        ]);

        break;
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredTerms, metadata.current);

        let newN = 0;
        let oldDt = NaN;
        const views = newOrder.map((i) => {
          const d = metadata.current[filteredTerms[i].uid]?.lastView;
          newN = !d ? newN + 1 : newN;
          oldDt = d && Number.isNaN(oldDt) ? daysSince(d) : oldDt;
          return d ? daysSince(d) : 0;
        });

        setLog((l) => [
          ...l,
          {
            msg: `Date Viewed (${views.length}) New:${newN} Old:${oldDt}d`,
            lvl: DebugLevel.DEBUG,
          },
        ]);

        break;
      case TermSortBy.RECALL:
        const {
          failed,
          overdue,
          notPlayed: nonPending,
          todayDone,
        } = spaceRepetitionOrder(filteredTerms, metadata.current);

        const pending = [...failed, ...overdue];
        if (pending.length > 0) {
          newOrder = pending;
        } else {
          newOrder = [...nonPending, ...todayDone];
        }
        recallGame = pending.length;

        break;

      default:
        /*TermSortBy.RANDOM*/ newOrder = randomOrder(filteredTerms);
        setLog((l) => [
          ...l,
          { msg: `Random (${newOrder.length})`, lvl: DebugLevel.DEBUG },
        ]);

        break;
    }

    return { order: newOrder, recallGame };
  }, [sortMethodREF, filteredTerms]);

  const gotoNext = useCallback(() => {
    const l = filteredTerms.length;
    const newSel = (selectedIndex + 1) % l;

    setSelectedIndex(newSel);
    prevSelectedIndex.current = selectedIndex;
    prevLastNext.current = lastNext;
    setLastNext(Date.now());

    setReinforcedUID(null);
  }, [filteredTerms, selectedIndex, lastNext]);

  const gotoNextSlide = useCallback(() => {
    let filtered = filteredTerms;
    // include frequency terms outside of filtered set
    if (reinforceREF.current && filterTypeREF.current === TermFilterBy.TAGS) {
      const allFrequency = Object.keys(repetition).reduce<string[]>(
        (acc, cur) => {
          if (repetition[cur]?.rein === true) {
            acc = [...acc, cur];
          }
          return acc;
        },
        []
      );

      const additional = kanjiList.filter((k) => allFrequency.includes(k.uid));
      filtered = [...filteredTerms, ...additional];
    }

    play(
      reinforceREF.current,
      filterTypeREF.current,
      frequency,
      // filteredTerms,
      filtered,
      repetition, //metadata,
      reinforcedUID,
      (uid) => {
        prevReinforcedUID.current = reinforcedUID;
        setReinforcedUID(uid);
      },
      gotoNext
    );
  }, [
    gotoNext,

    kanjiList,
    filteredTerms,
    frequency,
    reinforcedUID,
    repetition,

    reinforceREF,
    filterTypeREF,
  ]);

  const gotoPrev = useCallback(() => {
    const l = filteredTerms.length;
    const i = selectedIndex - 1;

    let newSel = i < 0 ? (l + i) % l : i % l;

    setSelectedIndex(newSel);
    prevSelectedIndex.current = selectedIndex;
    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    setReinforcedUID(null);
  }, [filteredTerms, selectedIndex, lastNext]);

  const swipeActionHandler = useCallback(
    (direction: string) => {
      // this.props.logger("swiped " + direction, 3);

      if (direction === "left") {
        gotoNextSlide();
      } else if (direction === "right") {
        gotoPrev();
      } else {
        setShowOn(true);
        setShowKun(true);
        setShowEx(true);
        setShowMeaning(true);

        if (direction === "up") {
          // up
          // kun
        } else if (direction === "down") {
          // down
          // on
        }
      }

      return Promise.resolve(/** interrupt, fetch */);
    },
    [gotoNextSlide, gotoPrev]
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(swipeActionHandler);

  const w = useWindowSize();
  const xPad = (w.width && w.height ? w.width > w.height : true) ? 0 : 70;
  const halfWidth = w.width ? w.width / 2 : 0;

  const yOffset = 0; // horizontal alignment spacing
  const xOffset = 0 - halfWidth + xPad; // vertical spacing between tooltip and element
  const { x, y, strategy, refs, update } = useFloating({
    placement: "bottom",
    middleware: [offset({ mainAxis: yOffset, crossAxis: xOffset }), shift()],
  });

  useEffect(() => {
    // force a recalculate on
    // window resize
    update();
  }, [update, w.height, w.width]);

  useLayoutEffect(() => {
    const prevState = {
      selectedIndex: prevSelectedIndex.current,
      reinforcedUID: prevReinforcedUID.current,
      lastNext: prevLastNext.current,
    };

    if (
      reinforcedUID !== prevState.reinforcedUID ||
      selectedIndex !== prevState.selectedIndex
    ) {
      const uid =
        prevState.reinforcedUID ??
        getTermUID(prevState.selectedIndex, filteredTerms, order);

      const k = getTerm(uid, filteredTerms);

      let spaceRepUpdated;
      if (
        metadata.current[uid]?.difficultyP &&
        accuracyModifiedRef.current
        // typeof accuracyModifiedRef.current === 'number' &&
        // accuracyModifiedRef.current > 0
      ) {
        // when difficulty exists and accuracyP has been set
        spaceRepUpdated = dispatch(
          setSpaceRepetitionMetadata({ uid })
        ).unwrap();
      } else if (accuracyModifiedRef.current === null) {
        // when accuracyP is nulled
        spaceRepUpdated = dispatch(removeFromSpaceRepetition({ uid }))
          .unwrap()
          .then(() => {
            /** results not needed */
          });
      } else {
        spaceRepUpdated = Promise.resolve();
      }

      if (recallGame > 0 && selectedIndex === recallGame + 1) {
        // just finished recall game
        dispatch(logger("No more pending items", DebugLevel.DEBUG));
      }

      void spaceRepUpdated.then((payload) => {
        if (payload && "newValue" in payload && "oldValue" in payload) {
          const { newValue, oldValue } = payload;
          const meta = newValue[uid];
          const oldMeta = oldValue[uid];

          recallDebugLogHelper(dispatch, meta, oldMeta, k.english);
        }

        // after space rep updates

        // prevent updates when quick scrolling
        if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
          // don't increment reinforced terms
          const shouldIncrement = uid !== prevState.reinforcedUID;
          const frequency = prevState.reinforcedUID !== null;

          void dispatch(updateSpaceRepKanji({ uid, shouldIncrement }))
            .unwrap()
            .then((payload) => {
              const { value, prevVal } = payload;

              let prevDate;
              if (accuracyModifiedRef.current && prevVal.lastReview) {
                // if term was reviewed
                prevDate = prevVal.lastReview;
              } else {
                prevDate = prevVal.lastView ?? value.lastView;
              }

              const repStats = { [uid]: { ...value, lastView: prevDate } };
              const messageLog = (m: string, l: number) =>
                dispatch(logger(m, l));

              spaceRepLog(messageLog, k, repStats, { frequency });
            });
        }
      });

      prevSelectedIndex.current = selectedIndex;
      prevReinforcedUID.current = reinforcedUID;
      accuracyModifiedRef.current = undefined;

      setShowOn(false);
      setShowKun(false);
      setShowEx(false);
      setShowMeaning(false);
    }
  }, [
    dispatch,
    vocabList,
    reinforcedUID,
    selectedIndex,
    filteredTerms,
    order,
    recallGame,
  ]);

  // Logger messages
  useEffect(() => {
    log.forEach((message) => {
      dispatch(logger(message.msg, message.lvl));
    });
  }, [dispatch, log]);

  if (recallGame === 0)
    return <NotReady addlStyle="main-panel" text="No pending items" />;
  if (order.length < 1) return <NotReady addlStyle="main-panel" />;

  const uid = reinforcedUID ?? getTermUID(selectedIndex, filteredTerms, order);
  const term = getTerm(uid, kanjiList);

  const match = vocabList.filter(
    (v) =>
      (JapaneseText.parse(v).getSpelling().includes(term.kanji) &&
        v.english.toLowerCase() === term.english.toLowerCase()) ||
      (JapaneseText.parse(v).getSpelling().includes(term.kanji) &&
        v.english.toLowerCase().includes(term.english.toLowerCase()) &&
        v.grp === "Verb") ||
      (JapaneseText.parse(v).getSpelling() === term.kanji &&
        (v.english.toLowerCase().includes(term.english.toLowerCase()) ||
          term.english.toLowerCase().includes(v.english.toLowerCase())))
  );

  let examples: RawVocabulary[] = [];
  if (match.length > 0) {
    const [first, ...theRest] = orderBy(match, (ex) => ex.english.length);
    examples = [first, ...shuffleArray(theRest)];
  }

  // console.log(
  //   JSON.stringify({
  //     rein: (reinforcedUID && reinforcedUID.slice(0, 6)) || "",
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     k: kanjiList.length,
  //     v: vocabList.length,
  //     ord: order.length,
  //     rep: Object.keys(repetition).length,
  //     fre: frequency.length,
  //     filt: filteredTerms.length,
  //   })
  // );

  const aGroupLevel =
    term.tags.find(
      (t) => activeTags.includes(t) && isGroupLevel(t) && term.grp !== t
    ) ??
    term.tags.find((t) => isGroupLevel(t) && term.grp !== t) ??
    "";

  const term_reinforce = repetition[term.uid]?.rein === true;

  const maxShowEx = 3;
  const calcExamples = examples.slice(0, maxShowEx).map((el, k, arr) => (
    <React.Fragment key={el.uid}>
      {el.english + " "}
      {JapaneseText.parse(el).toHTML()}
      {k < arr.length - 1 ? "; " : ""}
      <wbr />
    </React.Fragment>
  ));

  const meaning = <span>{term.english}</span>;

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;
  const wasReviewed = metadata.current[uid]?.lastReview;
  const reviewedToday =
    wasReviewed !== undefined && daysSince(wasReviewed) === 0;
  const wasViewed = metadata.current[uid]?.lastView;
  const viewedToday = wasViewed !== undefined && daysSince(wasViewed) === 0;
  /** Item reviewed in current game */
  const alreadyReviewed = recallGame > 0 && viewedToday;

  const revNotification = recallNotificationHelper(
    metadata.current[uid]?.daysBetweenReviews,
    metadata.current[uid]?.lastReview
  );

  let page = (
    <React.Fragment>
      <div
        className={classNames({
          "kanji main-panel h-100": true,
          "disabled-color": alreadyReviewed,
        })}
      >
        <div ref={refs.setReference} />
        <div
          ref={refs.setFloating}
          style={{
            //  height: "200px",
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            width: "max-content",
          }}
          className="grp-info"
        >
          <div>
            <div>{term.grp}</div>
            <div>{aGroupLevel}</div>
          </div>
        </div>
        <div
          ref={HTMLDivElementSwipeRef}
          className="d-flex justify-content-between h-100"
        >
          <StackNavButton ariaLabel="Previous" action={gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          <div className="d-flex flex-column justify-content-around text-center">
            <span className="fs-1 pt-0">
              <span>{term.kanji}</span>
            </span>
            {(term.on && (
              <span
                className="fs-4 pt-0"
                onClick={setStateFunction(setShowOn, (toggle) => !toggle)}
              >
                <span>{showOn ? term.on : "[On]"}</span>
              </span>
            )) || <span className="fs-4 pt-0">.</span>}
            {(term.kun && (
              <span
                className="fs-4 pt-2"
                onClick={setStateFunction(setShowKun, (toggle) => !toggle)}
              >
                <span>{showKun ? term.kun : "[Kun]"}</span>
              </span>
            )) || <span className="fs-4 pt-2 mb-0">.</span>}
            <div className="d-flex flex-column">
              <span
                className={classNames({
                  "example-blk align-self-center clickable h6 pt-2": true,
                  "disabled-color": calcExamples.length === 0,
                })}
                onClick={setStateFunction(setShowEx, (toggle) => !toggle)}
              >
                <span className="text-nowrap">
                  {showEx && calcExamples.length > 0
                    ? calcExamples
                    : "[Examples]"}
                </span>
              </span>

              <span
                className="fs-4 align-self-center pt-2 clickable"
                onClick={setStateFunction(setShowMeaning, (toggle) => !toggle)}
              >
                {showMeaning ? meaning : <span>{"[Meaning]"}</span>}
              </span>
            </div>
          </div>
          {/* <div className="right-info"></div> */}

          <StackNavButton ariaLabel="Next" action={gotoNextSlide}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>
      <div
        className={classNames({
          "options-bar mb-3 flex-shrink-1": true,
          "disabled-color": !cookies || alreadyReviewed,
        })}
      >
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start"></div>
          </div>
          <div className="col">
            <div className="d-flex justify-content-end pe-2 pe-sm-0">
              <Tooltip
                className={classNames({
                  "question-color opacity-50":
                    sortMethodREF.current === TermSortBy.RECALL &&
                    !reviewedToday,
                  "done-color opacity-50": reviewedToday,
                })}
                disabled={!cookies}
                idKey={uid}
                notification={revNotification}
              >
                <DifficultySlider
                  difficulty={metadata.current[uid]?.difficultyP}
                  onChange={(difficulty: number | null) => {
                    dispatch(setKanjiDifficulty(uid, difficulty));
                  }}
                  resetOn={uid}
                />
                <AccuracySlider
                  accuracy={metadata.current[uid]?.accuracyP}
                  resetOn={uid}
                  onChange={(accuracy: number | null) => {
                    if (accuracy !== undefined) {
                      dispatch(setKanjiAccuracy(uid, accuracy));
                      accuracyModifiedRef.current = accuracy;
                    }
                  }}
                />
                <div className="fs-xx-small me-2">
                  <RecallIntervalPreviewInfo metadata={metadata.current[uid]} />
                </div>
              </Tooltip>
              <ToggleFrequencyTermBtnMemo
                disabled={!cookies}
                addFrequencyTerm={addFrequencyTerm}
                removeFrequencyTerm={removeFrequencyTerm}
                hasReinforce={term_reinforce}
                term={term}
                count={frequency.length}
                isReinforced={reinforcedUID !== null}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className={classNames({
          "progress-line flex-shrink-1": true,
          "disabled-color": alreadyReviewed,
        })}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          color={term_reinforce ? "secondary" : "primary"}
        />
      </div>
    </React.Fragment>
  );

  return page;
}

export { KanjiMeta };
