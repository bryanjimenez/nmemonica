import { LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { pronounceEndoint } from "../../../environment.development";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import { fetchAudio } from "../../helper/audioHelper.development";
import { logify, spaceRepLog, timedPlayLog } from "../../helper/consoleHelper";
import {
  alphaOrder,
  dateViewOrder,
  getCacheUID,
  getTerm,
  getTermUID,
  labelOptions,
  labelPlacementHelper,
  minimumTimeForSpaceRepUpdate,
  minimumTimeForTimedPlay,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { addParam } from "../../helper/urlHelper";
import { buildAction, setStateFunction } from "../../hooks/helperHK";
import { useDeviceMotionActions } from "../../hooks/useDeviceMotionActions";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
import { useMediaSession } from "../../hooks/useMediaSession";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useTimedGame } from "../../hooks/useTimedGame";
import { logger } from "../../slices/globalSlice";
import {
  addFrequencyPhrase,
  flipPhrasesPracticeSide,
  getPhrase,
  removeFrequencyPhrase,
  togglePhrasesFilter,
  updateSpaceRepPhrase,
} from "../../slices/phraseSlice";
import { DebugLevel, TermSortBy } from "../../slices/settingHelper";
import AudioItem from "../Form/AudioItem";
import Console from "../Form/Console";
import { MinimalUI } from "../Form/MinimalUI";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ReCacheAudioBtn,
  ToggleFrequencyTermBtnMemo,
  ToggleLiteralPhraseBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import Sizable from "../Form/Sizable";
import StackNavButton from "../Form/StackNavButton";

/**
 * @typedef {import("../../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../Form/Console").ConsoleMessage} ConsoleMessage
 */

const PhrasesMeta = {
  location: "/phrases/",
  label: "Phrases",
};

export default function Phrases() {
  const dispatch = /** @type {AppDispatch}*/ (useDispatch());

  const prevReinforcedUID = useRef(
    /** @type {string | undefined} */ (undefined)
  );
  const prevSelectedIndex = useRef(0);

  const [reinforcedUID, setReinforcedUID] = useState(
    /** @type {string | undefined} */ (undefined)
  );
  const [errorMsgs, setErrorMsgs] = useState(
    /** @type {ConsoleMessage[]}*/ ([])
  );
  const [errorSkipIndex, setErrorSkipIndex] = useState(-1);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef(Date.now());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(
    /** @type {string | null} */ (null)
  );
  const [showRomaji, setShowRomaji] = useState(
    /** @type {string | null} */ (null)
  );
  const [showLit, setShowLit] = useState(/** @type {string | null} */ (null));
  /** subset of frequency words within current active group */
  const [frequency, setFrequency] = useState(/** @type {string[]} */ ([]));
  const [recacheAudio, setRecacheAudio] = useState(false);

  const {
    // Changing during game
    englishSideUp,
    repetition,

    // Not changing during game
    motionThreshold,
    swipeThreshold,
    phraseList,
    activeGroup,

    // Refs ()
    reinforce,
    romajiActive,
    filterType,
    sortMethod: sortMethodREF,
  } = useConnectPhrase();

  // repetitionOnce is only updated the first time
  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  useEffect(() => {
    if (phraseList.length === 0) {
      dispatch(getPhrase());
    }
  }, []);

  const filteredPhrases = useMemo(() => {
    const firstRepObject = metadata.current;
    if (phraseList.length === 0) return [];
    if (Object.keys(firstRepObject).length === 0 && activeGroup.length === 0)
      return phraseList;

    const allFrequency = Object.keys(firstRepObject).reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (firstRepObject[cur].rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    // TODO: Do we want this?
    // const lastRemoved = filterType === TermFilterBy.FREQUENCY && frequencyInfo.count === 0? []: false;

    const filtered = termFilterByType(
      filterType.current,
      phraseList,
      allFrequency,
      activeGroup,
      buildAction(dispatch, togglePhrasesFilter)
    );

    const frequency = filtered.reduce(
      (/** @type {string[]} */ acc, cur) => {
        if (firstRepObject[cur.uid]?.rein === true) {
          acc = [...acc, cur.uid];
        }
        return acc;
      },
      []
    );
    setFrequency(frequency);

    return filtered;
  }, [dispatch, phraseList, filterType, activeGroup]);

  const order = useMemo(() => {
    const repetition = metadata.current;
    if (filteredPhrases.length === 0) return [];

    let newOrder;
    switch (sortMethodREF.current) {
      case TermSortBy.RANDOM:
        newOrder = randomOrder(filteredPhrases);
        break;
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredPhrases, repetition);
        break;
      default: //TermSortBy.ALPHABETIC:
        ({ order: newOrder } = alphaOrder(filteredPhrases));
        break;
    }

    return newOrder;
  }, [filteredPhrases]);

  const gotoNext = useCallback(() => {
    const l = filteredPhrases.length;
    let newSel = (selectedIndex + 1) % l;

    if (newSel === errorSkipIndex) {
      newSel = (l + newSel + 1) % l;
    }

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(undefined);
  }, [filteredPhrases, selectedIndex, lastNext, errorSkipIndex]);

  const gotoNextSlide = useCallback(() => {
    play(
      reinforce.current,
      filterType.current,
      frequency,
      filteredPhrases,
      reinforcedUID,
      (value) => {
        prevReinforcedUID.current = reinforcedUID;
        setReinforcedUID(value);
      },
      gotoNext,
      buildAction(dispatch, removeFrequencyPhrase)
    );
  }, [
    dispatch,
    reinforce,
    filterType,
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

    if (newSel === errorSkipIndex) {
      newSel = (l + newSel - 1) % l;
    }

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(undefined);
  }, [filteredPhrases, selectedIndex, reinforcedUID, lastNext, errorSkipIndex]);

  const gameActionHandler = buildGameActionsHandler(
    gotoNextSlide,
    gotoPrev,
    reinforcedUID,
    selectedIndex,
    phraseList,
    order,
    filteredPhrases,
    recacheAudio
  );

  const deviceMotionEvent = useDeviceMotionActions(motionThreshold);

  const {
    beginLoop,
    abortLoop,
    looperSwipe,

    loopSettingBtn,
    loopActionBtn,
    // timedPlayVerifyBtn, // not used

    timedPlayAnswerHandlerWrapper,
    gradeTimedPlayEvent,
    resetTimedPlay,

    loop,
    tpAnswered: tpAnsweredREF,
    tpAnimation,
  } = useTimedGame(gameActionHandler, englishSideUp, deviceMotionEvent);
  // TODO: variable countdown time

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
        prevState.reinforcedUID ||
        getTermUID(prevState.selectedIndex, order, filteredPhrases);

      // prevent updates when quick scrolling
      if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
        const phrase = getTerm(uid, phraseList);

        // don't increment reinforced terms
        const shouldIncrement = uid !== prevState.reinforcedUID;
        dispatch(updateSpaceRepPhrase({ uid, shouldIncrement }))
          .unwrap()
          .then((payload) => {
            const { map, prevMap } = payload;

            const prevDate = prevMap[uid] && prevMap[uid].d;
            const repStats = { [uid]: { ...map[uid], d: prevDate } };
            const messageLog = (
              /** @type {string} */ m,
              /** @type {number} */ l
            ) => dispatch(logger(m, l));
            const frequency = prevState.reinforcedUID !== undefined;
            if (tpAnsweredREF.current !== undefined) {
              timedPlayLog(messageLog, phrase, repStats, { frequency });
            } else {
              spaceRepLog(messageLog, phrase, repStats, { frequency });
            }
          });
      }

      const wasReset = resetTimedPlay();
      if (wasReset) {
        if (minimumTimeForTimedPlay(prevState.lastNext)) {
          beginLoop();
        }
      }

      setShowMeaning(null);
      setShowRomaji(null);
      setShowLit(null);
      setErrorMsgs([]);
      prevSelectedIndex.current = selectedIndex;
      prevReinforcedUID.current = reinforcedUID;
    }
  }, [
    dispatch,
    beginLoop,
    resetTimedPlay,
    reinforcedUID,
    selectedIndex,
    phraseList,
    filteredPhrases,
    order,
    loop,
  ]);

  // TODO: probably append to array then update the Console?
  useEffect(() => {
    dispatch(
      logger(
        labelOptions(sortMethodREF.current, [
          "Random",
          "Alphhabetic",
          "View Date",
        ]),
        DebugLevel.DEBUG
      )
    );
  }, [dispatch]);

  useKeyboardActions(
    gameActionHandler,
    buildAction(dispatch, flipPhrasesPracticeSide),
    timedPlayAnswerHandlerWrapper
  );

  useMediaSession("Phrases Loop", loop, beginLoop, abortLoop, looperSwipe);

  const { HTMLDivElementSwipeRef } = useSwipeActions(
    gameActionHandler,
    timedPlayAnswerHandlerWrapper
  );

  if (errorMsgs.length > 0) {
    const minState = logify(this.state);
    const minProps = logify(this.props);

    const messages = [
      ...errorMsgs,
      { msg: "props:", lvl: DebugLevel.WARN, css: "px-2" },
      { msg: minProps, lvl: DebugLevel.WARN, css: "px-4" },
      { msg: "state:", lvl: DebugLevel.WARN, css: "px-2" },
      { msg: minState, lvl: DebugLevel.WARN, css: "px-4" },
    ];

    return (
      <MinimalUI next={gotoNext} prev={gotoPrev}>
        <div className="d-flex flex-column justify-content-around">
          <Console messages={messages} />
        </div>
      </MinimalUI>
    );
  }

  if (filteredPhrases.length < 1 || order.length < 1)
    return <NotReady addlStyle="main-panel" />;

  const uid =
    reinforcedUID || getTermUID(selectedIndex, order, filteredPhrases);

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

  const phrase = getTerm(uid, phraseList);

  const playButton = getPlayBtn(
    swipeThreshold,
    englishSideUp,
    phrase,
    recacheAudio,
    loop
  );

  const [jObj, japanesePhrase] = getJapanesePhrase(phrase);

  const englishPhrase = englishPhraseSubComp(phrase, showLit, setShowLit);

  const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
    englishSideUp,
    englishPhrase,
    japanesePhrase,
    eLabelMemo,
    jLabelMemo
  );

  const shortEN = phrase && (phrase.lit?.length || phrase.english.length) < 55;
  const shortJP = jObj && jObj.getSpelling().length < 55;

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
                  onClick={setStateFunction(setShowRomaji, (romaji) =>
                    romaji ? null : uid
                  )}
                  className="clickable loop-no-interrupt"
                >
                  {showRomaji === uid ? romaji : "[Romaji]"}
                </span>
              </h5>
            )}
            <Sizable
              className={belowNoInterruptCss}
              breakPoint="md"
              onClick={setStateFunction(setShowMeaning, (meaning) =>
                meaning ? null : uid
              )}
              largeClassName={belowLargeCss}
              smallClassName={belowSmallCss}
            >
              {showMeaning === uid ? bottomValue : bottomLabel}
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
              <ToggleLiteralPhraseBtn
                visible={
                  englishSideUp && phrase.lit !== undefined && phrase.lit !== ""
                }
                toggle={showLit === uid}
                action={setStateFunction(setShowLit, (lit) =>
                  lit ? null : uid
                )}
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
                toggle={phrase_reinforce}
                term={phrase}
                count={frequency.length}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="progress-line flex-shrink-1">
        <LinearProgress
          variant={tpAnimation === null ? "determinate" : "buffer"}
          value={tpAnimation === null ? progress : 0}
          valueBuffer={tpAnimation ?? undefined}
          color={phrase_reinforce ? "secondary" : "primary"}
        />
      </div>
    </React.Fragment>
  );
}

/**
 * @param {RawPhrase} phrase
 * @returns {[JapaneseText, JSX.Element]}
 */
function getJapanesePhrase(phrase) {
  const jObj = JapaneseText.parse(phrase);

  return [jObj, jObj.toHTML()];
}

/**
 * @param {RawPhrase} phrase
 * @param {string|null} showLit
 * @param {React.Dispatch<React.SetStateAction<string|null>>} setShowLit
 */
function englishPhraseSubComp(phrase, showLit, setShowLit) {
  return (
    <span
      // className={classNames({"info-color":this.state.showLit})}
      onClick={
        phrase.lit
          ? () => {
              setShowLit((lit) => (lit ? null : phrase.uid));
            }
          : undefined
      }
    >
      {!showLit ? phrase.english : phrase.lit}
    </span>
  );
}

/**
 * @param {boolean} englishSideUp
 * @param {boolean} shortJP
 * @param {boolean} shortEN
 */
function getCssResizableSubComp(englishSideUp, shortJP, shortEN) {
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

/**
 * @param {number} swipeThreshold
 * @param {boolean} englishSideUp
 * @param {RawPhrase} phrase
 * @param {boolean} recacheAudio
 * @param {number} loop
 */
function getPlayBtn(swipeThreshold, englishSideUp, phrase, recacheAudio, loop) {
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

/**
 * @param {boolean} recacheAudio
 * @param {React.Dispatch<React.SetStateAction<boolean>>} setRecacheAudio
 */
function buildRecacheAudioHandler(recacheAudio, setRecacheAudio) {
  return function recacheAudioHandler() {
    if (recacheAudio === false) {
      const delayTime = 2000;
      setRecacheAudio(true);

      const delayToggle = () => {
        setRecacheAudio(false);
      };

      setTimeout(delayToggle, delayTime);
    }
  };
}

/**
 * @param {function} gotoNextSlide
 * @param {function} gotoPrev
 * @param {string|undefined} reinforcedUID
 * @param {number} selectedIndex
 * @param {RawPhrase[]} phrases
 * @param {number[]} order
 * @param {RawPhrase[]} filteredPhrases
 * @param {boolean} recacheAudio
 */
function buildGameActionsHandler(
  gotoNextSlide,
  gotoPrev,
  reinforcedUID,
  selectedIndex,
  phrases,
  order,
  filteredPhrases,
  recacheAudio
) {
  /**
   * @param {string} direction
   * @param {AbortController} [AbortController]
   */
  return function swipeActionHandler(direction, AbortController) {
    // this.props.logger("swiped " + direction, DebugLevel.WARN);
    let swipePromise;

    if (direction === "left") {
      gotoNextSlide();
      swipePromise = Promise.all([Promise.resolve()]);
    } else if (direction === "right") {
      gotoPrev();
      swipePromise = Promise.all([Promise.resolve()]);
    } else {
      const uid =
        reinforcedUID || getTermUID(selectedIndex, order, filteredPhrases);
      const phrase = getTerm(uid, phrases);
      const override = recacheAudio ? "/override_cache" : "";

      if (direction === "up") {
        const inJapanese = audioPronunciation(phrase);
        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "ja",
          q: inJapanese,
          uid,
        });

        swipePromise = fetchAudio(audioUrl, AbortController);
      } else if (direction === "down") {
        const inEnglish = phrase.english;

        const audioUrl = addParam(pronounceEndoint + override, {
          tl: "en",
          q: inEnglish,
          uid: phrase.uid + ".en",
        });

        swipePromise = fetchAudio(audioUrl, AbortController);
      }
    }
    return swipePromise || Promise.reject();
  };
}

export { PhrasesMeta };
