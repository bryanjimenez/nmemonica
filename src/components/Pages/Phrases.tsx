import { LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
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
import { useDispatch, useSelector } from "react-redux";

import {
  audioServicePath,
  pronounceEndoint,
} from "../../../environment.development";
import {
  daysSince,
  spaceRepLog,
  // timedPlayLog,
} from "../../helper/consoleHelper";
import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import {
  englishLabel,
  getCacheUID,
  getTerm,
  getTermUID,
  japaneseLabel,
  labelPlacementHelper,
  minimumTimeForSpaceRepUpdate,
  // minimumTimeForTimedPlay,
  play,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import {
  getPercentOverdue,
  recallDebugLogHelper,
  recallNotificationHelper,
  spaceRepetitionOrder,
} from "../../helper/recallHelper";
import { SWRequestHeader } from "../../helper/serviceWorkerHelper";
import {
  dateViewOrder,
  difficultySubFilter,
  randomOrder,
} from "../../helper/sortHelper";
import { addParam } from "../../helper/urlHelper";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
// import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
// import { useMediaSession } from "../../hooks/useMediaSession";
import { useSwipeActions } from "../../hooks/useSwipeActions";
// import { useTimedGame } from "../../hooks/useTimedGame";
import type { AppDispatch, RootState } from "../../slices";
import { fetchAudio } from "../../slices/audioHelper";
import { logger } from "../../slices/globalSlice";
import {
  addFrequencyPhrase,
  flipPhrasesPracticeSide,
  getPhrase,
  removeFrequencyPhrase,
  removeFromSpaceRepetition,
  setPhraseAccuracy,
  setPhraseDifficulty,
  setSpaceRepetitionMetadata,
  togglePhrasesFilter,
  updateSpaceRepPhrase,
} from "../../slices/phraseSlice";
import { DebugLevel, TermSortBy } from "../../slices/settingHelper";
import { AccuracySlider } from "../Form/AccuracySlider";
import AudioItem from "../Form/AudioItem";
import type { ConsoleMessage } from "../Form/Console";
import { DifficultySlider } from "../Form/DifficultySlider";
import {
  ExternalSourceType,
  getExternalSourceType,
} from "../Form/ExtSourceInput";
import { NotReady } from "../Form/NotReady";
import {
  ReCacheAudioBtn,
  ToggleFrequencyTermBtnMemo,
  ToggleLiteralPhraseBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { RecallIntervalPreviewInfo } from "../Form/RecallIntervalPreviewInfo";
import Sizable from "../Form/Sizable";
import StackNavButton from "../Form/StackNavButton";
import { Tooltip } from "../Form/Tooltip";

const PhrasesMeta = {
  location: "/phrases/",
  label: "Phrases",
};

export default function Phrases() {
  const dispatch = useDispatch<AppDispatch>();

  const localServiceURL = useSelector(
    ({ global }: RootState) => global.localServiceURL
  );

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);

  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);
  // const [errorMsgs, setErrorMsgs] = useState<ConsoleMessage[]>([]);
  // const [errorSkipIndex, setErrorSkipIndex] = useState(-1);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef(Date.now());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [showRomaji, setShowRomaji] = useState<boolean>(false);
  const [showLit, setShowLit] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<string[]>([]); //subset of frequency words within current active group
  const [recacheAudio, setRecacheAudio] = useState(false);
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

    // Refs ()
    reinforce: reinforceREF,
    romajiActive,
    filterType: filterTypeREF,
    sortMethod: sortMethodREF,
  } = useConnectPhrase();

  const repMinItemReviewREF = useRef(spaRepMaxReviewItem);
  const difficultyThresholdREF = useRef(difficultyThreshold);

  // repetitionOnce is only updated the first time
  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  useEffect(() => {
    if (phraseList.length === 0) {
      void dispatch(getPhrase());
    }
  }, []);

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

    // TODO: Do we want this?
    // const lastRemoved = filterType === TermFilterBy.FREQUENCY && frequencyInfo.count === 0? []: false;

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

    switch (sortMethodREF.current) {
      case TermSortBy.RECALL:
        // discard the nonPending terms
        const { failed, overdue, overLimit } = spaceRepetitionOrder(
          filtered,
          metadata.current,
          repMinItemReviewREF.current
        );
        const pending = [...failed, ...overdue];

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
    sortMethodREF,
    difficultyThresholdREF,
    dispatch,
    phraseList,
    activeGroup,
    includeNew,
    includeReviewed,
  ]);

  const { order, recallGame } = useMemo(() => {
    const repetition = metadata.current;
    if (filteredPhrases.length === 0) return { order: [] };

    let newOrder: number[];
    let recallGame: number | undefined;
    switch (sortMethodREF.current) {
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredPhrases, repetition);

        let newN = 0;
        let oldDt = NaN;
        const views = newOrder.map((i) => {
          const d = metadata.current[filteredPhrases[i].uid]?.lastView;
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
          { msg: `Random (${newOrder.length})`, lvl: DebugLevel.DEBUG },
        ]);
        break;
    }

    return { order: newOrder, recallGame };
  }, [sortMethodREF, filteredPhrases]);

  const gotoNext = useCallback(() => {
    const l = filteredPhrases.length;
    let newSel = (selectedIndex + 1) % l;

    // if (newSel === errorSkipIndex) {
    //   newSel = (l + newSel + 1) % l;
    // }

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
  }, [filteredPhrases, selectedIndex, reinforcedUID, lastNext]);

  const audioUrl =
    getExternalSourceType(localServiceURL) === ExternalSourceType.LocalService
      ? localServiceURL + audioServicePath
      : pronounceEndoint;

  const gameActionHandler = buildGameActionsHandler(
    gotoNextSlide,
    gotoPrev,
    reinforcedUID,
    selectedIndex,
    phraseList,
    order,
    filteredPhrases,
    recacheAudio,
    audioUrl
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

    if (
      reinforcedUID !== prevState.reinforcedUID ||
      selectedIndex !== prevState.selectedIndex
    ) {
      const uid =
        prevState.reinforcedUID ??
        getTermUID(prevState.selectedIndex, filteredPhrases, order);

      const p = getTerm(uid, filteredPhrases, phraseList);

      let spaceRepUpdated;
      if (metadata.current[uid]?.difficultyP && accuracyModifiedRef.current) {
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
              if (accuracyModifiedRef.current && prevVal.lastReview) {
                // if term was reviewed
                prevDate = prevVal.lastReview;
              } else {
                prevDate = prevVal.lastView ?? value.lastView;
              }

              const repStats = { [uid]: { ...value, lastView: prevDate } };
              const messageLog = (m: string, l: number) =>
                dispatch(logger(m, l));
              // if (tpAnsweredREF.current !== undefined) {
              //   timedPlayLog(messageLog, p, repStats, { frequency });
              // } else {
              spaceRepLog(messageLog, p, repStats, { frequency });
              // }
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
      // setErrorMsgs([]);

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

  // FIXME: implement this
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
    recacheAudio,
    // loop
    0
  );

  const [jObj, japanesePhrase] = getJapanesePhrase(phrase);
  const englishPhrase = englishPhraseSubComp(phrase, showLit, setShowLit);

  /** Display inverse links and polite when available */
  const enDecorated = englishLabel(
    englishSideUp,
    jObj,
    englishPhrase,
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

  const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
    englishSideUp,
    enDecorated,
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
  const wasReviewed = metadata.current[uid]?.lastReview;
  const reviewedToday =
    wasReviewed !== undefined && daysSince(wasReviewed) === 0;

  const revNotification = recallNotificationHelper(
    metadata.current[uid]?.daysBetweenReviews,
    metadata.current[uid]?.lastReview
  );

  return (
    <React.Fragment>
      <div className="phrases main-panel h-100">
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
            {romajiActive.current && romaji && (
              <h5>
                <span
                  onClick={setStateFunction(setShowRomaji, (romaji) => !romaji)}
                  className="clickable loop-no-interrupt"
                >
                  {showRomaji ? romaji : "[Romaji]"}
                </span>
              </h5>
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
      <div className="options-bar mb-3 flex-shrink-1">
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start">
              <TogglePracticeSideBtn
                toggle={englishSideUp}
                action={buildAction(dispatch, flipPhrasesPracticeSide)}
              />
              <ReCacheAudioBtn
                active={recacheAudio}
                action={buildRecacheAudioHandler(recacheAudio, setRecacheAudio)}
              />
            </div>
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
              </Tooltip>
              <ToggleLiteralPhraseBtn
                visible={
                  englishSideUp && phrase.lit !== undefined && phrase.lit !== ""
                }
                toggle={showLit}
                action={setStateFunction(setShowLit, (lit) => !lit)}
              />
              <ToggleFrequencyTermBtnMemo
                addFrequencyTerm={
                  // TODO: memoize me
                  (uid) => {
                    setFrequency((f) => [...f, uid]);
                    buildAction(dispatch, addFrequencyPhrase)(uid);
                  }
                }
                removeFrequencyTerm={(uid) => {
                  setFrequency((f) => f.filter((id) => id !== uid));
                  buildAction(dispatch, removeFrequencyPhrase)(uid);
                }}
                hasReinforce={phrase_reinforce}
                isReinforced={reinforcedUID !== null}
                term={phrase}
                count={frequency.length}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="progress-line flex-shrink-1">
        <LinearProgress
          variant="determinate"
          // variant={tpAnimation === null ? "determinate" : "buffer"}
          // value={tpAnimation === null ? progress : 0}
          // valueBuffer={tpAnimation ?? undefined}
          value={progress}
          color={phrase_reinforce ? "secondary" : "primary"}
        />
      </div>
    </React.Fragment>
  );
}

function getJapanesePhrase(
  phrase: RawPhrase
): [JapaneseText, React.JSX.Element] {
  const jObj = JapaneseText.parse(phrase);

  return [jObj, jObj.toHTML()];
}

function englishPhraseSubComp(
  phrase: RawPhrase,
  showLit: boolean,
  setShowLit: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (
    <span
      // className={classNames({"info-color":this.state.showLit})}
      onClick={
        phrase.lit
          ? () => {
              setShowLit((lit) => !lit);
            }
          : undefined
      }
    >
      {!showLit ? phrase.english : phrase.lit}
    </span>
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
  recacheAudio: boolean,
  loop: number
) {
  const audioWords = englishSideUp
    ? { tl: "en", q: phrase.english, uid: phrase.uid + ".en" }
    : {
        tl: "ja",
        q: audioPronunciation(phrase),
        uid: getCacheUID(phrase),
      };

  return (
    <AudioItem
      visible={swipeThreshold === 0 && loop === 0}
      word={audioWords}
      reCache={recacheAudio}
    />
  );
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
  phrases: RawPhrase[],
  order: number[],
  filteredPhrases: RawPhrase[],
  recacheAudio: boolean,
  baseUrl: string
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
        reinforcedUID ?? getTermUID(selectedIndex, filteredPhrases, order);
      const phrase = getTerm(uid, phrases);
      const override = recacheAudio
        ? { headers: SWRequestHeader.CACHE_RELOAD }
        : {};

      if (direction === "up") {
        const inJapanese = audioPronunciation(phrase);
        const audioUrl = addParam(baseUrl, {
          tl: "ja",
          q: inJapanese,
          uid,
        });

        actionPromise = fetchAudio(
          new Request(audioUrl, override),
          AbortController
        );
      } else if (direction === "down") {
        const inEnglish = phrase.english;
        const audioUrl = addParam(baseUrl, {
          tl: "en",
          q: inEnglish,
          uid: phrase.uid + ".en",
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
  };
}

export { PhrasesMeta };
