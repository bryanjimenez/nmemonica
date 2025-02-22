import { Avatar, Grow, LinearProgress } from "@mui/material";
import { PulseIcon, TrashIcon } from "@primer/octicons-react";
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
import { useDispatch } from "react-redux";

import VerbMain from "./VerbMain";
import VocabularyMain from "./VocabularyMain";
import { type AudioItemParams } from "../../constants/voiceConstants";
import {
  AudioBufferRecord,
  copyBufferFromCacheStore,
  copyBufferToCacheStore,
  getSynthVoiceBufferToCacheStore,
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
  getCacheUID,
  getPendingReduceFiltered,
  getTerm,
  getTermUID,
  initGoalPending,
  minimumTimeForSpaceRepUpdate,
  minimumTimeForTimedPlay,
  termFilterByType,
  toggleFuriganaSettingHelper,
  updateDailyGoal,
} from "../../helper/gameHelper";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import { getVerbFormsArray, verbToTargetForm } from "../../helper/JapaneseVerb";
import { setMediaSessionPlaybackState } from "../../helper/mediaHelper";
import {
  recallDebugLogHelper,
  recallNotificationHelper,
  spaceRepetitionOrder,
} from "../../helper/recallHelper";
import {
  alphaOrder,
  dateViewOrder,
  difficultyOrder,
  difficultySubFilter,
  randomOrder,
} from "../../helper/sortHelper";
import { SwipeDirection } from "../../helper/TouchSwipe";
import { useBlast } from "../../hooks/useBlast";
import { useConnectAudio } from "../../hooks/useConnectAudio";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useTimedGame } from "../../hooks/useTimedGame";
import { useWindowSize } from "../../hooks/useWindowSize";
import type { AppDispatch } from "../../slices";
import { playAudio } from "../../slices/audioHelper";
import { logger } from "../../slices/globalSlice";
import { TermSortBy, TermSortByLabel } from "../../slices/settingHelper";
import {
  deleteMetaVocab,
  flipVocabularyPracticeSide,
  furiganaToggled,
  getVocabulary,
  getVocabularyTags,
  removeFromSpaceRepetition,
  setPitchAccentData,
  setSpaceRepetitionMetadata,
  setWordAccuracy,
  setWordDifficulty,
  toggleAutoVerbView,
  toggleVocabularyTag,
  updateSpaceRepWord,
} from "../../slices/vocabularySlice";
import {
  getSynthAudioWorkaroundNoAsync,
  logAudioError,
} from "../../slices/voiceSlice";
import { AccuracySlider } from "../Form/AccuracySlider";
import ClickNavBtn from "../Form/ClickNavBtn";
import { DifficultySlider } from "../Form/DifficultySlider";
import { GoalResumeMessage } from "../Form/GoalResumeMessage";
import { NotReady } from "../Form/NotReady";
import {
  ApplyTagsBtn,
  AudioLoadingIcon,
  PronunciationWarningBtn,
  ShowHintBtn,
  ToggleAutoVerbViewBtn,
  ToggleFuriganaBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { RecallIntervalPreviewInfo } from "../Form/RecallIntervalPreviewInfo";
import { TagEditMenu } from "../Form/TagEditMenu";
import { Tooltip } from "../Form/Tooltip";
import VocabularyOrderSlider from "../Form/VocabularyOrderSlider";
import type { BareIdx } from "../Form/VocabularyOrderSlider";

const VocabularyMeta = {
  location: "/vocabulary/",
  label: "Vocabulary",
};

export default function Vocabulary() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies, debug } = useConnectSetting();
  const debugREF = useRef(debug);

  const { loadingAudio } = useConnectAudio();

  const [showPageMultiOrderScroller, setShowPageMultiOrderScroller] =
    useState(false);
  /** Alphabetic order quick scroll in progress */
  const isAlphaSortScrolling = useRef(false);

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const audioCacheStore = useRef<AudioBufferRecord>({});

  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef<number>(Date.now());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<string | undefined>(undefined);

  const naFlip = useRef<"-na" | undefined>(undefined);

  const [wasPlayed, setWasPlayed] = useState(false);

  const [scrollJOrder, setScrollJOrder] = useState(false);
  const [log, setLog] = useState<ConsoleMessage[]>([]);
  /** Is not undefined after user modifies accuracyP value */
  const accuracyModifiedRef = useRef<number | null>(undefined);

  const {
    motionThreshold,

    difficultyThreshold,

    vocabList,
    // not ref not modifiable during game
    sortMethod,

    // Refs
    filterType: filterTypeREF,
    hintEnabled: hintEnabledREF,
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
    return resumeSort === -1 ? sortMethod : resumeSort;
  }, [resumeSort, sortMethod]);

  const repMinItemReviewREF = useRef(spaRepMaxReviewItem);
  const difficultyThresholdREF = useRef(difficultyThreshold);

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

  /** Number of review items still pending (negative: goal already met)*/
  const goalPending = useRef<number>(-1);
  const [goalProgress, setGoalProgress] = useState<number | null>(null);
  const userSetGoal = useRef(viewGoal);

  const populateDataSetsRef = useRef(() => {
    if (vocabList.length === 0) {
      void dispatch(getVocabulary());
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

  const { filteredVocab, recallGame } = useMemo(
    function filterMemo() {
      if (vocabList.length === 0) return { filteredVocab: [], recallGame: -1 };
      if (
        Object.keys(metadata.current).length === 0 &&
        activeGroup.length === 0
      )
        return { filteredVocab: vocabList, recallGame: -1 };

      let recallGame = -1;
      let filtered = termFilterByType(
        filterTypeREF.current,
        vocabList,
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
      }

      return { filteredVocab: filtered, recallGame };
    },
    [
      filterTypeREF,
      sort,
      difficultyThresholdREF,
      vocabList,
      activeGroup,
      includeNew,
      includeReviewed,
    ]
  );

  const {
    newOrder: order,
    ebare,
    jbare,
  } = useMemo(
    function orderMemo() {
      if (filteredVocab.length === 0) return { newOrder: [] };

      let newOrder: number[] = [];
      let jOrder: undefined | { uid: string; label: string; idx: number }[];
      let eOrder: undefined | { uid: string; label: string; idx: number }[];
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
          newOrder = filteredVocab.map((_v, i) => i);
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

      return { newOrder, jbare: jOrder, ebare: eOrder };
    },
    [sort, filteredVocab]
  );

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
    dispatch,
    gotoNext,
    gotoPrev,
    reinforcedUID,
    selectedIndex,
    vocabList,
    verbForm,
    order,
    filteredVocab,
    naFlip,
    setWasPlayed,
    englishSideUp,
    setShowMeaning,
    audioCacheStore
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
      const yOffset = wSize.height - 60; //   horizontal alignment spacing
      const xOffset = halfWidth; //           vertical spacing

      setScreenOffset({ xOffset, yOffset });
    }
  }, [wSize.height, wSize.width]);

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

      if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
        const curUid =
          reinforcedUID ?? getTermUID(selectedIndex, filteredVocab, order);
        const v = getTerm(curUid, filteredVocab, vocabList);

        const index = reinforcedUID !== null ? undefined : selectedIndex;

        let vUid: string;
        let vQuery: string | Error;

        type QueryT = {
          uid: AudioItemParams["uid"];
          pronunciation: AudioItemParams["q"];
          index?: AudioItemParams["index"];
          tl: AudioItemParams["tl"];
        };

        let optionalNonAdjQuery: QueryT[] = [];
        let optionalAdjQuery: QueryT[] = [];

        if (JapaneseText.parse(v).isNaAdj()) {
          const naObj = partOfSpeechPronunciation(
            v,
            verbForm,
            naFlip.current !== undefined
              ? { current: "-na" }
              : { current: undefined }
          );
          const naObjWNa = partOfSpeechPronunciation(
            v,
            verbForm,
            naFlip.current === undefined
              ? { current: "-na" }
              : { current: undefined }
          );
          const naPron = audioPronunciation(naObj);
          const naPronWNa = audioPronunciation(naObjWNa);

          optionalAdjQuery = [
            { o: naObj, p: naPron },
            { o: naObjWNa, p: naPronWNa },
          ].reduce<QueryT[]>((acc, el) => {
            if (el.p instanceof Error === false) {
              return [
                ...acc,
                {
                  uid: getCacheUID(el.o),
                  tl: "ja",
                  pronunciation: el.p,
                  index,
                },
              ];
            }
            return acc;
          }, []);
        } else {
          // verb, noun, ..
          const sayObj = partOfSpeechPronunciation(v, verbForm, naFlip);

          vUid = getCacheUID(sayObj);
          vQuery = audioPronunciation(sayObj);
          if (vQuery instanceof Error === false) {
            optionalNonAdjQuery = [
              {
                uid: vUid,
                tl: "ja",
                pronunciation: vQuery,
                index,
              },
            ];
          }
        }

        void getSynthVoiceBufferToCacheStore(dispatch, audioCacheStore, [
          ...optionalNonAdjQuery,
          ...optionalAdjQuery,
          {
            uid: v.uid + ".en",
            tl: "en",
            pronunciation: v.english,
            index,
          },
        ]);
      }

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
              const messageLog = (
                m: ConsoleMessage["msg"],
                l: ConsoleMessage["lvl"]
              ) => dispatch(logger(m, l));
              spaceRepLog(messageLog, vocabulary, repStats);
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
      setShowMeaning(false);

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

    verbForm,
  ]);

  const getInnerPage = useCallback(
    (
      uid: string,
      vocabulary: RawVocabulary,
      isVerb: boolean,
      alreadyReviewed: boolean
    ) => {
      const verbFormDescr = isVerb
        ? (getVerbFormsArray(vocabulary).find((f) => f.name === verbForm)
            ?.description ?? "")
        : "";

      return (
        <div
          className={classNames({
            "vocabulary main-panel h-100": true,
            "disabled-color": alreadyReviewed,
          })}
        >
          <div
            style={{
              position: "absolute",
              top: yOffset,
              left: xOffset,
            }}
          >
            <div className="text-nowrap translate-center-x">
              {verbFormDescr}
            </div>
          </div>
          <div
            ref={blastElRef}
            className="text-nowrap fs-display-6 question-color"
          >
            {text}
          </div>
          <TagEditMenu
            visible={tagMenu}
            close={closeTagMenu}
            get={() =>
              dispatch(
                getVocabularyTags({ query: vocabulary.japanese })
              ).unwrap()
            }
            toggle={(tag: string) =>
              dispatch(
                toggleVocabularyTag({
                  query: vocabulary.japanese,
                  tag,
                })
              ).unwrap()
            }
            term={vocabulary}
            title={
              <div className="d-flex justify-content-between">
                <div>{JapaneseText.parse(vocabulary).toHTML()}</div>
                <div>Tags</div>
              </div>
            }
            tags={["Keigo", "Formal", "Colloquial", "Derogative"]}
          />

          <div
            ref={HTMLDivElementSwipeRef}
            className="d-flex justify-content-between h-100"
          >
            <ClickNavBtn direction="previous" action={gotoPrev} />
            {isVerb && autoVerbView ? (
              <VerbMain
                verb={vocabulary}
                linkToOtherTerm={(uid) => setReinforcedUID(uid)}
                showHint={showHint === uid}
                showMeaningSwipe={showMeaning}
              />
            ) : (
              <VocabularyMain
                vocabulary={vocabulary}
                showHint={showHint === uid}
                wasPlayed={wasPlayed}
                showMeaningSwipe={showMeaning}
              />
            )}
            <ClickNavBtn direction="next" action={gotoNext} />
          </div>
        </div>
      );
    },
    [
      dispatch,
      gotoNext,
      gotoPrev,
      closeTagMenu,
      HTMLDivElementSwipeRef,
      autoVerbView,
      showHint,
      showMeaning,
      wasPlayed,
      blastElRef,
      text,
      verbForm,
      xOffset,
      yOffset,
      tagMenu,
    ]
  );

  const pageOptionBar = useCallback(
    (
      uid: string,
      vocabulary: RawVocabulary,
      isVerb: boolean,
      hasFurigana: boolean,
      isHintable: boolean,
      reviewedToday: boolean,
      alreadyReviewed: boolean,
      revNotification?: string
    ) => (
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
                reviewed={alreadyReviewed}
                toggle={englishSideUp}
                action={
                  cookies
                    ? () => {
                        if (abortLoop()) {
                          resetTimedPlay();
                        }
                        void dispatch(flipVocabularyPracticeSide());
                      }
                    : undefined
                }
              />
              <ToggleAutoVerbViewBtn
                visible={isVerb}
                disabled={!cookies}
                reviewed={alreadyReviewed}
                toggleAutoVerbView={buildAction(dispatch, toggleAutoVerbView)}
                autoVerbView={autoVerbView}
              />
              <div
                className={classNames({
                  "sm-icon-grp": true,
                  "disabled-color": alreadyReviewed,
                })}
              >
                {!cookies ? null : loopSettingBtn}
              </div>
              {loopActionBtn && (
                <div
                  className={classNames({
                    "sm-icon-grp": true,
                    "disabled-color": alreadyReviewed,
                  })}
                >
                  {!cookies ? null : loopActionBtn}
                </div>
              )}
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
              {/* {timedPlayVerifyBtn(metadata.current[uid]?.pron === true)} */}
              <PronunciationWarningBtn
                visible={metadata.current[uid]?.pron === true}
                disabled={!cookies}
                reviewed={alreadyReviewed}
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
                <div className="h-100 d-flex flex-column justify-content-between me-2">
                  <div
                    className="clickable"
                    onClick={() => {
                      void dispatch(deleteMetaVocab([uid]));
                    }}
                  >
                    <TrashIcon />
                  </div>
                  <div className="d-flex flex-column">
                    <div>
                      <ToggleFuriganaBtn
                        disabled={!cookies}
                        active={hasFurigana}
                        toggle={
                          toggleFuriganaSettingHelper(
                            vocabulary.uid,
                            metadata.current
                          ).furigana.show
                        }
                        toggleFurigana={buildAction(dispatch, furiganaToggled)}
                        vocabulary={vocabulary}
                      />
                    </div>
                    <div
                      className={classNames({
                        clickable: true,
                        "opacity-25": metadata.current[uid]?.pron !== true,
                      })}
                      onClick={() => {
                        // null: set to undefined
                        const v =
                          metadata.current[uid]?.pron === true ? null : true;
                        dispatch(setPitchAccentData({ uid, value: v }));
                      }}
                    >
                      <PulseIcon />
                    </div>
                  </div>
                </div>
              </Tooltip>
              <ShowHintBtn
                visible={hintEnabledREF.current}
                disabled={!cookies}
                active={isHintable}
                reviewed={alreadyReviewed}
                setShowHint={setStateFunction(setShowHint, (prev) =>
                  prev !== undefined ? undefined : uid
                )}
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
    ),
    [
      dispatch,
      abortLoop,
      resetTimedPlay,
      openTagMenu,
      cookies,
      autoVerbView,
      englishSideUp,
      hintEnabledREF,
      loopActionBtn,
      loopSettingBtn,
      sort,
      loadingAudio,
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
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     v: vocabList.length,
  //     ord: order.length,
  //     rep: Object.keys(metadata.current).length,
  //     filt: filteredVocab.length,
  //   })
  // );

  const vocabulary = getTerm(uid, filteredVocab, vocabList);
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
        color={goalProgress === null ? "primary" : "warning"}
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

function useBuildGameActionsHandler(
  dispatch: AppDispatch,
  gotoNext: () => void,
  gotoPrev: () => void,
  reinforcedUID: string | null,
  selectedIndex: number,
  vocabList: RawVocabulary[],
  verbForm: string,
  order: number[],
  filteredVocab: RawVocabulary[],
  naFlip: React.RefObject<string | undefined>,
  setWasPlayed: (value: boolean) => void,
  englishSideUp: boolean,
  setShowMeaning: React.Dispatch<React.SetStateAction<boolean>>,
  audioCacheStore: React.RefObject<AudioBufferRecord>
) {
  return useCallback(
    async (direction: SwipeDirection, AbortController?: AbortController) => {
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
          reinforcedUID ?? getTermUID(selectedIndex, filteredVocab, order);
        const vocabulary = getTerm(uid, vocabList);

        setWasPlayed(true);

        if (
          (englishSideUp && direction === "up") ||
          (!englishSideUp && direction === "down")
        ) {
          setShowMeaning(true);
        }

        if (direction === "up") {
          setMediaSessionPlaybackState("playing");

          const sayObj = partOfSpeechPronunciation(
            vocabulary,
            verbForm,
            naFlip
          );
          const vUid = getCacheUID(sayObj);

          const cachedAudioBuf = copyBufferFromCacheStore(
            audioCacheStore,
            vUid
          );

          if (cachedAudioBuf !== undefined) {
            actionPromise = playAudio(cachedAudioBuf);
          } else {
            const vQuery = audioPronunciation(sayObj);
            if (vQuery instanceof Error) {
              dispatch(logger(vQuery.message, DebugLevel.ERROR));
              return Promise.reject(vQuery);
            }
            try {
              const res = await dispatch(
                getSynthAudioWorkaroundNoAsync({
                  key: vUid,
                  index: reinforcedUID !== null ? undefined : selectedIndex,
                  tl: "ja",
                  q: vQuery,
                })
              ).unwrap();

              const cachedAudioBuf = copyBufferToCacheStore(
                audioCacheStore,
                res.uid,
                res.buffer
              );

              return playAudio(cachedAudioBuf);
            } catch (exception) {
              logAudioError(dispatch, exception, vQuery, "onSwipe");
              return Promise.resolve();
            }
          }
        } else {
          //if (direction === "down")
          setMediaSessionPlaybackState("playing");

          const inEnglish = vocabulary.english;

          const enUid = vocabulary.uid + ".en";

          const cachedAudioBuf = copyBufferFromCacheStore(
            audioCacheStore,
            enUid
          );

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

              return playAudio(cachedAudioBuf);
            } catch (exception) {
              logAudioError(dispatch, exception, inEnglish, "onSwipe");
              return Promise.resolve();
            }
          }
        }
      }
      return actionPromise;
    },
    [
      dispatch,
      gotoNext,
      gotoPrev,
      reinforcedUID,
      selectedIndex,
      vocabList,
      verbForm,
      order,
      filteredVocab,
      naFlip,
      setWasPlayed,
      englishSideUp,
      setShowMeaning,

      audioCacheStore,
    ]
  );
}

export { VocabularyMeta };

function partOfSpeechPronunciation(
  vocabulary: RawVocabulary,
  verbForm: string,
  naFlip: React.RefObject<string | undefined>
) {
  let sayObj;
  if (vocabulary.grp === "Verb" && verbForm !== "dictionary") {
    const verb = verbToTargetForm(vocabulary, verbForm);

    if (verb instanceof Error) {
      // when target form fails fall back to root
      return vocabulary;
    }

    sayObj = {
      ...vocabulary,
      japanese: verb.toString(),
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      pronounce: vocabulary.pronounce && verb.getPronunciation(),
      form: verbForm,
    };
  } else if (JapaneseText.parse(vocabulary).isNaAdj()) {
    const naAdj = JapaneseText.parse(vocabulary).append(
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      naFlip.current && "な"
    );

    sayObj = {
      ...vocabulary,
      japanese: naAdj.toString(),
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      pronounce: vocabulary.pronounce && naAdj.getPronunciation(),
      form: naFlip.current,
    };

    naFlip.current = naFlip.current !== undefined ? undefined : "-na";
  } else {
    sayObj = vocabulary;
  }

  return sayObj;
}
