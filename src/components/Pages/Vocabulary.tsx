import { Avatar, Grow, LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { PayloadAction } from "@reduxjs/toolkit";
import classNames from "classnames";
import partition from "lodash/partition";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import VerbMain from "./VerbMain";
import VocabularyMain from "./VocabularyMain";
import { pronounceEndoint } from "../../../environment.development";
import { fetchAudio } from "../../helper/audioHelper.development";
import {
  daysSince,
  msgInnerTrim,
  spaceRepLog,
  timedPlayLog,
} from "../../helper/consoleHelper";
import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import {
  alphaOrder,
  dateViewOrder,
  difficultyOrder,
  difficultySubFilter,
  getCacheUID,
  getTerm,
  getTermUID,
  minimumTimeForSpaceRepUpdate,
  minimumTimeForTimedPlay,
  play,
  randomOrder,
  spaceRepOrder,
  termFilterByType,
  toggleFuriganaSettingHelper,
  verbToTargetForm,
} from "../../helper/gameHelper";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import { setMediaSessionPlaybackState } from "../../helper/mediaHelper";
import { spaceRepetitionOrder } from "../../helper/recallHelper";
import { addParam } from "../../helper/urlHelper";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useTimedGame } from "../../hooks/useTimedGame";
import type { AppDispatch } from "../../slices";
import { logger } from "../../slices/globalSlice";
import { DebugLevel, TermSortBy } from "../../slices/settingHelper";
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
import type { MetaDataObj, RawVocabulary } from "../../typings/raw";
import { AccuracySlider } from "../Form/AccuracySlider";
import { ConsoleMessage } from "../Form/Console";
import { DifficultySlider } from "../Form/DifficultySlider";
import { NotReady } from "../Form/NotReady";
import {
  ReCacheAudioBtn,
  ShowHintBtn,
  ToggleAutoVerbViewBtn,
  ToggleFrequencyTermBtnMemo,
  ToggleFuriganaBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
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

  const [showPageBar, setShowPageBar] = useState(false);
  /** Alphabetic order quick scroll in progress */
  const isAlphaSortScrolling = useRef(false);

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  // const [errorMsgs, setErrorMsgs] = useState<ConsoleMessage[]>([]);
  // const [errorSkipIndex, setErrorSkipIndex] = useState(-1);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef<number>(Date.now());
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [showHint, setShowHint] = useState<string | undefined>(undefined);

  const [frequency, setFrequency] = useState<string[]>([]); // subset of frequency words within current active group

  const [recacheAudio, setRecacheAudio] = useState(false);
  const naFlip = useRef();

  const [scrollJOrder, setScrollJOrder] = useState(false);
  const [log, setLog] = useState<ConsoleMessage[]>([]);
  /** Is not undefined after user modifies accuracy value */
  const accuracyModifiedRef = useRef<undefined | null | number>();

  const {
    motionThreshold,

    vocabList,

    // Refs
    memoThreshold: memoThresholdREF,
    reinforce: reinforceREF,
    filterType: filterTypeREF,
    hintEnabled: hintEnabledREF,
    sortMethod: sortMethodREF,
    activeGroup,

    // modifiable during game
    autoVerbView,
    englishSideUp,
    verbForm,
    repetition,
    spaRepMaxReviewItem,
  } = useConnectVocabulary();

  const repMinItemReviewREF = useRef(spaRepMaxReviewItem);

  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  useEffect(() => {
    if (vocabList.length === 0) {
      void dispatch(getVocabulary());
    }
  }, []);

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

    switch (sortMethodREF.current) {
      case TermSortBy.DIFFICULTY: {
        // exclude vocab with difficulty beyond memoThreshold
        const subFilter = difficultySubFilter(
          memoThresholdREF.current,
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
        break;
      }
      case TermSortBy.GAME:
        if (reinforceREF.current) {
          // if reinforce, place reinforced/frequency terms
          // at the end
          const [freqTerms, nonFreqTerms] = partition(
            filtered,
            (o) => metadata.current[o.uid]?.rein === true
          );

          filtered = [...nonFreqTerms, ...freqTerms];
        }
        break;
      case TermSortBy.RECALL:
        // discard the nonPending terms
        const { failed, overdue } = spaceRepetitionOrder(
          filtered,
          metadata.current,
          repMinItemReviewREF.current
        );
        const pending = [...failed, ...overdue];

        if (pending.length > 0) {
          filtered = pending.map((p) => filtered[p]);
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
  }, [dispatch, vocabList, activeGroup]);

  const {
    newOrder: order,
    ebare,
    jbare,
    recallGame,
  } = useMemo(() => {
    if (filteredVocab.length === 0) return { newOrder: [] };

    let log: undefined | ConsoleMessage[];
    let newOrder: undefined | number[];
    let jOrder: undefined | { uid: string; label: string; idx: number }[];
    let eOrder: undefined | { uid: string; label: string; idx: number }[];
    let recallGame: number | undefined;
    switch (sortMethodREF.current) {
      case TermSortBy.RANDOM:
        newOrder = randomOrder(filteredVocab);
        setLog((l) => [
          ...l,
          { msg: `Random [${newOrder?.length ?? 0}]`, lvl: DebugLevel.DEBUG },
        ]);

        break;
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredVocab, metadata.current);
        setLog((l) => [
          ...l,
          {
            msg: `Date Viewed [${newOrder?.length ?? 0}]`,
            lvl: DebugLevel.DEBUG,
          },
        ]);

        break;
      case TermSortBy.GAME:
        if (reinforceREF.current) {
          // search backwards for splitIdx where [...nonFreqTerms, ...freqTerms]
          let splitIdx = -1;
          for (let idx = filteredVocab.length - 1; idx > -1; idx--) {
            const currEl = metadata.current[filteredVocab[idx].uid];
            const prevIdx = idx - 1 > -1 ? idx - 1 : 0;
            const prevEl = metadata.current[filteredVocab[prevIdx].uid];
            if (currEl?.rein === true && !prevEl?.rein) {
              splitIdx = idx;
              break;
            }
          }

          if (splitIdx !== -1) {
            const nonFreqTerms = filteredVocab.slice(0, splitIdx);
            const freqTerms = filteredVocab.slice(splitIdx);

            const nonFreqOrder = spaceRepOrder(nonFreqTerms, metadata.current);
            const freqOrder = freqTerms.map((f, i) => nonFreqTerms.length + i);
            newOrder = [...nonFreqOrder, ...freqOrder];
          }
        }

        // not reinforced or no reinforcement terms
        if (newOrder === undefined) {
          newOrder = spaceRepOrder(filteredVocab, metadata.current);
        }

        setLog((l) => [
          ...l,
          {
            msg: `Space Rep 1 [${newOrder?.length ?? 0}]`,
            lvl: DebugLevel.DEBUG,
          },
        ]);
        break;

      case TermSortBy.DIFFICULTY:
        // exclude vocab with difficulty beyond memoThreshold

        newOrder = difficultyOrder(filteredVocab, metadata.current);
        setLog((l) => [
          ...l,
          {
            msg: `Difficulty [${newOrder?.length ?? 0}]`,
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
        } = spaceRepetitionOrder(
          filteredVocab,
          metadata.current,
          repMinItemReviewREF.current
        );
        const pending = [...failed, ...overdue];

        if (pending.length > 0) {
          newOrder = pending;
        } else {
          newOrder = [...nonPending, ...todayDone];
        }
        recallGame = pending.length;

        setLog((l) => [
          ...l,
          {
            msg: `Space Rep 2 [${pending.length}]`,
            lvl: pending.length === 0 ? DebugLevel.WARN : DebugLevel.DEBUG,
          },
        ]);

        break;

      default: //TermSortBy.ALPHABETIC:
        ({ order: newOrder, jOrder, eOrder } = alphaOrder(filteredVocab));

        setLog((l) => [
          ...l,
          {
            msg: `Alphabetic [${newOrder?.length ?? 0}]`,
            lvl: DebugLevel.DEBUG,
          },
        ]);
        break;
    }

    // jbare, // bare min Japanese ordered word list
    // ebare, // bare min English ordered word list

    setScrollJOrder(true);

    return { newOrder, jbare: jOrder, ebare: eOrder, log, recallGame };
  }, [filteredVocab]);

  // Logger messages
  useEffect(() => {
    log.forEach((message) => {
      dispatch(logger(message.msg, message.lvl));
    });
  }, [dispatch, log]);

  const gotoNext = useCallback(() => {
    const l = filteredVocab.length;
    let newSel = (selectedIndex + 1) % l;

    // if (newSel === errorSkipIndex) {
    //   newSel = (l + newSel + 1) % l;
    // }

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
  }, [dispatch, frequency, filteredVocab, reinforcedUID, gotoNext]);

  const gotoPrev = useCallback(() => {
    const l = filteredVocab.length;
    const i = selectedIndex - 1;

    let newSel;
    if (reinforcedUID) {
      newSel = selectedIndex;
    } else {
      newSel = (l + i) % l;
    }

    // if (newSel === errorSkipIndex) {
    //   newSel = (l + newSel - 1) % l;
    // }

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(null);
  }, [filteredVocab, selectedIndex, reinforcedUID, lastNext]);

  const gameActionHandler = buildGameActionsHandler(
    gotoNextSlide,
    gotoPrev,
    reinforcedUID,
    selectedIndex,
    vocabList,
    verbForm,
    order,
    filteredVocab,
    recacheAudio,
    naFlip
  );

  const deviceMotionEvent = useDeviceMotionActions(motionThreshold);

  const {
    beginLoop,
    abortLoop,
    looperSwipe,

    loopSettingBtn,
    loopActionBtn,
    timedPlayVerifyBtn,

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

  useEffect(() => {
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
        getTermUID(prevState.selectedIndex, filteredVocab, order);

      const vocabulary = getTerm(uid, vocabList);
      gradeTimedPlayEvent(dispatch, uid, metadata.current);

      let spaceRepUpdated: Promise<unknown> = Promise.resolve();
      if (
        metadata.current[uid]?.difficulty &&
        accuracyModifiedRef.current
        // typeof accuracyModifiedRef.current === 'number' &&
        // accuracyModifiedRef.current > 0
      ) {
        // when difficulty exists and accuracy has been set
        spaceRepUpdated = dispatch(setSpaceRepetitionMetadata({ uid }));
      } else if (accuracyModifiedRef.current === null) {
        // when accuracy is nulled
        spaceRepUpdated = dispatch(removeFromSpaceRepetition({ uid }));
      }

      if (recallGame && recallGame > 0 && selectedIndex === recallGame + 1) {
        // just finished recall game
        dispatch(logger("No more pending items", DebugLevel.DEBUG));
      }

      void spaceRepUpdated.then(
        (action: PayloadAction<Record<string, MetaDataObj>>) => {
          if (action && "payload" in action) {
            const meta = action.payload;

            const overDue = meta[uid].percentOverdue;
            const w = msgInnerTrim(vocabulary.english, 30);
            const msg =
              overDue === undefined
                ? `Space Rep [${w}] removed`
                : `Space Rep [${w}] updated ${overDue}`;

            dispatch(logger(msg, DebugLevel.WARN));
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
                if (accuracyModifiedRef.current && prevVal.lastReview) {
                  // if term was reviewed
                  prevDate = prevVal.lastReview;
                } else {
                  prevDate = prevVal.d ?? value.d;
                }

                const repStats = { [uid]: { ...value, d: prevDate } };
                const messageLog = (m: string, l: number) =>
                  dispatch(logger(m, l));
                if (tpAnsweredREF.current !== undefined) {
                  timedPlayLog(messageLog, vocabulary, repStats, { frequency });
                } else {
                  spaceRepLog(messageLog, vocabulary, repStats, { frequency });
                }
              });
          }
        }
      );

      const wasReset = resetTimedPlay();
      if (wasReset) {
        if (minimumTimeForTimedPlay(prevState.lastNext)) {
          beginLoop();
        }
      }

      setShowHint(undefined);
      // setErrorMsgs([]);
      prevSelectedIndex.current = selectedIndex;
      prevReinforcedUID.current = reinforcedUID;
      accuracyModifiedRef.current = undefined;
    }
  }, [
    dispatch,
    beginLoop,
    gradeTimedPlayEvent,
    resetTimedPlay,
    vocabList,
    reinforcedUID,
    selectedIndex,
    filteredVocab,
    order,
    recallGame,
  ]);

  // FIXME: implement error handling
  // if (errorMsgs.length > 0) {
  //   const minState = logify(this.state);
  //   const minProps = logify(this.props);

  //   const messages = [
  //     ...errorMsgs,
  //     { msg: "props:", lvl: DebugLevel.WARN, css: "px-2" },
  //     { msg: minProps, lvl: DebugLevel.WARN, css: "px-4" },
  //     { msg: "state:", lvl: DebugLevel.WARN, css: "px-2" },
  //     { msg: minState, lvl: DebugLevel.WARN, css: "px-4" },
  //   ];

  //   return (
  //     <MinimalUI next={gotoNext} prev={gotoPrev}>
  //       <div className="d-flex flex-column justify-content-around">
  //         <Console messages={messages} />
  //       </div>
  //     </MinimalUI>
  //   );
  // }

  if (recallGame === 0)
    return <NotReady addlStyle="main-panel" text="No pending items" />;
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

  const vocabulary = getTerm(uid, vocabList);
  const vocabulary_reinforce = metadata.current[vocabulary.uid]?.rein === true;

  const isVerb = vocabulary.grp === "Verb";

  const jText = JapaneseText.parse(vocabulary);
  const hasFurigana = jText.hasFurigana();
  const hasJHint = jText.isHintable(3);
  const hasEHint = vocabulary.grp !== undefined && vocabulary.grp !== "";

  const isHintable = showHint !== uid && englishSideUp ? hasJHint : hasEHint;

  let pIdx = selectedIndex;
  let pList: BareIdx[] = [];

  if (scrollJOrder) {
    if (jbare) {
      pList = jbare;
    }
  } else {
    if (jbare) {
      pIdx = jbare[selectedIndex].idx;
    }
    if (ebare) {
      pList = ebare;
    }
  }

  const progress = ((selectedIndex + 1) / filteredVocab.length) * 100;

  let page = (
    <React.Fragment>
      <div className="vocabulary main-panel h-100">
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
            />
          )}

          <StackNavButton ariaLabel="Next" action={gotoNextSlide}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>
    </React.Fragment>
  );

  const wasReviewed = metadata.current[uid]?.lastReview;
  const reviewedToday =
    wasReviewed !== undefined && daysSince(wasReviewed) === 0;

  if (!showPageBar) {
    page = (
      <React.Fragment>
        {page}
        <div className="options-bar mb-3 flex-shrink-1">
          <div className="row opts-max-h">
            <div className="col">
              <div className="d-flex justify-content-start">
                <TogglePracticeSideBtn
                  toggle={englishSideUp}
                  action={() => {
                    if (abortLoop()) {
                      resetTimedPlay();
                    }
                    dispatch(flipVocabularyPracticeSide());
                  }}
                />
                <ReCacheAudioBtn
                  active={recacheAudio}
                  action={buildRecacheAudioHandler(
                    recacheAudio,
                    setRecacheAudio
                  )}
                />
                <ToggleAutoVerbViewBtn
                  visible={isVerb}
                  toggleAutoVerbView={buildAction(dispatch, toggleAutoVerbView)}
                  autoVerbView={autoVerbView}
                />
                <div className="sm-icon-grp">{loopSettingBtn}</div>
                <div className="sm-icon-grp">{loopActionBtn}</div>
              </div>
            </div>
            <div className="col">
              <div className="d-flex justify-content-end">
                {timedPlayVerifyBtn(metadata.current[uid]?.pron === true)}
                <Tooltip
                  className={classNames({
                    "question-color opacity-50":
                      sortMethodREF.current === TermSortBy.RECALL &&
                      !reviewedToday,
                    "done-color opacity-50": reviewedToday,
                  })}
                >
                    <DifficultySlider
                      difficulty={metadata.current[uid]?.difficulty}
                      resetOn={uid}
                      onChange={(difficulty: number | null) => {
                        if (difficulty !== undefined) {
                          dispatch(setWordDifficulty(uid, difficulty));
                        }
                      }}
                    />
                    <AccuracySlider
                      accuracy={metadata.current[uid]?.accuracy}
                      resetOn={uid}
                      onChange={(accuracy: number | null) => {
                        if (accuracy !== undefined) {
                          dispatch(setWordAccuracy(uid, accuracy));
                          accuracyModifiedRef.current = accuracy;
                        }
                      }}
                    />
                </Tooltip>
                <ShowHintBtn
                  visible={hintEnabledREF.current}
                  active={isHintable}
                  setShowHint={setStateFunction(setShowHint, (prev) =>
                    prev ? undefined : uid
                  )}
                />
                <ToggleFuriganaBtn
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
                <ToggleFrequencyTermBtnMemo
                  term={vocabulary}
                  count={frequency.length}
                  isReinforced={reinforcedUID !== null}
                  hasReinforce={vocabulary_reinforce}
                  addFrequencyTerm={
                    // TODO: memoize me ?
                    (uid) => {
                      setFrequency((f) => [...f, uid]);
                      buildAction(dispatch, addFrequencyWord)(uid);
                    }
                  }
                  removeFrequencyTerm={(uid) => {
                    setFrequency((f) => f.filter((id) => id !== uid));
                    buildAction(dispatch, removeFrequencyWord)(uid);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="progress-line flex-shrink-1"
          onClick={() => {
            if (sortMethodREF.current === TermSortBy.ALPHABETIC) {
              const delayTime = 4000;
              setShowPageBar(true);

              const delay = () => {
                if (!isAlphaSortScrolling.current) {
                  setShowPageBar(false);
                } else {
                  setTimeout(delay, delayTime);
                }
              };

              setTimeout(delay, delayTime);
            }
          }}
        >
          <LinearProgress
            variant={tpAnimation === null ? "determinate" : "buffer"}
            value={tpAnimation === null ? progress : 0}
            valueBuffer={tpAnimation ?? undefined}
            color={vocabulary_reinforce ? "secondary" : "primary"}
          />
        </div>
      </React.Fragment>
    );
  } else {
    page = (
      <React.Fragment>
        {page}
        <Grow in={showPageBar} timeout={500}>
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

function buildGameActionsHandler(
  gotoNextSlide: () => void,
  gotoPrev: () => void,
  reinforcedUID: string | null,
  selectedIndex: number,
  vocab: RawVocabulary[],
  verbForm: string,
  order: number[],
  filteredVocab: RawVocabulary[],
  recacheAudio: boolean,
  naFlip: React.MutableRefObject<string | undefined>
) {
  return function gameActionHandler(
    direction: string,
    AbortController?: AbortController
  ) {
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
      const vocabulary = getTerm(uid, vocab);

      const override = recacheAudio ? "/override_cache" : "";

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

        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "ja",
          q: audioPronunciation(sayObj),
          uid: getCacheUID(sayObj),
        });

        actionPromise = fetchAudio(audioUrl, AbortController);
      } else if (direction === "down") {
        setMediaSessionPlaybackState("playing");

        const inEnglish = vocabulary.english;

        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "en",
          q: inEnglish,
          uid: vocabulary.uid + ".en",
        });

        actionPromise = fetchAudio(audioUrl, AbortController);
      }
    }
    return (
      actionPromise ??
      Promise.reject(/** TODO: give direction a type to remove this */)
    );
  };
}

export { VocabularyMeta };
