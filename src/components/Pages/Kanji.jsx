import { LinearProgress } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { JapaneseText } from "../../helper/JapaneseText";
import { swipeEnd, swipeMove, swipeStart } from "../../helper/TouchSwipe";
import { shuffleArray } from "../../helper/arrayHelper";
import {
  getTerm,
  getTermUID,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { setStateFunction } from "../../hooks/helperHK";
import { useKanjiConnected } from "../../hooks/kanjiHK";
import {
  addFrequencyKanji,
  getKanji,
  removeFrequencyKanji,
  toggleKanjiFilter,
} from "../../slices/kanjiSlice";
import { TermFilterBy } from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ToggleFrequencyTermBtnMemo,
} from "../Form/OptionsBar";
import StackNavButton from "../Form/StackNavButton";
import "./Kanji.css";
import { isGroupLevel } from "./SetTermTagList";

/**
 * @typedef {import("react").TouchEventHandler} TouchEventHandler
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 * @typedef {import("../../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

const KanjiMeta = {
  location: "/kanji/",
  label: "Kanji",
};

export default function Kanji() {
  const dispatch = /** @type {AppDispatch} */ (useDispatch());

  const addFrequencyTerm = useCallback(
    (/** @type {string} */ uid) => dispatch(addFrequencyKanji(uid)),
    [dispatch]
  );
  const removeFrequencyTerm = useCallback(
    (/** @type {string} */ uid) => dispatch(removeFrequencyKanji(uid)),
    [dispatch]
  );

  const {
    swipeThreshold,

    kanji: k,
    vocabulary: v,

    filterType,
    reinforce,
    activeTags,
    repetition,
    frequency: frequencyInfo, //value of *last* frequency word update
  } = useKanjiConnected();

  // TODO: compare versions
  const kanji = useRef(k);
  if (k.length !== kanji.current.length) {
    kanji.current = k;
  }
  const vocabulary = useRef(v);
  if (v.length !== vocabulary.current.length) {
    vocabulary.current = v;
  }

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState(
    /** @type {string | undefined}*/ (undefined)
  );
  const [filteredTerms, setFilteredTerms] = useState(
    /** @type {RawKanji[]}*/ ([])
  );
  const [frequency, setFrequency] = useState(/** @type {string[]}*/ ([])); //subset of frequency words within current active group
  const [showOn, setShowOn] = useState(false);
  const [showKun, setShowKun] = useState(false);
  const [showEx, setShowEx] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [order, setOrder] = useState(/** @type {number[]}*/ ([]));
  const [examples, setExamples] = useState(/** @type {RawVocabulary[]}*/ ([]));
  const [swiping, setSwiping] = useState(
    /** @type {ReturnType<swipeStart> | ReturnType<swipeMove>}*/ ({})
  );

  const buildOrder = useCallback(() => {
    const allFrequency = Object.keys(repetition).reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (repetition[cur].rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    let filteredTerms = termFilterByType(
      filterType,
      kanji.current,
      allFrequency,
      filterType === TermFilterBy.TAGS ? activeTags : [],
      () => dispatch(toggleKanjiFilter(TermFilterBy.TAGS))
    );

    const newOrder = randomOrder(filteredTerms);

    // needed if using frequency from filteredTerms not all Frequency
    // const filteredKeys = filteredTerms.map((f) => f.uid);
    // const frequency = filteredKeys.reduce(
    //   (/** @type {string[]} */ acc, cur) => {
    //     if (this.props.repetition[cur]?.rein === true) {
    //       acc = [...acc, cur];
    //     }
    //     return acc;
    //   },
    //   []
    // );

    setFilteredTerms(filteredTerms);
    setFrequency(allFrequency);
    setOrder(newOrder);
  }, [dispatch, filterType, activeTags, repetition]);

  const gotoNext = useCallback(() => {
    const l = filteredTerms.length;
    const newSel = (selectedIndex + 1) % l;

    setSelectedIndex(newSel);
    setReinforcedUID(undefined);
    setShowOn(false);
    setShowKun(false);
    setShowEx(false);
    setShowMeaning(false);
  }, [filteredTerms, selectedIndex]);

  const gotoNextSlide = useCallback(() => {
    let filtered = filteredTerms;
    // include frequency terms outside of filtered set
    if (reinforce && filterType === TermFilterBy.TAGS) {
      const allFrequency = Object.keys(repetition).reduce(
        (/** @type {string[]}*/ acc, cur) => {
          if (repetition[cur].rein === true) {
            acc = [...acc, cur];
          }
          return acc;
        },
        []
      );

      const additional = kanji.current.filter((k) =>
        allFrequency.includes(k.uid)
      );
      filtered = [...filteredTerms, ...additional];
    }

    play(
      reinforce,
      filterType,
      frequency,
      // filteredTerms,
      filtered,
      reinforcedUID,
      setReinforcedUID,
      gotoNext,
      removeFrequencyTerm
    );
  }, [
    gotoNext,
    removeFrequencyTerm,

    filterType,
    filteredTerms,
    frequency,
    reinforce,
    reinforcedUID,
    repetition,
  ]);

  const gotoPrev = useCallback(() => {
    const l = filteredTerms.length;
    const i = selectedIndex - 1;

    let newSel = i < 0 ? (l + i) % l : i % l;

    setSelectedIndex(newSel);
    setReinforcedUID(undefined);
    setShowOn(false);
    setShowKun(false);
    setShowEx(false);
    setShowMeaning(false);
  }, [filteredTerms, selectedIndex]);

  const swipeActionHandler = useCallback(
    /**
     * @param {string} direction
     */
    (direction) => {
      // this.props.logger("swiped " + direction, 3);

      if (direction === "left") {
        gotoNextSlide();
      } else if (direction === "right") {
        gotoPrev();
      } else {
        if (direction === "up") {
          // up
          // kun
        } else if (direction === "down") {
          // down
          // on
        }
      }
    },
    [gotoNextSlide, gotoPrev]
  );

  const startMove = useCallback(
    /** @type {TouchEventHandler} */
    (e) => {
      const s = swipeStart(e, {
        verticalSwiping: true,
        touchThreshold: swipeThreshold,
      });
      setSwiping(s);
    },
    [swipeThreshold]
  );

  const inMove = useCallback(
    /** @type {TouchEventHandler} */
    (e) => {
      if (swiping) {
        const s = swipeMove(e, swiping);
        setSwiping(s);
      }
    },
    [swiping]
  );

  const endMove = useCallback(
    /** @type {TouchEventHandler} */
    (e) => {
      // const direction = getSwipeDirection(this.state.swiping.touchObject,true);
      if (swiping) {
        swipeEnd(e, { ...swiping, onSwipe: swipeActionHandler });
      }
    },
    [swiping, swipeActionHandler]
  );

  // after initial render
  useEffect(() => {
    if (kanji.current.length === 0) {
      dispatch(getKanji());
    }
    if (vocabulary.current.length === 0) {
      dispatch(getVocabulary());
    }
  }, []);

  useEffect(() => {
    if (kanji.current.length > 0 && order.length === 0) {
      buildOrder();
    }
  }, [buildOrder, order, kanji.current.length]);

  useEffect(() => {
    if (filterType === TermFilterBy.FREQUENCY && frequencyInfo.count === 0) {
      // last frequency word was removed
      buildOrder();
    } else {
      const filteredKeys = filteredTerms.map((f) => f.uid);
      const frequency = filteredKeys.reduce(
        (/** @type {string[]} */ acc, cur) => {
          if (repetition[cur]?.rein === true) {
            acc = [...acc, cur];
          }
          return acc;
        },
        []
      );
      // props.frequency is a count of frequency terms
      // state.frequency is a subset list of frequency term within current active group
      setFrequency(frequency);
    }
  }, [buildOrder, filterType, filteredTerms, frequencyInfo, repetition]);

  useEffect(() => {
    // find examples
    if (order.length > 0) {
      const uid =
        reinforcedUID || getTermUID(selectedIndex, order, filteredTerms);

      /** @type {RawKanji} */
      const term = getTerm(uid, kanji.current);

      const match = vocabulary.current.filter(
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

      /** @type {RawVocabulary[]} */
      let examples = [];
      if (match.length > 0) {
        const [first, ...theRest] = orderBy(match, (ex) => ex.english.length);
        examples = [first, ...shuffleArray(theRest)];
      }

      setExamples(examples);
    }
  }, [selectedIndex, reinforcedUID, order, filteredTerms, frequency]);

  const uid = useMemo(() => {
    if (reinforcedUID || (order.length > 0 && filteredTerms.length > 0))
      return reinforcedUID || getTermUID(selectedIndex, order, filteredTerms);
  }, [reinforcedUID, selectedIndex, order, filteredTerms]);

  /** @type {RawKanji} */
  const term = useMemo(() => {
    if (uid && kanji.current.length > 0) return getTerm(uid, kanji.current);
  }, [uid]);

  // render()
  if (filteredTerms.length < 1) return <NotReady addlStyle="main-panel" />;

  const aGroupLevel =
    term.tag
      .find((t) => activeTags.includes(t) && isGroupLevel(t))
      ?.replace("_", " ") ||
    term.tag.find((t) => isGroupLevel(t))?.replace("_", " ") ||
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

  let page = (
    <React.Fragment>
      <div className="kanji main-panel h-100">
        <div
          className="d-flex justify-content-between h-100"
          onTouchStart={swipeThreshold > 0 ? startMove : undefined}
          onTouchMove={swipeThreshold > 0 ? inMove : undefined}
          onTouchEnd={swipeThreshold > 0 ? endMove : undefined}
        >
          <StackNavButton ariaLabel="Previous" action={gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          <div className="grp-info">
            <div>
              <div>{term.grp}</div>
              <div>{aGroupLevel}</div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="pt-0">
              <span>{term.kanji}</span>
            </h1>
            {(term.on && (
              <h4
                className="pt-0"
                onClick={setStateFunction(setShowOn, (toggle) => !toggle)}
              >
                <span>{showOn ? term.on : "[On]"}</span>
              </h4>
            )) || <h4 className="pt-0">.</h4>}
            {(term.kun && (
              <h4
                className="pt-2"
                onClick={setStateFunction(setShowKun, (toggle) => !toggle)}
              >
                <span>{showKun ? term.kun : "[Kun]"}</span>
              </h4>
            )) || <h4 className="pt-2 mb-0">.</h4>}
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

              <h4
                className="align-self-center pt-2 clickable"
                onClick={setStateFunction(setShowMeaning, (toggle) => !toggle)}
              >
                {showMeaning ? meaning : <span>{"[Meaning]"}</span>}
              </h4>
            </div>
          </div>
          <div className="right-info"></div>

          <StackNavButton ariaLabel="Next" action={gotoNextSlide}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>
      <div className="options-bar mb-3 flex-shrink-1">
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start"></div>
          </div>
          <div className="col text-center">
            <FrequencyTermIcon
              visible={reinforcedUID !== undefined && reinforcedUID !== ""}
            />
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <ToggleFrequencyTermBtnMemo
                addFrequencyTerm={addFrequencyTerm}
                removeFrequencyTerm={removeFrequencyTerm}
                toggle={term_reinforce}
                term={term}
                count={frequency.length}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="progress-line flex-shrink-1">
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
