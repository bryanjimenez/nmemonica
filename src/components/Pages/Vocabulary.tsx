import { Avatar, Grow, LinearProgress } from "@mui/material";
import { amber } from "@mui/material/colors";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
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

import VerbMain from "./VerbMain";
import VocabularyMain from "./VocabularyMain";
import { pronounceEndoint } from "../../../environment.development";
import { daysSince, spaceRepLog, wasToday } from "../../helper/consoleHelper";
import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import {
  getCacheUID,
  getTerm,
  getTermUID,
  initGoalPending,
  minimumTimeForSpaceRepUpdate,
  minimumTimeForTimedPlay,
  play,
  termFilterByType,
  toggleFuriganaSettingHelper,
  updateDailyGoal,
} from "../../helper/gameHelper";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import { verbToTargetForm } from "../../helper/JapaneseVerb";
import { setMediaSessionPlaybackState } from "../../helper/mediaHelper";
import {
  getPercentOverdue,
  recallDebugLogHelper,
  recallNotificationHelper,
  spaceRepetitionOrder,
} from "../../helper/recallHelper";
import { SWRequestHeader } from "../../helper/serviceWorkerHelper";
import {
  alphaOrder,
  dateViewOrder,
  difficultyOrder,
  difficultySubFilter,
  randomOrder,
} from "../../helper/sortHelper";
import { addParam } from "../../helper/urlHelper";
import { useBlast } from "../../hooks/useBlast";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useTimedGame } from "../../hooks/useTimedGame";
import type { AppDispatch, RootState } from "../../slices";
import { fetchAudio } from "../../slices/audioHelper";
import { logger } from "../../slices/globalSlice";
import {
  DebugLevel,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import {
  addFrequencyWord,
  flipVocabularyPracticeSide,
  furiganaToggled,
  getVocabulary,
  removeFrequencyWord,
  removeFromSpaceRepetition,
  setSpaceRepetitionMetadata,
  setWordAccuracy,
  setWordDifficulty,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  updateSpaceRepWord,
} from "../../slices/vocabularySlice";
import { AccuracySlider } from "../Form/AccuracySlider";
import { ConsoleMessage } from "../Form/Console";
import { DifficultySlider } from "../Form/DifficultySlider";
import { GoalResumeMessage } from "../Form/GoalResumeMessage";
import { NotReady } from "../Form/NotReady";
import {
  ReCacheAudioBtn,
  ShowHintBtn,
  ToggleAutoVerbViewBtn,
  ToggleFrequencyTermBtnMemo,
  ToggleFuriganaBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { RecallIntervalPreviewInfo } from "../Form/RecallIntervalPreviewInfo";
import StackNavButton from "../Form/StackNavButton";
import { Tooltip } from "../Form/Tooltip";
import VocabularyOrderSlider from "../Form/VocabularyOrderSlider";
import type { BareIdx } from "../Form/VocabularyOrderSlider";

const VocabularyMeta = {
  location: "/vocabulary/",
  label: "Vocabulary",
};

export default function Vocabulary() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies } = useSelector(({ global }: RootState) => global);

  const [showPageMultiOrderScroller, setShowPageMultiOrderScroller] =
    useState(false);
  /** Alphabetic order quick scroll in progress */
  const isAlphaSortScrolling = useRef(false);

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef<number>(Date.now());
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [showHint, setShowHint] = useState<string | undefined>(undefined);

  const [frequency, setFrequency] = useState<string[]>([]); // subset of frequency words within current active group

  const [recacheAudio, setRecacheAudio] = useState(false);
  const naFlip = useRef();

  const [wasPlayed, setWasPlayed] = useState(false);

  const [scrollJOrder, setScrollJOrder] = useState(false);
  const [log, setLog] = useState<ConsoleMessage[]>([]);
  /** Is not undefined after user modifies accuracyP value */
  const accuracyModifiedRef = useRef<undefined | null | number>();

  const {
    motionThreshold,

    difficultyThreshold,

    vocabList,

    // Refs
    reinforce: reinforceREF,
    filterType: filterTypeREF,
    hintEnabled: hintEnabledREF,
    sortMethod: sortMethodREF,
    activeGroup,
    includeNew,
    includeReviewed,

    // modifiable during game
    autoVerbView,
    englishSideUp,
    verbForm,
    repetition,
    spaRepMaxReviewItem,

    viewGoal,
  } = useConnectVocabulary();

  // after recall complete
  // resume with alternate sorting
  const [resumeSort, setResumeSort] = useState<number>(-1);
  /** Alternate sort upon ending recall */
  const sort = useMemo(() => {
    return resumeSort === -1 ? sortMethodREF.current : resumeSort;
  }, [resumeSort, sortMethodREF]);

  const repMinItemReviewREF = useRef(spaRepMaxReviewItem);
  const difficultyThresholdREF = useRef(difficultyThreshold);

  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  /** Number of review items still pending (negative: goal already met)*/
  const goalPending = useRef<number>(-1);
  const [goalProgress, setGoalProgress] = useState<number | null>(null);

  useEffect(() => {
    if (vocabList.length === 0) {
      void dispatch(getVocabulary());
    }

    goalPending.current = initGoalPending(viewGoal, repetition);
  }, []);

  const { blastElRef, anchorElRef, text, setText } = useBlast({
    top: 10,
    fontWeight: "normal",
    fontSize: "xx-large",
    color: amber[500],
  });

  const { filteredVocab } = useMemo(() => {
    if (vocabList.length === 0) return { filteredVocab: [] };
    if (Object.keys(metadata.current).length === 0 && activeGroup.length === 0)
      return { filteredVocab: vocabList };

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
      vocabList,
      allFrequency,
      activeGroup,
      buildAction(dispatch, toggleVocabularyFilter)
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
          const daysSinceReview =
            lastReview !== undefined ? daysSince(lastReview) : undefined;
          const p = getPercentOverdue({
            accuracy: accuracyP,
            daysSinceReview,
            daysBetweenReviews,
          });

          return p.toFixed(2).replace(".00", "").replace("0.", ".");
        });
        // console.table(recallInfoTable(pending.map(i=>filteredVocab[i]) ,metadata.current));

        const more = overLimit.length > 0 ? `+${overLimit.length}` : "";

        setLog((l) => [
          ...l,
          {
            msg: `${TermSortByLabel[sort]} (${
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

    return { filteredVocab: filtered };
  }, [
    dispatch,
    filterTypeREF,
    sort,
    difficultyThresholdREF,
    vocabList,
    activeGroup,
    includeNew,
    includeReviewed,
  ]);

  const {
    newOrder: order,
    ebare,
    jbare,
    recallGame,
  } = useMemo(() => {
    if (filteredVocab.length === 0) return { newOrder: [], recallGame: -1 };

    let newOrder: number[] = [];
    let jOrder: undefined | { uid: string; label: string; idx: number }[];
    let eOrder: undefined | { uid: string; label: string; idx: number }[];
    let recallGame = -1;
    switch (sort) {
      case TermSortBy.RANDOM:
        newOrder = randomOrder(filteredVocab);
        setLog((l) => [
          ...l,
          {
            msg: `${TermSortByLabel[sort]} (${newOrder.length})`,
            lvl: DebugLevel.DEBUG,
          },
        ]);

        break;
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredVocab, metadata.current);

        let newN = 0;
        let oldDt = NaN;
        const views = newOrder.map((i) => {
          const d = metadata.current[filteredVocab[i].uid]?.lastView;
          newN = d === undefined ? newN + 1 : newN;
          oldDt = d !== undefined && Number.isNaN(oldDt) ? daysSince(d) : oldDt;
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

      case TermSortBy.DIFFICULTY:
        // exclude vocab with difficulty beyond difficultyThreshold

        newOrder = difficultyOrder(filteredVocab, metadata.current);
        setLog((l) => [
          ...l,
          {
            msg: `${TermSortByLabel[sort]} (${newOrder.length})`,
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
        } = spaceRepetitionOrder(filteredVocab, metadata.current);
        const pending = [...failed, ...overdue];

        if (pending.length > 0) {
          newOrder = pending;
        } else {
          newOrder = [...nonPending, ...todayDone];
        }
        recallGame = pending.length;

        break;

      default: //TermSortBy.ALPHABETIC:
        ({ order: newOrder, jOrder, eOrder } = alphaOrder(filteredVocab));

        setLog((l) => [
          ...l,
          {
            msg: `${TermSortByLabel[sort]} (${newOrder.length})`,
            lvl: DebugLevel.DEBUG,
          },
        ]);
        break;
    }

    // jbare, // bare min Japanese ordered word list
    // ebare, // bare min English ordered word list

    setScrollJOrder(true);

    return { newOrder, jbare: jOrder, ebare: eOrder, recallGame };
  }, [sort, filteredVocab]);

  // Logger messages
  useEffect(() => {
    log.forEach((message) => {
      dispatch(logger(message.msg, message.lvl));
    });
  }, [dispatch, log]);

  const gotoNext = useCallback(() => {
    const l = filteredVocab.length;
    let newSel = (selectedIndex + 1) % l;

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(null);
  }, [filteredVocab, selectedIndex, lastNext]);

  const gotoNextSlide = useCallback(() => {
    play(
      reinforceREF.current,
      filterTypeREF.current,
      frequency,
      filteredVocab,
      metadata.current,
      reinforcedUID,
      (value) => {
        prevReinforcedUID.current = reinforcedUID;
        setReinforcedUID(value);
      },
      gotoNext
    );
  }, [
    filterTypeREF,
    reinforceREF,
    frequency,
    filteredVocab,
    reinforcedUID,
    gotoNext,
  ]);

  const gotoPrev = useCallback(() => {
    const l = filteredVocab.length;
    const i = selectedIndex - 1;

    let newSel;
    if (reinforcedUID !== null) {
      newSel = selectedIndex;
    } else {
      newSel = (l + i) % l;
    }

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(null);
  }, [filteredVocab, selectedIndex, reinforcedUID, lastNext]);

  const gameActionHandler = useBuildGameActionsHandler(
    gotoNextSlide,
    gotoPrev,
    reinforcedUID,
    selectedIndex,
    vocabList,
    verbForm,
    order,
    filteredVocab,
    recacheAudio,
    naFlip,
    setWasPlayed,
    pronounceEndoint
  );

  const deviceMotionEvent = useDeviceMotionActions(motionThreshold);

  const {
    beginLoop,
    abortLoop,
    looperSwipe,

    loopSettingBtn,
    loopActionBtn,

    timedPlayAnswerHandlerWrapper,
    gradeTimedPlayEvent,
    resetTimedPlay,

    loop,
    tpAnswered: tpAnsweredREF,
    tpAnimation,
  } = useTimedGame(gameActionHandler, englishSideUp, deviceMotionEvent);

  useKeyboardActions(
    gameActionHandler,
    buildAction(dispatch, flipVocabularyPracticeSide),
    timedPlayAnswerHandlerWrapper
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(
    gameActionHandler,
    timedPlayAnswerHandlerWrapper
  );

  useMediaSession("Vocabulary Loop", loop, beginLoop, abortLoop, looperSwipe);

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
        getTermUID(prevState.selectedIndex, filteredVocab, order);

      const vocabulary = getTerm(uid, filteredVocab, vocabList);
      gradeTimedPlayEvent(dispatch, uid, metadata.current);

      updateDailyGoal({
        viewGoal,
        msg: "Vocabulary Goal Reached!",
        lastView: metadata.current[uid]?.lastView,
        selectedIndex,
        prevSelectedIndex: prevState.selectedIndex,
        prevTimestamp: prevState.lastNext,
        progressTotal: filteredVocab.length,
        goalPending,
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

          recallDebugLogHelper(dispatch, meta, oldMeta, vocabulary.english);
        }

        // after space rep updates

        // prevent updates when quick scrolling
        if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
          // don't increment reinforced terms
          const shouldIncrement = uid !== prevState.reinforcedUID;
          const frequency = prevState.reinforcedUID !== null;

          void dispatch(updateSpaceRepWord({ uid, shouldIncrement }))
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
              const messageLog = (m: string, l: number) =>
                dispatch(logger(m, l));
              // if (tpAnsweredREF.current !== undefined) {
              //   timedPlayLog(messageLog, vocabulary, repStats, { frequency });
              // } else {
              spaceRepLog(messageLog, vocabulary, repStats, { frequency });
              // }
            });
        }
      });

      const wasReset = resetTimedPlay();
      if (wasReset) {
        if (minimumTimeForTimedPlay(prevState.lastNext)) {
          beginLoop();
        }
      }

      setShowHint(undefined);
      prevSelectedIndex.current = selectedIndex;
      prevReinforcedUID.current = reinforcedUID;
      accuracyModifiedRef.current = undefined;

      setWasPlayed(false);
    }
  }, [
    dispatch,
    tpAnsweredREF,
    beginLoop,
    gradeTimedPlayEvent,
    resetTimedPlay,
    vocabList,
    reinforcedUID,
    selectedIndex,
    filteredVocab,
    order,
    recallGame,

    setText,
    viewGoal,
    lastNext,
  ]);

  const getInnerPage = useCallback(
    (
      uid: string,
      vocabulary: RawVocabulary,
      isVerb: boolean,
      alreadyReviewed: boolean
    ) => (
      <div
        className={classNames({
          "vocabulary main-panel h-100": true,
          "disabled-color": alreadyReviewed,
        })}
      >
        <div className="tooltip-anchor" ref={anchorElRef}></div>
        <div ref={blastElRef}>{text}</div>
        <div
          ref={HTMLDivElementSwipeRef}
          className="d-flex justify-content-between h-100"
        >
          <StackNavButton ariaLabel="Previous" action={gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          {isVerb && autoVerbView ? (
            <VerbMain
              verb={vocabulary}
              reCache={recacheAudio}
              linkToOtherTerm={(uid) => setReinforcedUID(uid)}
              showHint={showHint === uid}
            />
          ) : (
            <VocabularyMain
              vocabulary={vocabulary}
              reCache={recacheAudio}
              showHint={showHint === uid}
              wasPlayed={wasPlayed}
            />
          )}

          <StackNavButton ariaLabel="Next" action={gotoNextSlide}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>
    ),
    [
      gotoNextSlide,
      gotoPrev,
      HTMLDivElementSwipeRef,
      autoVerbView,
      recacheAudio,
      showHint,
      wasPlayed,
      anchorElRef,
      blastElRef,
      text,
    ]
  );

  const pageOptionBar = useCallback(
    (
      uid: string,
      vocabulary: RawVocabulary,
      isVerb: boolean,
      hasFurigana: boolean,
      isHintable: boolean,
      vocabulary_reinforce: boolean,
      reviewedToday: boolean,
      alreadyReviewed: boolean,
      revNotification?: string
    ) => (
      <div
        className={classNames({
          "options-bar mb-3 flex-shrink-1": true,
          "disabled-color": !cookies || alreadyReviewed,
        })}
      >
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start">
              <TogglePracticeSideBtn
                toggle={englishSideUp}
                action={
                  cookies
                    ? () => {
                        if (abortLoop()) {
                          resetTimedPlay();
                        }
                        dispatch(flipVocabularyPracticeSide());
                      }
                    : undefined
                }
              />
              <ReCacheAudioBtn
                disabled={!cookies}
                active={recacheAudio}
                action={buildRecacheAudioHandler(recacheAudio, setRecacheAudio)}
              />
              <ToggleAutoVerbViewBtn
                disabled={!cookies}
                visible={isVerb}
                toggleAutoVerbView={buildAction(dispatch, toggleAutoVerbView)}
                autoVerbView={autoVerbView}
              />
              <div className="sm-icon-grp">
                {!cookies ? null : loopSettingBtn}
              </div>
              <div className="sm-icon-grp">
                {!cookies ? null : loopActionBtn}
              </div>
            </div>
          </div>
          <div className="col">
            <div className="d-flex justify-content-end pe-2 pe-sm-0">
              {/* {timedPlayVerifyBtn(metadata.current[uid]?.pron === true)} */}
              <Tooltip
                disabled={!cookies}
                className={classNames({
                  "question-color opacity-50":
                    sort === TermSortBy.RECALL && !reviewedToday,
                  "done-color opacity-50": reviewedToday,
                })}
                idKey={uid}
                notification={revNotification}
              >
                <DifficultySlider
                  difficulty={metadata.current[uid]?.difficultyP}
                  resetOn={uid}
                  onChange={(difficulty: number | null) => {
                    dispatch(setWordDifficulty(uid, difficulty));
                  }}
                />
                <AccuracySlider
                  accuracy={metadata.current[uid]?.accuracyP}
                  resetOn={uid}
                  onChange={(accuracy: number | null) => {
                    if (accuracy !== undefined) {
                      dispatch(setWordAccuracy(uid, accuracy));
                      accuracyModifiedRef.current = accuracy;
                    }
                  }}
                />
                <div className="fs-xx-small me-2">
                  <RecallIntervalPreviewInfo metadata={metadata.current[uid]} />
                </div>
              </Tooltip>
              <ShowHintBtn
                disabled={!cookies}
                visible={hintEnabledREF.current}
                active={isHintable}
                setShowHint={setStateFunction(setShowHint, (prev) =>
                  prev !== undefined ? undefined : uid
                )}
              />
              <ToggleFuriganaBtn
                disabled={!cookies}
                active={hasFurigana}
                toggle={
                  toggleFuriganaSettingHelper(vocabulary.uid, metadata.current)
                    .furigana.show
                }
                toggleFurigana={buildAction(dispatch, furiganaToggled)}
                vocabulary={vocabulary}
              />
              <ToggleFrequencyTermBtnMemo
                disabled={!cookies}
                term={vocabulary}
                count={frequency.length}
                isReinforced={reinforcedUID !== null}
                hasReinforce={vocabulary_reinforce}
                addFrequencyTerm={(uid) => {
                  setFrequency((f) => [...f, uid]);
                  buildAction(dispatch, addFrequencyWord)(uid);
                }}
                removeFrequencyTerm={(uid) => {
                  setFrequency((f) => f.filter((id) => id !== uid));
                  buildAction(dispatch, removeFrequencyWord)(uid);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    [
      cookies,
      abortLoop,
      autoVerbView,
      dispatch,
      englishSideUp,
      frequency.length,
      hintEnabledREF,
      loopActionBtn,
      loopSettingBtn,
      recacheAudio,
      reinforcedUID,
      resetTimedPlay,
      sort,
    ]
  );

  const { pList, pIdx } = useMemo(() => {
    let list: BareIdx[] = [];
    let idx = selectedIndex;
    if (scrollJOrder) {
      if (jbare) {
        list = jbare;
      }
    } else {
      if (jbare) {
        idx = jbare[selectedIndex].idx;
      }
      if (ebare) {
        list = ebare;
      }
    }

    return { pList: list, pIdx: idx };
  }, [selectedIndex, scrollJOrder, jbare, ebare]);

  const pageMultiOrderScroller = useMemo(
    () => (
      <>
        <Grow in={showPageMultiOrderScroller} timeout={500}>
          <Avatar
            style={{
              position: "absolute",
              bottom: "25vh",
              left: "65vw",
              // backgroundColor: deepOrange[500],
            }}
          >
            <div onClick={setStateFunction(setScrollJOrder, (prev) => !prev)}>
              {scrollJOrder ? "JP" : "EN"}
            </div>
          </Avatar>
        </Grow>
        <div
          className="page-bar flex-shrink-1"
          onTouchStart={() => {
            isAlphaSortScrolling.current = true;
          }}
          onTouchEnd={() => {
            isAlphaSortScrolling.current = false;
          }}
          onMouseDown={() => {
            isAlphaSortScrolling.current = true;
          }}
          onMouseUp={() => {
            isAlphaSortScrolling.current = false;
          }}
        >
          <VocabularyOrderSlider
            initial={pIdx}
            list={pList}
            setIndex={(index) => {
              if (scrollJOrder) {
                setSelectedIndex(index);
              } else if (ebare) {
                const idx = ebare[index].idx;
                setSelectedIndex(idx);
              }
            }}
          />
        </div>
      </>
    ),
    [ebare, pIdx, pList, scrollJOrder, showPageMultiOrderScroller]
  );

  if (recallGame === 0) {
    return (
      <GoalResumeMessage
        goal="Vocabulary"
        setResumeSort={setResumeSort}
        allowed={[
          TermSortBy.VIEW_DATE,
          TermSortBy.DIFFICULTY,
          TermSortBy.ALPHABETIC,
          TermSortBy.RANDOM,
        ]}
      />
    );
  }

  if (filteredVocab.length < 1 || order.length < 1)
    return <NotReady addlStyle="main-panel" />;

  const uid = reinforcedUID ?? getTermUID(selectedIndex, filteredVocab, order);

  // console.log(
  //   JSON.stringify({
  //     rein: (reinforcedUID && reinforcedUID.slice(0, 6)) || "",
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     v: vocabList.length,
  //     ord: order.length,
  //     rep: Object.keys(metadata.current).length,
  //     fre: frequency.length,
  //     filt: filteredVocab.length,
  //   })
  // );

  const vocabulary = getTerm(uid, filteredVocab, vocabList);
  const vocabulary_reinforce = metadata.current[vocabulary.uid]?.rein === true;

  const isVerb = vocabulary.grp === "Verb";

  const jText = JapaneseText.parse(vocabulary);
  const hasFurigana = jText.hasFurigana();
  const hasJHint = jText.isHintable(3);
  const hasEHint = vocabulary.grp !== undefined && vocabulary.grp !== "";

  const isHintable = showHint !== uid && englishSideUp ? hasJHint : hasEHint;

  const progress = ((selectedIndex + 1) / filteredVocab.length) * 100;
  const reviewedToday = wasToday(metadata.current[uid]?.lastReview);
  const viewedToday = wasToday(metadata.current[uid]?.lastView);
  /** Item reviewed in current game */
  const alreadyReviewed = recallGame > 0 && viewedToday;

  const revNotification = recallNotificationHelper(
    metadata.current[uid]?.daysBetweenReviews,
    metadata.current[uid]?.lastReview
  );

  const pageLinearProgress = (
    <div
      className={classNames({
        "progress-line flex-shrink-1": true,
        "disabled-color": alreadyReviewed,
      })}
      onClick={() => {
        if (sort === TermSortBy.ALPHABETIC) {
          const delayTime = 4000;
          setShowPageMultiOrderScroller(true);

          const delay = () => {
            if (!isAlphaSortScrolling.current) {
              setShowPageMultiOrderScroller(false);
            } else {
              setTimeout(delay, delayTime);
            }
          };

          setTimeout(delay, delayTime);
        }
      }}
    >
      <LinearProgress
        // variant={tpAnimation === null ? "determinate" : "buffer"}
        // value={tpAnimation === null ? progress : 0}
        // valueBuffer={tpAnimation ?? undefined}
        // color={vocabulary_reinforce ? "secondary" : "primary"}
        variant={
          goalProgress === null && tpAnimation === null
            ? "determinate"
            : "buffer"
        }
        value={goalProgress === null && tpAnimation === null ? progress : 0}
        valueBuffer={tpAnimation ?? goalProgress ?? undefined}
        color={
          goalProgress === null
            ? vocabulary_reinforce
              ? "secondary"
              : "primary"
            : "warning"
        }
      />
    </div>
  );

  let page;
  if (!showPageMultiOrderScroller) {
    page = (
      <React.Fragment>
        {getInnerPage(uid, vocabulary, isVerb, alreadyReviewed)}
        {pageOptionBar(
          uid,
          vocabulary,
          isVerb,
          hasFurigana,
          isHintable,
          vocabulary_reinforce,
          reviewedToday,
          alreadyReviewed,
          revNotification
        )}
        {pageLinearProgress}
      </React.Fragment>
    );
  } else {
    page = (
      <React.Fragment>
        {getInnerPage(uid, vocabulary, isVerb, alreadyReviewed)}
        {pageMultiOrderScroller}
      </React.Fragment>
    );
  }

  return page;
}

function buildRecacheAudioHandler(
  recacheAudio: boolean,
  setRecacheAudio: React.Dispatch<React.SetStateAction<boolean>>
) {
  return function recacheAudioHandler() {
    if (!recacheAudio) {
      const delayTime = 2000;
      setRecacheAudio(true);

      const delayToggle = () => {
        setRecacheAudio(false);
      };

      setTimeout(delayToggle, delayTime);
    }
  };
}

function useBuildGameActionsHandler(
  gotoNextSlide: () => void,
  gotoPrev: () => void,
  reinforcedUID: string | null,
  selectedIndex: number,
  vocabList: RawVocabulary[],
  verbForm: string,
  order: number[],
  filteredVocab: RawVocabulary[],
  recacheAudio: boolean,
  naFlip: React.MutableRefObject<string | undefined>,
  setWasPlayed: (value: boolean) => void,
  baseUrl: string
) {
  return useCallback(
    (direction: string, AbortController?: AbortController) => {
      let actionPromise;

      if (direction === "left") {
        gotoNextSlide();
        actionPromise = Promise.all([
          Promise.resolve(/** Interrupt */),
          Promise.resolve(/** Fetch */),
        ]);
      } else if (direction === "right") {
        gotoPrev();
        actionPromise = Promise.all([
          Promise.resolve(/** Interrupt */),
          Promise.resolve(/** Fetch */),
        ]);
      } else {
        const uid =
          reinforcedUID ?? getTermUID(selectedIndex, filteredVocab, order);
        const vocabulary = getTerm(uid, vocabList);

        const override = recacheAudio
          ? { headers: SWRequestHeader.CACHE_RELOAD }
          : {};

        setWasPlayed(true);

        if (direction === "up") {
          setMediaSessionPlaybackState("playing");

          let sayObj;
          if (vocabulary.grp === "Verb" && verbForm !== "dictionary") {
            const verb = verbToTargetForm(vocabulary, verbForm);

            sayObj = {
              ...vocabulary,
              japanese: verb.toString(),
              pronounce: vocabulary.pronounce && verb.getPronunciation(),
              form: verbForm,
            };
          } else if (JapaneseText.parse(vocabulary).isNaAdj()) {
            const naAdj = JapaneseText.parse(vocabulary).append(
              naFlip.current && "な"
            );

            sayObj = {
              ...vocabulary,
              japanese: naAdj.toString(),
              pronounce: vocabulary.pronounce && naAdj.getPronunciation(),
              form: naFlip.current,
            };

            naFlip.current = naFlip.current ? undefined : "-na";
          } else {
            sayObj = vocabulary;
          }

          const audioUrl = addParam(baseUrl, {
            tl: "ja",
            q: audioPronunciation(sayObj),
            uid: getCacheUID(sayObj),
          });

          actionPromise = fetchAudio(
            new Request(audioUrl, override),
            AbortController
          );
        } else if (direction === "down") {
          setMediaSessionPlaybackState("playing");

          const inEnglish = vocabulary.english;
          const audioUrl = addParam(baseUrl, {
            tl: "en",
            q: inEnglish,
            uid: vocabulary.uid + ".en",
          });

          actionPromise = fetchAudio(
            new Request(audioUrl, override),
            AbortController
          );
        }
      }
      return (
        actionPromise ??
        Promise.reject(/** TODO: give direction a type to remove this */)
      );
    },
    [
      gotoNextSlide,
      gotoPrev,
      reinforcedUID,
      selectedIndex,
      vocabList,
      verbForm,
      order,
      filteredVocab,
      recacheAudio,
      naFlip,
      setWasPlayed,
      baseUrl,
    ]
  );
}

export { VocabularyMeta };
