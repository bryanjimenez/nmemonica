import { LinearProgress } from "@mui/material";
import { TrashIcon } from "@primer/octicons-react";
import classNames from "classnames";
import type { RawPhrase } from "nmemonica";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { type AudioItemParams } from "../../constants/voiceConstants";
import {
  AudioBufferRecord,
  copyBufferFromCacheStore,
  copyBufferToCacheStore,
  getSynthVoiceBufferToCacheStore,
  hasBufferFromCacheStore,
} from "../../helper/audioSynthPreCache";
import {
  type ConsoleMessage,
  DebugLevel,
  daysSince,
  spaceRepLog,
  wasToday,
} from "../../helper/consoleHelper";
import { recallSortLogSummary } from "../../helper/consoleSummaryHelper";
import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import {
  englishLabel,
  getCacheUID,
  getPendingReduceFiltered,
  getTerm,
  getTermUID,
  japaneseLabel,
  labelPlacementHelper,
  minimumTimeForSpaceRepUpdate,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import {
  recallDebugLogHelper,
  recallNotificationHelper,
  spaceRepetitionOrder,
} from "../../helper/recallHelper";
import {
  dateViewOrder,
  difficultySubFilter,
  randomOrder,
} from "../../helper/sortHelper";
import { SwipeDirection } from "../../helper/TouchSwipe";
import { useBlast } from "../../hooks/useBlast";
import { useConnectAudio } from "../../hooks/useConnectAudio";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
// import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { updateDailyGoal, useGoalProgress } from "../../hooks/useGoalProgress";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
// import { useMediaSession } from "../../hooks/useMediaSession";
import { useSwipeActions } from "../../hooks/useSwipeActions";
// import { useTimedGame } from "../../hooks/useTimedGame";
import type { AppDispatch } from "../../slices";
import { playAudio } from "../../slices/audioHelper";
import { logger } from "../../slices/globalSlice";
import {
  deleteMetaPhrase,
  flipPhrasesPracticeSide,
  getPhrase,
  getPhraseTags,
  removeFromSpaceRepetition,
  setPhraseAccuracy,
  setPhraseDifficulty,
  setSpaceRepetitionMetadata,
  togglePhraseTag,
  updateSpaceRepPhrase,
} from "../../slices/phraseSlice";
import { TermSortBy, TermSortByLabel } from "../../slices/settingHelper";
import {
  getSynthAudioWorkaroundNoAsync,
  logAudioError,
} from "../../slices/voiceSlice";
import { AccuracySlider } from "../Form/AccuracySlider";
import AudioItem from "../Form/AudioItem";
import ClickNavBtn from "../Form/ClickNavBtn";
import DialogMsg from "../Dialog/DialogMsg";
import { DifficultySlider } from "../Form/DifficultySlider";
import { GoalResumeMessage } from "../Form/GoalResumeMessage";
import { NotReady } from "../Form/NotReady";
import {
  ApplyTagsBtn,
  AudioLoadingIcon,
  ToggleLiteralPhraseBtn,
  TogglePracticeSideBtn,
  ViewLessonsBtn,
} from "../Form/OptionsBar";
import { RecallIntervalPreviewInfo } from "../Form/RecallIntervalPreviewInfo";
import Sizable from "../Form/Sizable";
import { TagEditMenu } from "../Dialog/TagEditMenu";
import { Tooltip } from "../Form/Tooltip";

const PhrasesMeta = {
  location: "/phrases/",
  label: "Phrases",
};

export default function Phrases() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies, debug } = useConnectSetting();
  const debugREF = useRef(debug);
  const { loadingAudio } = useConnectAudio();

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const audioCacheStore = useRef<AudioBufferRecord>({});

  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef(Date.now());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [showLit, setShowLit] = useState<boolean>(false);
  const [log, setLog] = useState<ConsoleMessage[]>([]);
  /** Is not undefined after user modifies accuracyP value */
  const accuracyModifiedRef = useRef<number | null>(undefined);

  const {
    // Changing during game
    englishSideUp,
    repetition,

    difficultyThreshold,

    // Not changing during game
    // motionThreshold,
    swipeThreshold,
    phraseList,
    activeGroup,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,

    sortMethod,

    // Refs ()
    filterType: filterTypeREF,
    viewGoal,
  } = useConnectPhrase();

  // after recall complete
  // resume with alternate sorting
  const [resumeSort, setResumeSort] = useState<number>(-1);
  /** Alternate sort upon ending recall */
  const sort = useMemo(() => {
    return resumeSort === -1 ? sortMethod : resumeSort;
  }, [resumeSort, sortMethod]);

  const repMinItemReviewREF = useRef(spaRepMaxReviewItem);
  const difficultyThresholdREF = useRef(difficultyThreshold);

  // repetitionOnce is only updated the first time
  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  const [tagMenu, setTagMenu] = useState(false);
  const closeTagMenu = useCallback(() => {
    setTagMenu(false);
  }, []);
  const openTagMenu = useCallback(() => {
    setTagMenu(true);
  }, []);

  const { goalPendingREF, progressBarColor, goalProgress, setGoalProgress } =
    useGoalProgress(viewGoal, metadata);

  const [lesson, setLesson] = useState(false);

  const closeLesson = useCallback(() => {
    setLesson(false);
  }, []);

  const populateDataSetsRef = useRef(() => {
    if (phraseList.length === 0) {
      void dispatch(getPhrase());
    }
  });

  useEffect(() => {
    const { current: populateDataSets } = populateDataSetsRef;
    populateDataSets();
  }, []);

  const { blastElRef, text, setText } = useBlast({
    top: 10,
  });

  const { filtered: filteredPhrases, recallGame } = useMemo(
    function filterMemo() {
      const firstRepObject = metadata.current;
      if (phraseList.length === 0) return { filtered: [], recallGame: -1 };
      if (Object.keys(firstRepObject).length === 0 && activeGroup.length === 0)
        return { filtered: phraseList, recallGame: -1 };

      let recallGame = -1;
      let filtered = termFilterByType(
        filterTypeREF.current,
        phraseList,
        activeGroup
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
        default:
          break;
      }

      return { filtered, recallGame };
    },
    [
      filterTypeREF,
      sort,
      difficultyThresholdREF,
      phraseList,
      activeGroup,
      includeNew,
      includeReviewed,
    ]
  );

  const order = useMemo(
    function orderMemo() {
      const repetition = metadata.current;
      if (filteredPhrases.length === 0) return [];

      let newOrder: number[];
      switch (sort) {
        case TermSortBy.VIEW_DATE:
          newOrder = dateViewOrder(filteredPhrases, repetition);

          let newN = 0;
          let oldDt = NaN;
          const views = newOrder.map((i) => {
            const d = metadata.current[filteredPhrases[i].uid]?.lastView;
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
          newOrder = filteredPhrases.map((_p, i) => i);
          break;

        default: //TermSortBy.RANDOM:
          newOrder = randomOrder(filteredPhrases);
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
    [sort, filteredPhrases]
  );

  const gotoNext = useCallback(() => {
    const l = filteredPhrases.length;
    let newSel = (selectedIndex + 1) % l;

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(null);
  }, [filteredPhrases, selectedIndex, lastNext]);

  const gotoPrev = useCallback(() => {
    const l = filteredPhrases.length;
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
  }, [filteredPhrases, selectedIndex, reinforcedUID, lastNext]);

  const gameActionHandler = buildGameActionsHandler(
    dispatch,
    gotoNext,
    gotoPrev,
    reinforcedUID,
    selectedIndex,
    phraseList,
    order,
    filteredPhrases,
    englishSideUp,
    setShowMeaning,
    audioCacheStore
  );

  // const deviceMotionEvent = useDeviceMotionActions(motionThreshold);

  // const {
  //   beginLoop,
  //   abortLoop,
  //   looperSwipe,

  //   loopSettingBtn,
  //   loopActionBtn,
  //   // timedPlayVerifyBtn, // not used

  //   timedPlayAnswerHandlerWrapper,
  //   resetTimedPlay,

  //   loop,
  //   tpAnswered: tpAnsweredREF,
  //   tpAnimation,
  // } = useTimedGame(gameActionHandler, englishSideUp, deviceMotionEvent);

  // next or prev
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
        getTermUID(prevState.selectedIndex, filteredPhrases, order);

      const p = getTerm(uid, filteredPhrases, phraseList);

      updateDailyGoal({
        viewGoal,
        msg: "Phrase Goal Reached!",
        lastView: metadata.current[uid]?.lastView,
        selectedIndex,
        prevSelectedIndex: prevState.selectedIndex,
        prevTimestamp: prevState.lastNext,
        progressTotal: filteredPhrases.length,
        goalPending: goalPendingREF,
        setGoalProgress,
        setText,
      });

      let spaceRepUpdated;
      if (
        metadata.current[uid]?.difficultyP !== undefined &&
        typeof accuracyModifiedRef.current === "number"
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

          recallDebugLogHelper(dispatch, meta, oldMeta, p.english);
        }

        // prevent updates when quick scrolling
        if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
          // don't increment reinforced terms
          const shouldIncrement = uid !== prevState.reinforcedUID;

          void dispatch(updateSpaceRepPhrase({ uid, shouldIncrement }))
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

              spaceRepLog(messageLog, p, repStats);
            });
        }
      });

      // const wasReset = resetTimedPlay();
      // if (wasReset) {
      //   if (minimumTimeForTimedPlay(prevState.lastNext)) {
      //     beginLoop();
      //   }
      // }

      setShowMeaning(false);
      setShowLit(false);

      prevSelectedIndex.current = selectedIndex;
      prevReinforcedUID.current = reinforcedUID;
      accuracyModifiedRef.current = undefined;
    }
  }, [
    dispatch,
    phraseList,
    reinforcedUID,
    selectedIndex,
    filteredPhrases,
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

  useKeyboardActions(
    gameActionHandler,
    buildAction(dispatch, flipPhrasesPracticeSide)
    // timedPlayAnswerHandlerWrapper
  );

  // useMediaSession("Phrases Loop", loop, beginLoop, abortLoop, looperSwipe);

  const { HTMLDivElementSwipeRef } = useSwipeActions(
    gameActionHandler
    // timedPlayAnswerHandlerWrapper
  );

  if (recallGame === 0) {
    return (
      <GoalResumeMessage
        goal="Phrases"
        setResumeSort={setResumeSort}
        allowed={[
          TermSortBy.VIEW_DATE,
          TermSortBy.DIFFICULTY,
          TermSortBy.RANDOM,
        ]}
      />
    );
  }

  if (filteredPhrases.length < 1 || order.length < 1)
    return <NotReady addlStyle="main-panel" />;

  const uid =
    reinforcedUID ?? getTermUID(selectedIndex, filteredPhrases, order);

  // console.log(
  //   JSON.stringify({
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     p: phrases.length,
  //     ord: order.length,
  //     rep: Object.keys(metadata.current).length,
  //     filt: filteredPhrases.length,
  //   })
  // );

  const phrase = getTerm(uid, filteredPhrases, phraseList);

  const playButton = getPlayBtn(
    swipeThreshold,
    englishSideUp,
    phrase,
    // loop
    0
  );

  const [jObj, japanesePhrase] = getJapanesePhrase(phrase);

  /** Display inverse links and polite when available */
  const enDecorated = englishLabel(
    englishSideUp,
    jObj,
    phrase.english,
    (uid) => setReinforcedUID(uid),
    phrase
  );
  const jpDecorated = japaneseLabel(
    englishSideUp,
    jObj,
    japanesePhrase,
    (uid) => setReinforcedUID(uid),
    phrase
  );

  const { hasLiteral, englishWLiteral } =
    phrase.lit === undefined || phrase.lit.trim() === ""
      ? { hasLiteral: false, englishWLiteral: enDecorated }
      : {
          hasLiteral: true,
          englishWLiteral: decorateEnglishWLiteral(
            enDecorated,
            phrase.lit,
            showLit,
            setShowLit
          ),
        };

  const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
    englishSideUp,
    englishWLiteral,
    jpDecorated,
    eLabelMemo,
    jLabelMemo
  );

  const shortEN = (phrase.lit?.length ?? phrase.english.length) < 55;
  const shortJP = jObj?.getSpelling().length < 55;

  const {
    aboveSmallCss,
    aboveLargeCss,
    belowNoInterruptCss,
    belowSmallCss,
    belowLargeCss,
  } = getCssResizableSubComp(englishSideUp, shortJP, shortEN);

  const progress = ((selectedIndex + 1) / filteredPhrases.length) * 100;
  const reviewedToday = wasToday(metadata.current[uid]?.lastReview);
  const viewedToday = wasToday(metadata.current[uid]?.lastView);
  /** Item reviewed in current game */
  const alreadyReviewed = recallGame > 0 && viewedToday;

  const revNotification = recallNotificationHelper(
    metadata.current[uid]?.daysBetweenReviews,
    metadata.current[uid]?.lastReview
  );

  const hidden = swipeThreshold > 0;

  return (
    <>
      <div
        className={classNames({
          "phrases main-panel h-100": true,
          "disabled-color": alreadyReviewed,
        })}
      >
        <div
          ref={blastElRef}
          className="text-nowrap fs-display-6 correct-color"
        >
          {text}
        </div>
        <DialogMsg
          open={lesson}
          onClose={closeLesson}
          title="Lesson"
          ariaLabelledby="lesson-info"
        >
          {phrase.lesson}
        </DialogMsg>
        <TagEditMenu
          visible={tagMenu}
          close={closeTagMenu}
          term={phrase}
          get={() =>
            dispatch(getPhraseTags({ query: phrase.japanese })).unwrap()
          }
          toggle={(tag: string) =>
            dispatch(
              togglePhraseTag({
                query: phrase.japanese,
                tag,
              })
            ).unwrap()
          }
          tags={[
            "Keigo",
            "Formal",
            "Polite",
            "Passive",
            "Colloquial",
            "Derogative",
          ]}
        />
        <div
          ref={HTMLDivElementSwipeRef}
          className="d-flex justify-content-between h-100"
        >
          <ClickNavBtn direction="previous" action={gotoPrev} />

          <div
            className={classNames({
              "pt-3 d-flex flex-column justify-content-around text-center":
                true,
              "px-3": hidden,
            })}
          >
            <Sizable
              breakPoint="md"
              largeClassName={aboveLargeCss}
              smallClassName={aboveSmallCss}
            >
              {topValue}
            </Sizable>
            <Sizable
              className={belowNoInterruptCss}
              breakPoint="md"
              onClick={setStateFunction(setShowMeaning, (meaning) => !meaning)}
              largeClassName={belowLargeCss}
              smallClassName={belowSmallCss}
            >
              {showMeaning ? bottomValue : bottomLabel}
            </Sizable>
            <div className="d-flex justify-content-center">{playButton}</div>
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
            <div className="d-flex justify-content-start">
              <TogglePracticeSideBtn
                disabled={!cookies}
                reviewed={alreadyReviewed}
                toggle={englishSideUp}
                action={buildAction(dispatch, flipPhrasesPracticeSide)}
              />
              <AudioLoadingIcon
                visible={loadingAudio.some((id) => id.startsWith(uid))}
                notification={
                  loadingAudio.includes(uid + ".en") &&
                  loadingAudio.includes(uid)
                    ? undefined // both
                    : loadingAudio.includes(uid + ".en")
                      ? "EN"
                      : "JA"
                }
              />
            </div>
          </div>
          <div className="col">
            <div className="d-flex justify-content-end pe-2 pe-sm-0">
              <ViewLessonsBtn
                visible={phrase.lesson !== undefined}
                disabled={!cookies}
                reviewed={alreadyReviewed}
                action={() => {
                  setLesson(true);
                }}
              />
              <Tooltip
                disabled={!cookies}
                reviewed={alreadyReviewed}
                className={classNames({
                  "question-color":
                    sort === TermSortBy.RECALL && !reviewedToday,
                  "done-color": reviewedToday,
                })}
                idKey={uid}
                notification={revNotification}
              >
                <DifficultySlider
                  difficulty={metadata.current[uid]?.difficultyP}
                  resetOn={uid}
                  onChange={(difficulty: number | null) => {
                    dispatch(setPhraseDifficulty(uid, difficulty));
                  }}
                />
                <AccuracySlider
                  accuracy={metadata.current[uid]?.accuracyP}
                  resetOn={uid}
                  onChange={(accuracy: number | null) => {
                    if (accuracy !== undefined) {
                      dispatch(setPhraseAccuracy(uid, accuracy));
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
                      void dispatch(deleteMetaPhrase([uid]));
                    }}
                  >
                    <TrashIcon />
                  </div>
                  <div className="d-flex flex-column"></div>
                </div>
              </Tooltip>
              <ToggleLiteralPhraseBtn
                visible={englishSideUp && hasLiteral}
                disabled={!cookies}
                reviewed={alreadyReviewed}
                toggle={showLit}
                action={setStateFunction(setShowLit, (lit) => !lit)}
              />
              <ApplyTagsBtn
                disabled={!cookies}
                action={openTagMenu}
                reviewed={alreadyReviewed}
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
          // variant="determinate"
          // variant={tpAnimation === null ? "determinate" : "buffer"}
          // value={tpAnimation === null ? progress : 0}
          // valueBuffer={tpAnimation ?? undefined}
          variant={goalProgress === null ? "determinate" : "buffer"}
          value={goalProgress === null ? progress : 0}
          valueBuffer={goalProgress ?? undefined}
          // value={progress}
          // color={phrase_reinforce ? "secondary" : "primary"}
          color={progressBarColor}
        />
      </div>
    </>
  );
}

function getJapanesePhrase(
  phrase: RawPhrase
): [JapaneseText, React.JSX.Element] {
  const jObj = JapaneseText.parse(phrase);

  return [jObj, jObj.toHTML()];
}

function decorateEnglishWLiteral(
  enDecorated: React.JSX.Element | string,
  literal: string,
  showLit: boolean,
  setShowLit: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (
    <div className="d-flex flex-column">
      <span
        className={classNames({
          "px-2 pb-1 dash-border-small rounded": showLit,
        })}
        onClick={() => {
          setShowLit((lit) => !lit);
        }}
      >
        {!showLit ? enDecorated : literal}
      </span>
      <span
        className={classNames({
          "pt-1 fs-en-subscr fw-light": true,
          invisible: showLit,
        })}
      >
        {literal}
      </span>
    </div>
  );
}

function getCssResizableSubComp(
  englishSideUp: boolean,
  shortJP: boolean,
  shortEN: boolean
) {
  const aboveLargeCss = { "fs-display-5": true };

  const aboveSmallCss = {
    ...(!englishSideUp
      ? { [shortJP ? "h1" : "h3"]: true }
      : { [shortEN ? "h1" : "h3"]: true }),
  };

  const belowNoInterruptCss = { "loop-no-interrupt": true };
  const belowLargeCss = aboveLargeCss;
  const belowSmallCss = {
    ...(englishSideUp
      ? { [shortJP ? "h1" : "h3"]: true }
      : { [shortEN ? "h1" : "h3"]: true }),
  };

  return {
    aboveSmallCss,
    aboveLargeCss,
    belowNoInterruptCss,
    belowSmallCss,
    belowLargeCss,
  };
}

const eLabelMemo = <span>{"[English]"}</span>;
const jLabelMemo = <span>{"[Japanese]"}</span>;

function getPlayBtn(
  swipeThreshold: number,
  englishSideUp: boolean,
  phrase: RawPhrase,
  loop: number
): React.ReactNode | undefined {
  let audioWords: AudioItemParams;
  if (englishSideUp) {
    audioWords = { tl: "en", q: phrase.english, uid: phrase.uid + ".en" };
  } else {
    const pronunciation = audioPronunciation(phrase);
    if (pronunciation instanceof Error) {
      // TODO: visually show unavailable
      return undefined;
    }

    audioWords = {
      tl: "ja",
      q: pronunciation,
      uid: getCacheUID(phrase),
    };
  }

  return (
    <AudioItem visible={swipeThreshold === 0 && loop === 0} word={audioWords} />
  );
}

function buildGameActionsHandler(
  dispatch: AppDispatch,
  gotoNext: () => void,
  gotoPrev: () => void,
  reinforcedUID: string | null,
  selectedIndex: number,
  phrases: RawPhrase[],
  order: number[],
  filteredPhrases: RawPhrase[],
  englishSideUp: boolean,
  setShowMeaning: React.Dispatch<React.SetStateAction<boolean>>,
  audioCacheStore: React.RefObject<AudioBufferRecord>
) {
  return async function gameActionHandler(
    direction: SwipeDirection,
    AbortController?: AbortController
  ) {
    if (direction === "vertical") {
      return Promise.reject(new Error("Unexpected swipe direction"));
    }
    let actionPromise;

    if (direction === "left") {
      gotoNext();
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
        reinforcedUID ?? getTermUID(selectedIndex, filteredPhrases, order);
      const phrase = getTerm(uid, phrases);

      if (
        (englishSideUp && direction === "up") ||
        (!englishSideUp && direction === "down")
      ) {
        setShowMeaning(true);
      }

      if (direction === "up") {
        const cachedAudioBuf = copyBufferFromCacheStore(
          audioCacheStore,
          phrase.uid
        );

        if (cachedAudioBuf !== undefined) {
          actionPromise = playAudio(cachedAudioBuf);
        } else {
          const inJapanese = audioPronunciation(phrase);
          if (inJapanese instanceof Error) {
            dispatch(logger(inJapanese.message, DebugLevel.ERROR));
            return Promise.reject(inJapanese);
          }
          try {
            const res = await dispatch(
              getSynthAudioWorkaroundNoAsync({
                key: phrase.uid,
                index: reinforcedUID !== null ? undefined : selectedIndex,
                tl: "ja",
                q: inJapanese,
              })
            ).unwrap();

            const cachedAudioBuf = copyBufferToCacheStore(
              audioCacheStore,
              res.uid,
              res.buffer
            );

            actionPromise = playAudio(cachedAudioBuf);
          } catch (exception) {
            logAudioError(dispatch, exception, inJapanese, "onSwipe");
            actionPromise = Promise.resolve();
          }
        }
      } else {
        //if (direction === "down")
        const inEnglish = phrase.english;
        const enUid = phrase.uid + ".en";

        const cachedAudioBuf = copyBufferFromCacheStore(audioCacheStore, enUid);

        if (cachedAudioBuf !== undefined) {
          actionPromise = playAudio(cachedAudioBuf);
        } else {
          try {
            const res = await dispatch(
              getSynthAudioWorkaroundNoAsync({
                key: enUid,
                index: reinforcedUID !== null ? undefined : selectedIndex,
                tl: "en",
                q: inEnglish,
              })
            ).unwrap();

            const cachedAudioBuf = copyBufferToCacheStore(
              audioCacheStore,
              res.uid,
              res.buffer
            );

            actionPromise = playAudio(cachedAudioBuf);
          } catch (exception) {
            logAudioError(dispatch, exception, inEnglish, "onSwipe");
            actionPromise = Promise.resolve();
          }
        }
      }
    }
    return actionPromise.then(() => {
      if (direction === "up" || direction === "down") {
        preCacheAudioForNextTerm(
          dispatch,
          reinforcedUID,
          selectedIndex,
          phrases,
          order,
          filteredPhrases,
          audioCacheStore
        );
      }
    });
  };
}

export { PhrasesMeta };

function preCacheAudioForNextTerm(
  dispatch: AppDispatch,
  reinforcedUID: string | null,
  selectedIndex: number,
  phrasesList: RawPhrase[],
  order: number[],
  filteredPhrases: RawPhrase[],
  audioCacheStore: React.RefObject<AudioBufferRecord>
) {
  const nextSelectedIndex = (selectedIndex + 1) % order.length;
  const nextUid =
    reinforcedUID ?? getTermUID(nextSelectedIndex, filteredPhrases, order);

  const isJACached = hasBufferFromCacheStore(audioCacheStore, nextUid);
  const isENCached = hasBufferFromCacheStore(audioCacheStore, nextUid + ".en");

  if (isJACached && isENCached) {
    return;
  }

  const nextP = getTerm(nextUid, filteredPhrases, phrasesList);
  const inJapanese = audioPronunciation(nextP);

  if (inJapanese instanceof Error === false) {
    let cacheQueries: {
      uid: AudioItemParams["uid"];
      pronunciation: AudioItemParams["q"];
      index?: AudioItemParams["index"];
      tl: AudioItemParams["tl"];
    }[] = [];
    if (!isJACached) {
      cacheQueries = [
        ...cacheQueries,
        {
          uid: nextP.uid,
          tl: "ja",
          pronunciation: inJapanese,
          index: reinforcedUID !== null ? undefined : nextSelectedIndex,
        },
      ];
    }
    if (!isENCached) {
      cacheQueries = [
        ...cacheQueries,
        {
          uid: nextP.uid + ".en",
          tl: "en",
          pronunciation: nextP.english,
          index: reinforcedUID !== null ? undefined : nextSelectedIndex,
        },
      ];
    }

    void getSynthVoiceBufferToCacheStore(
      dispatch,
      audioCacheStore,
      cacheQueries
    );
  }
}
