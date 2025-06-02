import { LinearProgress } from "@mui/material";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@primer/octicons-react";
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

import {
  AudioBufferRecord,
  copyBufferFromCacheStore,
  copyBufferToCacheStore,
  getSynthVoiceBufferToCacheStore,
} from "../../helper/audioSynthPreCache";
import { daysSince, spaceRepLog, wasToday } from "../../helper/consoleHelper";
import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import {
  englishLabel,
  getCacheUID,
  getTerm,
  getTermUID,
  initGoalPending,
  japaneseLabel,
  labelPlacementHelper,
  minimumTimeForSpaceRepUpdate,
  // minimumTimeForTimedPlay,
  play,
  termFilterByType,
  updateDailyGoal,
} from "../../helper/gameHelper";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import {
  getPercentOverdue,
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
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
// import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
// import { useMediaSession } from "../../hooks/useMediaSession";
import { useSwipeActions } from "../../hooks/useSwipeActions";
// import { useTimedGame } from "../../hooks/useTimedGame";
import type { AppDispatch } from "../../slices";
import { playAudio } from "../../slices/audioHelper";
import {
  type AudioItemParams,
  getSynthAudioWorkaroundNoAsync,
} from "../../slices/audioSlice";
import { logger } from "../../slices/globalSlice";
import {
  addFrequencyPhrase,
  deleteMetaPhrase,
  flipPhrasesPracticeSide,
  getPhrase,
  getPhraseTags,
  removeFrequencyPhrase,
  removeFromSpaceRepetition,
  setPhraseAccuracy,
  setPhraseDifficulty,
  setSpaceRepetitionMetadata,
  togglePhraseTag,
  togglePhrasesFilter,
  updateSpaceRepPhrase,
} from "../../slices/phraseSlice";
import {
  DebugLevel,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import { getStackInitial } from "../../workers";
import { AccuracySlider } from "../Form/AccuracySlider";
import AudioItem from "../Form/AudioItem";
import type { ConsoleMessage } from "../Form/Console";
import DialogMsg from "../Form/DialogMsg";
import { DifficultySlider } from "../Form/DifficultySlider";
import { GoalResumeMessage } from "../Form/GoalResumeMessage";
import { NotReady } from "../Form/NotReady";
import {
  ApplyTagsBtn,
  ToggleFrequencyTermBtnMemo,
  ToggleLiteralPhraseBtn,
  TogglePracticeSideBtn,
  ViewLessonsBtn,
} from "../Form/OptionsBar";
import { RecallIntervalPreviewInfo } from "../Form/RecallIntervalPreviewInfo";
import Sizable from "../Form/Sizable";
import StackNavButton from "../Form/StackNavButton";
import { TagEditMenu } from "../Form/TagEditMenu";
import { Tooltip } from "../Form/Tooltip";

const PhrasesMeta = {
  location: "/phrases/",
  label: "Phrases",
};

export default function Phrases() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies } = useConnectSetting();

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const audioCacheStore = useRef<AudioBufferRecord>({});

  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef(Date.now());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [showRomaji, setShowRomaji] = useState<boolean>(false);
  const [showLit, setShowLit] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<string[]>([]); //subset of frequency words within current active group
  const [log, setLog] = useState<ConsoleMessage[]>([]);
  /** Is not undefined after user modifies accuracyP value */
  const accuracyModifiedRef = useRef<undefined | null | number>();

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
    reinforce: reinforceREF,
    romajiActive,
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

  /** Number of review items still pending (-1: no goal or already met)*/
  const goalPending = useRef<number>(-1);
  const [goalProgress, setGoalProgress] = useState<number | null>(null);
  const userSetGoal = useRef(viewGoal);

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

    goalPending.current = initGoalPending(
      userSetGoal.current,
      metadata.current
    );
  }, []);

  const { blastElRef, text, setText } = useBlast({
    top: 10,
  });

  const filteredPhrases = useMemo(() => {
    const firstRepObject = metadata.current;
    if (phraseList.length === 0) return [];
    if (Object.keys(firstRepObject).length === 0 && activeGroup.length === 0)
      return phraseList;

    const allFrequency = Object.keys(firstRepObject).reduce<string[]>(
      (acc, cur) => {
        if (firstRepObject[cur]?.rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    let filtered = termFilterByType(
      filterTypeREF.current,
      phraseList,
      allFrequency,
      activeGroup,
      buildAction(dispatch, togglePhrasesFilter)
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
            accuracy: accuracyP / 100,
            daysSinceReview,
            daysBetweenReviews,
          });

          return p.toFixed(2).replace(".00", "").replace("0.", ".");
        });

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
      default:
        break;
    }

    const frequency = filtered.reduce<string[]>((acc, cur) => {
      if (firstRepObject[cur.uid]?.rein === true) {
        acc = [...acc, cur.uid];
      }
      return acc;
    }, []);
    setFrequency(frequency);

    return filtered;
  }, [
    filterTypeREF,
    sort,
    difficultyThresholdREF,
    dispatch,
    phraseList,
    activeGroup,
    includeNew,
    includeReviewed,
  ]);

  const { order, recallGame } = useMemo(() => {
    const repetition = metadata.current;
    if (filteredPhrases.length === 0) return { order: [], recallGame: -1 };

    let newOrder: number[];
    let recallGame = -1;
    switch (sort) {
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredPhrases, repetition);

        let newN = 0;
        let oldDt = NaN;
        const views = newOrder.map((i) => {
          const d = metadata.current[filteredPhrases[i].uid]?.lastView;
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

      case TermSortBy.RECALL:
        const {
          failed,
          overdue,
          notPlayed: nonPending,
          todayDone,
        } = spaceRepetitionOrder(filteredPhrases, metadata.current);
        const pending = [...failed, ...overdue];

        if (pending.length > 0) {
          newOrder = pending;
        } else {
          newOrder = [...nonPending, ...todayDone];
        }
        recallGame = pending.length;

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

    return { order: newOrder, recallGame };
  }, [sort, filteredPhrases]);

  const gotoNext = useCallback(() => {
    const l = filteredPhrases.length;
    let newSel = (selectedIndex + 1) % l;

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(null);
  }, [filteredPhrases, selectedIndex, lastNext]);

  const gotoNextSlide = useCallback(() => {
    play(
      reinforceREF.current,
      filterTypeREF.current,
      frequency,
      filteredPhrases,
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
    filteredPhrases,
    reinforcedUID,
    gotoNext,
  ]);

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
    gotoNextSlide,
    gotoPrev,
    reinforcedUID,
    selectedIndex,
    phraseList,
    order,
    filteredPhrases,
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

      if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
        const curUid =
          reinforcedUID ?? getTermUID(selectedIndex, filteredPhrases, order);
        const curP = getTerm(curUid, filteredPhrases, phraseList);
        const inJapanese = audioPronunciation(curP);

        void getSynthVoiceBufferToCacheStore(dispatch, audioCacheStore, [
          {
            uid: curP.uid,
            tl: "ja",
            pronunciation: inJapanese,
            index: reinforcedUID !== null ? undefined : selectedIndex,
          },
          {
            uid: curP.uid + ".en",
            tl: "en",
            pronunciation: curP.english,
            index: reinforcedUID !== null ? undefined : selectedIndex,
          },
        ]).catch((exception) => {
          // likely getAudio failed

          if (exception instanceof Error) {
            let msg = exception.message;
            if (msg === "unreachable") {
              const stack = "at " + getStackInitial(exception);
              msg = `cache:${curP.english} ${inJapanese} ${stack}`;
            }
            dispatch(logger(msg, DebugLevel.ERROR));
          }
        });
      }

      updateDailyGoal({
        viewGoal,
        msg: "Phrase Goal Reached!",
        lastView: metadata.current[uid]?.lastView,
        selectedIndex,
        prevSelectedIndex: prevState.selectedIndex,
        prevTimestamp: prevState.lastNext,
        progressTotal: filteredPhrases.length,
        goalPending,
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
          const frequency = prevState.reinforcedUID !== null;

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
              const messageLog = (m: string, l: number) =>
                dispatch(logger(m, l));

              spaceRepLog(messageLog, p, repStats, { frequency });
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
      setShowRomaji(false);
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

  const addFrequencyTermCB = useCallback(
    (uid: string) => {
      setFrequency((f) => [...f, uid]);
      buildAction(dispatch, addFrequencyPhrase)(uid);
    },
    [dispatch]
  );

  const removeFrequencyTermCB = useCallback(
    (uid: string) => {
      setFrequency((f) => f.filter((id) => id !== uid));
      buildAction(dispatch, removeFrequencyPhrase)(uid);
    },
    [dispatch]
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
  //     rein: (reinforcedUID && reinforcedUID.slice(0, 6)) || "",
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     p: phrases.length,
  //     ord: order.length,
  //     rep: Object.keys(metadata.current).length,
  //     fre: frequency.length,
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

  const phrase_reinforce = repetition[phrase.uid]?.rein === true;

  const romaji = phrase.romaji;

  const progress = ((selectedIndex + 1) / filteredPhrases.length) * 100;
  const reviewedToday = wasToday(metadata.current[uid]?.lastReview);
  const viewedToday = wasToday(metadata.current[uid]?.lastView);
  /** Item reviewed in current game */
  const alreadyReviewed = recallGame > 0 && viewedToday;

  const revNotification = recallNotificationHelper(
    metadata.current[uid]?.daysBetweenReviews,
    metadata.current[uid]?.lastReview
  );

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
          className="text-nowrap fs-display-6 question-color"
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
          <StackNavButton ariaLabel="Previous" action={gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          <div className="pt-3 d-flex flex-column justify-content-around text-center">
            <Sizable
              breakPoint="md"
              largeClassName={aboveLargeCss}
              smallClassName={aboveSmallCss}
            >
              {topValue}
            </Sizable>
            {romajiActive.current && romaji !== undefined && (
              <span className="fs-5">
                <span
                  onClick={setStateFunction(setShowRomaji, (romaji) => !romaji)}
                  className="clickable loop-no-interrupt"
                >
                  {showRomaji ? romaji : "[Romaji]"}
                </span>
              </span>
            )}
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
          <StackNavButton ariaLabel="Next" action={gotoNextSlide}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
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
              <ToggleFrequencyTermBtnMemo
                disabled={!cookies}
                reviewed={alreadyReviewed}
                addFrequencyTerm={addFrequencyTermCB}
                removeFrequencyTerm={removeFrequencyTermCB}
                hasReinforce={phrase_reinforce}
                isReinforced={reinforcedUID !== null}
                term={phrase}
                count={frequency.length}
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
          color={
            goalProgress === null
              ? phrase_reinforce
                ? "secondary"
                : "primary"
              : "warning"
          }
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
) {
  const audioWords: AudioItemParams = englishSideUp
    ? { tl: "en", q: phrase.english, uid: phrase.uid + ".en" }
    : {
        tl: "ja",
        q: audioPronunciation(phrase),
        uid: getCacheUID(phrase),
      };

  return (
    <AudioItem visible={swipeThreshold === 0 && loop === 0} word={audioWords} />
  );
}

function buildGameActionsHandler(
  dispatch: AppDispatch,
  gotoNextSlide: () => void,
  gotoPrev: () => void,
  reinforcedUID: string | null,
  selectedIndex: number,
  phrases: RawPhrase[],
  order: number[],
  filteredPhrases: RawPhrase[],
  audioCacheStore: React.MutableRefObject<AudioBufferRecord>
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
        reinforcedUID ?? getTermUID(selectedIndex, filteredPhrases, order);
      const phrase = getTerm(uid, phrases);

      if (direction === "up") {
        const cachedAudioBuf = copyBufferFromCacheStore(
          audioCacheStore,
          phrase.uid
        );

        if (cachedAudioBuf !== undefined) {
          actionPromise = playAudio(cachedAudioBuf);
        } else {
          const inJapanese = audioPronunciation(phrase);

          try {
            const res = await dispatch(
              getSynthAudioWorkaroundNoAsync({
                key: phrase.uid,
                index: reinforcedUID !== null ? undefined : selectedIndex,
                tl: "ja",
                q: inJapanese,
              })
            ).unwrap();

            actionPromise = new Promise<{ uid: string; buffer: ArrayBuffer }>(
              (resolve) => {
                resolve({
                  uid: res.uid,
                  buffer: copyBufferToCacheStore(
                    audioCacheStore,
                    res.uid,
                    res.buffer
                  ),
                });
              }
            ).then((res) => {
              if (phrase.uid === res.uid) {
                return playAudio(res.buffer, AbortController);
              }
              throw new Error("Incorrect uid");
            });
          } catch (exception) {
            if (exception instanceof Error) {
              let msg = exception.message;
              if (msg === "unreachable") {
                const stack = "at " + getStackInitial(exception);
                msg = `tts:${inJapanese} ${stack}`;
              }
              dispatch(logger(msg, DebugLevel.ERROR));
            }
            return Promise.resolve();
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

            actionPromise = new Promise<{ uid: string; buffer: ArrayBuffer }>(
              (resolve) => {
                resolve({
                  uid: res.uid,
                  buffer: copyBufferToCacheStore(
                    audioCacheStore,
                    res.uid,
                    res.buffer
                  ),
                });
              }
            ).then((res) => {
              if (enUid === res.uid) {
                return playAudio(res.buffer, AbortController);
              }
              throw new Error("Incorrect uid");
            });
          } catch (exception) {
            if (exception instanceof Error) {
              let msg = exception.message;
              if (msg === "unreachable") {
                const stack = "at " + getStackInitial(exception);
                msg = `tts:${inEnglish} ${stack}`;
              }
              dispatch(logger(msg, DebugLevel.ERROR));
            }
            return Promise.resolve();
          }
        }
      }
    }
    return actionPromise;
  };
}

export { PhrasesMeta };
