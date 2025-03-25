import { LinearProgress } from "@mui/material";
import { TrashIcon } from "@primer/octicons-react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import md5 from "md5";
import type { RawKanji, RawVocabulary } from "nmemonica";
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
import {
  type ConsoleMessage,
  DebugLevel,
  daysSince,
  spaceRepLog,
  wasToday,
} from "../../helper/consoleHelper";
import { recallSortLogSummary } from "../../helper/consoleSummaryHelper";
import { setStateFunction } from "../../helper/eventHandlerHelper";
import {
  getPendingReduceFiltered,
  getTerm,
  getTermUID,
  minimumTimeForSpaceRepUpdate,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { isKatakana } from "../../helper/kanaHelper";
import {
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
import { SwipeDirection } from "../../helper/TouchSwipe";
import { useBlast } from "../../hooks/useBlast";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { updateDailyGoal, useGoalProgress } from "../../hooks/useGoalProgress";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useWindowSize } from "../../hooks/useWindowSize";
import type { AppDispatch, RootState } from "../../slices";
import { logger } from "../../slices/globalSlice";
import {
  deleteMetaKanji,
  getKanji,
  removeFromSpaceRepetition,
  setKanjiAccuracy,
  setKanjiDifficulty,
  setSpaceRepetitionMetadata,
  updateSpaceRepKanji,
} from "../../slices/kanjiSlice";
import {
  TermFilterBy,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import DialogMsg from "../Dialog/DialogMsg";
import { GoalResumeMessage } from "../Form/GoalResumeMessage";
import { NotReady } from "../Form/NotReady";
import { RecallIntervalPreviewInfo } from "../Form/RecallIntervalPreviewInfo";
import { Tooltip } from "../Form/Tooltip";
import { oneFromList, splitToList } from "../Games/KanjiGame";
import { AccuracySlider } from "../Input/AccuracySlider";
import ClickNavBtn from "../Input/ClickNavBtn";
import { DifficultySlider } from "../Input/DifficultySlider";

const KanjiMeta = {
  location: "/kanji/",
  label: "Kanji",
};

/** Pronunciations are comma delimited (Japanese) */
const KanjiPronComma = "、";

/**
 * Finds a kanji in a list of terms. Filtering terms by strongest match.
 * @param term
 * @param vocabList
 */
function getKanjiExamples(term: RawKanji, vocabList: RawVocabulary[]) {
  let examples: RawVocabulary[] = [];

  // Radicals that are just katakana don't need examples;
  if (isKatakana(term.kanji) && term.tags.includes("Radical")) {
    return [];
  }

  // exact
  examples = vocabList.filter((v) => {
    const spelling = JapaneseText.parse(v).getSpelling();
    return (
      spelling.includes(term.kanji) &&
      v.english.toLowerCase() === term.english.toLowerCase()
    );
  });

  // exact or verb
  examples =
    examples.length > 0
      ? examples
      : vocabList.filter((v) => {
          const spelling = JapaneseText.parse(v).getSpelling();
          return (
            spelling.includes(term.kanji) &&
            v.english.toLowerCase().includes(term.english.toLowerCase()) &&
            v.grp === "Verb"
          );
        });

  // exact or similar
  examples =
    examples.length > 0
      ? examples
      : vocabList.filter((v) => {
          const spelling = JapaneseText.parse(v).getSpelling();
          return (
            spelling.includes(term.kanji) &&
            (v.english.toLowerCase().includes(term.english.toLowerCase()) ||
              term.english.toLowerCase().includes(v.english.toLowerCase()))
          );
        });

  // any matching
  examples =
    examples.length > 0
      ? examples
      : vocabList.filter((v) => {
          const spelling = JapaneseText.parse(v).getSpelling();
          return spelling.includes(term.kanji);
        });

  /** Filter example list above this */
  const EX_LIST_LEN_MAX = 2;
  /** Filter item with length exceeding this */
  const EX_EL_LEN_MAX = 10;
  /** Filter item with word length exceeding this */
  const EX_EL_WORDS_MAX = 3;
  let remainingEl = examples.length;

  examples =
    examples.length <= EX_LIST_LEN_MAX
      ? examples
      : examples.filter((ex) => {
          if (
            // english too many words
            (ex.english.split(" ").length <= EX_EL_WORDS_MAX &&
              // english too many characters
              ex.english.length <= EX_EL_LEN_MAX) ||
            // prevent discarding everything
            remainingEl <= EX_LIST_LEN_MAX
          ) {
            return true;
          } else {
            remainingEl -= 1;
          }

          return false;
        });

  return examples;
}

/**
 * Comparison info for:
 *
 * a **Radical with examples**
 *      or
 * a **Kanji with similar other kanjis**
 */
function buildCompareInformation(term: RawKanji) {
  let compareColHeader = "Similar";
  let comparePopTitle = "These Kanji look alike";
  let comparePopAriaLabel = "Kanji Similarity Information";
  let compareKanji = term.similarKanji;
  if (
    term.similarKanji.length === 0 &&
    term.radical !== undefined &&
    term.radical.example.length > 0
  ) {
    compareColHeader = "w/ Radical";
    comparePopTitle = "The Radical appears in";
    comparePopAriaLabel = "Radical examples";
    compareKanji = term.radical.example.map((k) => md5(k));
  }

  return {
    compareColHeader,
    comparePopTitle,
    comparePopAriaLabel,
    compareKanji,
  };
}

export default function Kanji() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies, debug } = useSelector(({ global }: RootState) => global);
  const debugREF = useRef(debug);

  const {
    kanjiList,

    filterType: filterTypeREF,
    difficultyThreshold,
    activeTags,
    sortMethod,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,

    repetition,
    viewGoal,
  } = useConnectKanji();

  // after recall complete
  // resume with alternate sorting
  const [resumeSort, setResumeSort] = useState<number>(-1);
  /** Alternate sort upon ending recall */
  const sort = useMemo(() => {
    return resumeSort === -1 ? sortMethod : resumeSort;
  }, [resumeSort, sortMethod]);

  const repMinItemReviewREF = useRef(spaRepMaxReviewItem);
  const difficultyThresholdREF = useRef(difficultyThreshold);

  const { vocabList } = useConnectVocabulary();

  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  const { goalPendingREF, progressBarColor, goalProgress, setGoalProgress } =
    useGoalProgress(viewGoal, metadata);

  const populateDataSetsRef = useRef(() => {
    if (vocabList.length === 0) {
      void dispatch(getVocabulary());
    }

    if (kanjiList.length === 0) {
      void dispatch(getKanji());
    }
  });

  // after initial render
  useEffect(() => {
    const { current: populateDataSets } = populateDataSetsRef;
    populateDataSets();
  }, []);

  const { blastElRef, text, setText } = useBlast({
    top: 10,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef<number>(Date.now());

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const [showOn, setShowOn] = useState(false);
  const [showEx, setShowEx] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  const [log, setLog] = useState<ConsoleMessage[]>([]);
  /** Is not undefined after user modifies accuracyP value */
  const accuracyModifiedRef = useRef<number | null>(undefined);
  const [compare, setCompare] = useState<RawKanji | undefined>(undefined);
  const closeCompare = useCallback(() => {
    setCompare(undefined);
  }, []);

  const { filteredTerms, recallGame } = useMemo(
    function filterMemo() {
      if (kanjiList.length === 0) return { filteredTerms: [], recallGame: -1 };
      if (Object.keys(metadata.current).length === 0 && activeTags.length === 0)
        return { filteredTerms: kanjiList, recallGame: -1 };

      let recallGame = -1;
      let filtered = termFilterByType(
        filterTypeREF.current,
        kanjiList,
        filterTypeREF.current === TermFilterBy.TAGS ? activeTags : []
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

      switch (sort) {
        case TermSortBy.RECALL:
          // discard the nonPending terms
          const {
            failed,
            overdue,
            overLimit: leftOver,
            notPlayed,
            todayDone,
          } = spaceRepetitionOrder(
            filtered,
            metadata.current,
            repMinItemReviewREF.current
          );

          const {
            pending,
            reducedFiltered,
            recallGame: rGame,
          } = getPendingReduceFiltered(
            leftOver,
            failed,
            overdue,
            notPlayed,
            todayDone,
            filtered
          );
          filtered = reducedFiltered;
          recallGame = rGame;

          if (debugREF.current > DebugLevel.WARN) {
            const overLimit = leftOver.length === 1 ? [] : leftOver;
            recallSortLogSummary(
              pending,
              metadata,
              filtered,
              overLimit,
              setLog,
              sort
            );
          }

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

      return { filteredTerms: filtered, recallGame };
    },
    [
      filterTypeREF,
      difficultyThresholdREF,
      sort,
      kanjiList,
      activeTags,
      includeNew,
      includeReviewed,
    ]
  );

  const order = useMemo(
    function orderMemo() {
      if (filteredTerms.length === 0) return [];

      let newOrder: number[];
      switch (sort) {
        case TermSortBy.DIFFICULTY:
          newOrder = difficultyOrder(filteredTerms, metadata.current);
          setLog((l) => [
            ...l,
            {
              msg: `${TermSortByLabel[sort]} (${newOrder.length})`,
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
            newN = d === undefined ? newN + 1 : newN;
            oldDt =
              d !== undefined && Number.isNaN(oldDt) ? daysSince(d) : oldDt;
            return d !== undefined ? daysSince(d) : 0;
          });

          setLog((l) => [
            ...l,
            {
              msg: `${TermSortByLabel[sort]} (${views.length}) New:${newN} Old:${oldDt}d`,
              lvl: DebugLevel.DEBUG,
            },
          ]);

          break;
        case TermSortBy.RECALL:
          newOrder = filteredTerms.map((_k, i) => i);
          break;

        default:
          /*TermSortBy.RANDOM*/ newOrder = randomOrder(filteredTerms);
          setLog((l) => [
            ...l,
            {
              msg: `${TermSortByLabel[sort]} (${newOrder.length})`,
              lvl: DebugLevel.DEBUG,
            },
          ]);

          break;
      }

      return newOrder;
    },
    [sort, filteredTerms]
  );

  const gotoNext = useCallback(() => {
    const l = filteredTerms.length;
    const newSel = (selectedIndex + 1) % l;

    setSelectedIndex(newSel);
    prevSelectedIndex.current = selectedIndex;
    prevLastNext.current = lastNext;
    setLastNext(Date.now());

    setReinforcedUID(null);
  }, [filteredTerms, selectedIndex, lastNext]);

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
    (direction: SwipeDirection) => {
      // this.props.logger("swiped " + direction, 3);

      if (direction === "left") {
        gotoNext();
      } else if (direction === "right") {
        gotoPrev();
      } else {
        setShowOn(true);
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
    [gotoNext, gotoPrev]
  );

  useKeyboardActions(
    swipeActionHandler,
    () => {
      /** no English/Japanse flipping */
    }
    // timedPlayAnswerHandlerWrapper
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(swipeActionHandler);

  const wSize = useWindowSize();
  const [{ xOffset, yOffset }, setScreenOffset] = useState({
    xOffset: 0,
    yOffset: 0,
  });

  useEffect(() => {
    // force a recalculate on
    // window resize
    if (wSize.width !== undefined && wSize.height !== undefined) {
      const halfWidth = wSize.width / 2;
      const yOffset = wSize.height - 55; //   horizontal alignment spacing
      const xOffset = halfWidth; //           vertical spacing

      setScreenOffset({ xOffset, yOffset });
    }
  }, [wSize.height, wSize.width]);

  useLayoutEffect(() => {
    const prevState = {
      selectedIndex: prevSelectedIndex.current,
      reinforcedUID: prevReinforcedUID.current,
      lastNext: prevLastNext.current,
    };

    // prevent entering the if when
    // other dep change triggers useEffect
    prevLastNext.current = lastNext;

    if (
      reinforcedUID !== prevState.reinforcedUID ||
      selectedIndex !== prevState.selectedIndex ||
      lastNext !== prevState.lastNext
    ) {
      const uid =
        prevState.reinforcedUID ??
        getTermUID(prevState.selectedIndex, filteredTerms, order);

      const k = getTerm(uid, filteredTerms);

      updateDailyGoal({
        viewGoal,
        msg: "Kanji Goal Reached!",
        lastView: metadata.current[uid]?.lastView,
        selectedIndex,
        prevSelectedIndex: prevState.selectedIndex,
        prevTimestamp: prevState.lastNext,
        progressTotal: filteredTerms.length,
        goalPending: goalPendingREF,
        setGoalProgress,
        setText,
      });

      let spaceRepUpdated;
      if (
        metadata.current[uid]?.difficultyP !== undefined &&
        typeof accuracyModifiedRef.current === "number"
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

          void dispatch(updateSpaceRepKanji({ uid, shouldIncrement }))
            .unwrap()
            .then((payload) => {
              const { value, prevVal } = payload;

              let prevDate;
              if (
                typeof accuracyModifiedRef.current === "number" &&
                prevVal.lastReview !== undefined
              ) {
                // if term was reviewed
                prevDate = prevVal.lastReview;
              } else {
                prevDate = prevVal.lastView ?? value.lastView;
              }

              const repStats = { [uid]: { ...value, lastView: prevDate } };
              const messageLog = (
                m: ConsoleMessage["msg"],
                l: ConsoleMessage["lvl"]
              ) => dispatch(logger(m, l));

              spaceRepLog(messageLog, k, repStats);
            });
        }
      });

      prevSelectedIndex.current = selectedIndex;
      prevReinforcedUID.current = reinforcedUID;
      accuracyModifiedRef.current = undefined;

      setShowOn(false);
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
    setText,
    viewGoal,
    lastNext,

    goalPendingREF,
    setGoalProgress,
  ]);

  // Logger messages
  useEffect(() => {
    log.forEach((message) => {
      dispatch(logger(message.msg, message.lvl));
    });
  }, [dispatch, log]);

  const ex = useRef<{ el: RawVocabulary; en: string; jp: React.ReactNode }[]>(
    []
  );
  const prevUid = useRef<string | null>(undefined);

  if (recallGame === 0) {
    return (
      <GoalResumeMessage
        goal="Kanji"
        setResumeSort={setResumeSort}
        allowed={[
          TermSortBy.VIEW_DATE,
          TermSortBy.DIFFICULTY,
          TermSortBy.RANDOM,
        ]}
      />
    );
  }

  if (order.length < 1) return <NotReady addlStyle="main-panel" />;

  const uid = reinforcedUID ?? getTermUID(selectedIndex, filteredTerms, order);
  const term = getTerm(uid, kanjiList);

  const {
    compareColHeader,
    comparePopTitle,
    comparePopAriaLabel,
    compareKanji,
  } = buildCompareInformation(term);

  if (prevUid.current !== uid && vocabList.length > 0) {
    const match = getKanjiExamples(term, vocabList);
    prevUid.current = uid;
    if (match.length > 0) {
      const [first, ...theRest] = orderBy(match, (ex) => ex.japanese.length);
      const examples = [first, ...shuffleArray(theRest)];

      const maxShowEx = 5;
      ex.current = examples.slice(0, maxShowEx).map((el) => ({
        el,
        en: oneFromList(el.english),
        jp: JapaneseText.parse(el).toHTML(),
      }));
    } else {
      ex.current = [];
    }
  }

  // console.log(
  //   JSON.stringify({
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     k: kanjiList.length,
  //     v: vocabList.length,
  //     ord: order.length,
  //     rep: Object.keys(repetition).length,
  //     filt: filteredTerms.length,
  //   })
  // );

  const aGroupLevel =
    term.tags.find((t) => activeTags.includes(t) && isGroupLevel(t)) ??
    term.tags.find((t) => isGroupLevel(t)) ??
    null;
  const grp =
    aGroupLevel !== null
      ? (term.tags.find((t) => t !== aGroupLevel) ?? null)
      : term.tags.length > 0
        ? term.tags[0]
        : null;

  const examplesEl = ex.current.map(({ el, en, jp }) => (
    <div
      key={el.uid}
      className={classNames({
        "d-flex justify-content-between": true,
        invisible: !showEx,
      })}
    >
      <div className="fs-3 mw-50 text-nowrap text-start">{jp}</div>
      <div className="pt-2 text-break text-end">{en}</div>
    </div>
    // <React.Fragment key={el.uid}>
    //   {el.english + " "}
    //   {JapaneseText.parse(el).toHTML()}
    //   {k < arr.length - 1 ? "; " : ""}
    //   <wbr />
    // </React.Fragment>
  ));

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;
  const reviewedToday = wasToday(metadata.current[uid]?.lastReview);
  const viewedToday = wasToday(metadata.current[uid]?.lastView);
  /** Item reviewed in current game */
  const alreadyReviewed = recallGame > 0 && viewedToday;

  const revNotification = recallNotificationHelper(
    metadata.current[uid]?.daysBetweenReviews,
    metadata.current[uid]?.lastReview
  );

  return (
    <React.Fragment>
      <div
        className={classNames({
          "kanji main-panel h-100": true,
          "disabled-color": alreadyReviewed,
        })}
      >
        <div
          style={{
            position: "absolute",
            top: yOffset,
            left: xOffset,
            width: "max-content",
          }}
        >
          <div className="translate-center-x">
            <div className="text-nowrap">{grp}</div>
            <div>{aGroupLevel}</div>
          </div>
        </div>
        <div
          ref={blastElRef}
          className="text-nowrap fs-display-6 correct-color"
        >
          {text}
        </div>
        <DialogMsg
          open={compare !== undefined}
          onClose={closeCompare}
          title={comparePopTitle}
          ariaLabel={comparePopAriaLabel}
        >
          <div className="row row-cols-1 row-cols-sm-2 h-100 text-center">
            <div className="col d-flex flex-column">
              <span className="fs-kanji-huge lh-1">{term.kanji}</span>
              <span>{term.english}</span>
            </div>
            <div className="col d-flex flex-column">
              <span className="fs-kanji-huge lh-1 opacity-25">
                {compare?.kanji}
              </span>
              <span>{compare?.english}</span>
            </div>
          </div>
        </DialogMsg>
        <div
          ref={HTMLDivElementSwipeRef}
          className="d-flex justify-content-between h-100"
        >
          <ClickNavBtn direction="previous" action={gotoPrev} />
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2 h-100">
              <div
                className={classNames({
                  "col question d-flex flex-column justify-content-top text-center":
                    true,
                })}
              >
                <div className="d-flex ">
                  <div className="d-flex flex-column w-100">
                    {term.pronounce !== undefined ? (
                      <div
                        style={{ minHeight: "66px" }}
                        className="pronunciation fs-5 p-0 d-flex flex-wrap align-items-end justify-content-center clickable"
                        onClick={setStateFunction(
                          setShowOn,
                          (toggle) => !toggle
                        )}
                      >
                        {showOn ? (
                          term.pronounce
                            .split(KanjiPronComma)
                            .flatMap((p, i, { length }) => [
                              <span
                                key={`item-${p}`}
                                className={classNames({
                                  "text-nowrap": true,
                                  "fs-6": length > 3,
                                })}
                              >
                                {p}
                              </span>,
                              i !== length - 1 ? (
                                <span key={`comma-${p}`}>{KanjiPronComma}</span>
                              ) : (
                                [
                                  /** no comma after last item */
                                ]
                              ),
                              <wbr key={`wbr-${p}`} />,
                            ])
                        ) : (
                          <span>{"[Pronounce]"}</span>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{ minHeight: "68px" }}
                        className="fs-4 pt-0 invisible"
                      >
                        .
                      </div>
                    )}

                    <div className="row">
                      <div className="col p-0 similar-k d-flex flex-column">
                        {compareKanji.length > 0 && (
                          <span className="pt-1 fs-xx-small">
                            {compareColHeader}
                          </span>
                        )}
                        {compareKanji.map((k) => (
                          <div
                            key={`${k}`}
                            className="clickable pt-2 fs-4"
                            onClick={() => {
                              const similar = kanjiList.find(
                                (x) => x.uid === k
                              );
                              if (similar !== undefined) {
                                setCompare(similar);
                              }
                            }}
                          >
                            {kanjiList.find((x) => x.uid === k)?.kanji}
                          </div>
                        ))}
                      </div>
                      <div className="col p-0 fs-kanji-huge lh-1 opacity-25">
                        {term.kanji}
                      </div>

                      <div
                        className={classNames({
                          "col p-0 phonetic-radical d-flex flex-column justify-content-center":
                            true,
                          invisible:
                            term.phoneticKanji?.p === undefined ||
                            term.phoneticKanji.p === term.kanji,
                        })}
                      >
                        <span className="fs-xx-small">Radical</span>
                        <span className="fs-4">
                          {term.phoneticKanji?.k ?? ""}
                        </span>
                        <span className="pt-2 fs-xx-small">Sound</span>
                        {term.phoneticKanji?.p
                          .split(KanjiPronComma)
                          .map((p, i, { length }) => (
                            <span
                              key={`item-${p}`}
                              className="text-nowrap fs-4"
                            >
                              {`${p}${i !== length - 1 ? KanjiPronComma : ""}`}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="lh-1 align-self-center clickable"
                  onClick={setStateFunction(
                    setShowMeaning,
                    (toggle) => !toggle
                  )}
                >
                  {showMeaning ? (
                    splitToList(term.english).map((el, i, { length }) => (
                      <span
                        key={el}
                        className={classNames({
                          "fs-2": i === 0,
                          "fs-6 fw-light": i > 0,
                        })}
                      >
                        {i === 1 ? <br /> : null}
                        {i > 1 ? <span>{", "}</span> : null}
                        <span
                          className={classNames({ "text-nowrap": i === 0 })}
                        >
                          {el}
                        </span>
                        {i === 0 && length > 1 ? (
                          <span className="fs-6">,</span>
                        ) : null}
                      </span>
                    ))
                  ) : (
                    <span className="fs-4">[Meaning]</span>
                  )}
                </div>
              </div>
              <div className="col choices d-flex flex-column justify-content-around text-center">
                <div className="d-flex flex-column fs-4">{examplesEl}</div>
              </div>
            </div>
          </div>
          <ClickNavBtn direction="next" action={gotoNext} />
        </div>
      </div>
      <div
        className={classNames({
          "options-bar mb-3 flex-shrink-1": true,
          "disabled-color": !cookies,
        })}
      >
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start"></div>
          </div>
          <div className="col">
            <div className="d-flex justify-content-end pe-2 pe-sm-0">
              <Tooltip
                reviewed={alreadyReviewed}
                className={classNames({
                  "question-color":
                    sort === TermSortBy.RECALL && !reviewedToday,
                  "done-color": reviewedToday,
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
                <div className="h-100 d-flex flex-column justify-content-between me-2">
                  <div
                    className="clickable"
                    onClick={() => {
                      void dispatch(deleteMetaKanji([uid]));
                    }}
                  >
                    <TrashIcon />
                  </div>
                  <div className="d-flex flex-column"></div>
                </div>
              </Tooltip>
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
          // variant="determinate"
          // value={progress}
          variant={goalProgress === null ? "determinate" : "buffer"}
          value={goalProgress === null ? progress : 0}
          valueBuffer={goalProgress ?? undefined}
          color={progressBarColor}
        />
      </div>
    </React.Fragment>
  );
}

export { KanjiMeta };
