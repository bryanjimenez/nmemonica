import { Avatar, Grow, LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
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
import { spaceRepLog, timedPlayLog } from "../../helper/consoleHelper";
import {
  DIFFICULTY_THRLD,
  alphaOrder,
  dateViewOrder,
  difficultyOrder,
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
import { addParam } from "../../helper/urlHelper";
import { buildAction, setStateFunction } from "../../hooks/helperHK";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useTimedGame } from "../../hooks/useTimedGame";
import type { AppDispatch } from "../../slices";
import { logger } from "../../slices/globalSlice";
import { TermSortBy } from "../../slices/settingHelper";
import {
  addFrequencyWord,
  flipVocabularyPracticeSide,
  furiganaToggled,
  getVocabulary,
  removeFrequencyWord,
  setWordDifficulty,
  toggleAutoVerbView,
  toggleVocabularyFilter,
  updateSpaceRepWord,
} from "../../slices/vocabularySlice";
import type { RawVocabulary } from "../../typings/raw";
import { DifficultySlider } from "../Form/Difficulty";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ReCacheAudioBtn,
  ShowHintBtn,
  ToggleAutoVerbViewBtn,
  ToggleFrequencyTermBtnMemo,
  ToggleFuriganaBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import StackNavButton from "../Form/StackNavButton";
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

  const prevReinforcedUID = useRef<string | undefined>(undefined);
  const prevSelectedIndex = useRef(0);

  const [reinforcedUID, setReinforcedUID] = useState<string | undefined>(
    undefined
  );
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

  const {
    motionThreshold,

    vocabList,

    // Refs
    memoThreshold,
    reinforce,
    filterType,
    hintEnabled,
    sortMethod,
    activeGroup,

    // modifiable during game
    autoVerbView,
    englishSideUp,
    verbForm,
    repetition,
  } = useConnectVocabulary();

  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  useEffect(() => {
    if (vocabList.length === 0) {
      dispatch(getVocabulary());
    }
  }, []);

  const filteredVocab = useMemo(() => {
    if (vocabList.length === 0) return [];
    if (Object.keys(metadata.current).length === 0 && activeGroup.length === 0)
      return vocabList;

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
      filterType.current,
      vocabList,
      allFrequency,
      activeGroup,
      buildAction(dispatch, toggleVocabularyFilter)
    );

    switch (sortMethod.current) {
      case TermSortBy.DIFFICULTY: {
        // exclude vocab with difficulty beyond memoThreshold
        const subFilter = filtered.filter((v) => {
          const dT = memoThreshold.current;
          const d = metadata.current[v.uid]?.difficulty;

          // TODO: extract to fn for tests?
          // const showUndefMemoV =
          //   d === undefined &&
          //   (dT < 0 ? -1 * dT < DIFFICULTY_THRLD : dT > DIFFICULTY_THRLD);
          // const showV = dT < 0 ? d > -1 * dT : d < dT;

          let showUndefMemoV = false;
          let showV= false;
          if(d===undefined){
            showUndefMemoV = (dT < 0 ? -1 * dT < DIFFICULTY_THRLD : dT > DIFFICULTY_THRLD);
          }else{
            showV = dT < 0 ? d > -1 * dT : d < dT;
          }

          return showUndefMemoV || showV;
        });

        if (subFilter.length > 0) {
          filtered = subFilter;
        } else {
          console.warn(
            "Excluded all terms. Discarding memorized subfiltering."
          );
        }
        break;
      }
      case TermSortBy.GAME:
        if (reinforce.current) {
          // if reinforce, place reinforced/frequency terms
          // at the end
          const [freqTerms, nonFreqTerms] = partition(
            filtered,
            (o) => metadata.current[o.uid]?.rein === true
          );

          filtered = [...nonFreqTerms, ...freqTerms];
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
  }, [dispatch, vocabList, activeGroup]);

  const {
    newOrder: order,
    ebare,
    jbare,
  } = useMemo(() => {
    if (filteredVocab.length === 0) return { newOrder: [] };

    let newOrder, jOrder, eOrder;
    switch (sortMethod.current) {
      case TermSortBy.RANDOM:
        newOrder = randomOrder(filteredVocab);
        break;
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredVocab, metadata.current);
        break;
      case TermSortBy.GAME:
        if (reinforce.current) {
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
        break;

      case TermSortBy.DIFFICULTY:
        // exclude vocab with difficulty beyond memoThreshold

        newOrder = difficultyOrder(filteredVocab, metadata.current);
        break;

      default: //TermSortBy.ALPHABETIC:
        ({ order: newOrder, jOrder, eOrder } = alphaOrder(filteredVocab));
        break;
    }

    // jbare, // bare min Japanese ordered word list
    // ebare, // bare min English ordered word list

    setScrollJOrder(true);

    return { newOrder, jbare: jOrder, ebare: eOrder };
  }, [filteredVocab]);

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
    setReinforcedUID(undefined);
  }, [filteredVocab, selectedIndex, lastNext]);

  const gotoNextSlide = useCallback(() => {
    play(
      reinforce.current,
      filterType.current,
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
    setReinforcedUID(undefined);
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
    tpAnswered,
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

      gradeTimedPlayEvent(dispatch, uid, metadata.current);

      // prevent updates when quick scrolling
      if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
        const vocabulary = getTerm(uid, vocabList);

        // don't increment reinforced terms
        const shouldIncrement = uid !== prevState.reinforcedUID;
        const frequency = prevState.reinforcedUID !== undefined;

        dispatch(updateSpaceRepWord({ uid, shouldIncrement }))
          .unwrap()
          .then((payload) => {
            const { map, prevMap } = payload;

            const prevDate = prevMap[uid]?.d;
            const repStats = { [uid]: { ...map[uid], d: prevDate } };
            const messageLog = (m: string, l: number) => dispatch(logger(m, l));
            if (tpAnswered.current !== undefined) {
              timedPlayLog(messageLog, vocabulary, repStats, { frequency });
            } else {
              spaceRepLog(messageLog, vocabulary, repStats, { frequency });
            }
          });
      }

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
            <div className="col text-center">
              <FrequencyTermIcon
                visible={reinforcedUID !== undefined && reinforcedUID !== ""}
              />
            </div>
            <div className="col">
              <div className="d-flex justify-content-end">
                {timedPlayVerifyBtn(metadata.current[uid]?.pron === true)}
                <DifficultySlider
                  value={metadata.current[uid]?.difficulty}
                  onChange={buildAction(dispatch, (value: number) =>
                    setWordDifficulty(uid, value)
                  )}
                  manualUpdate={uid}
                />
                <ShowHintBtn
                  visible={hintEnabled.current}
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
                  toggle={vocabulary_reinforce}
                  term={vocabulary}
                  count={frequency.length}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="progress-line flex-shrink-1"
          onClick={() => {
            if (sortMethod.current === TermSortBy.ALPHABETIC) {
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
  reinforcedUID: string | undefined,
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
      actionPromise = Promise.all([Promise.resolve()]);
    } else if (direction === "right") {
      gotoPrev();
      actionPromise = Promise.all([Promise.resolve()]);
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
    return actionPromise ?? Promise.reject();
  };
}

export { VocabularyMeta };
