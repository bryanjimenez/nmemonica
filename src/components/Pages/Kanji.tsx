import { offset, shift, useFloating } from "@floating-ui/react-dom";
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

import { isGroupLevel } from "./SetTermTagList";
import { shuffleArray } from "../../helper/arrayHelper";
import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import {
  getTerm,
  getTermUID,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { useWindowSize } from "../../hooks/useWindowSize";
import type { AppDispatch } from "../../slices";
import {
  addFrequencyKanji,
  getKanji,
  removeFrequencyKanji,
  toggleKanjiFilter,
} from "../../slices/kanjiSlice";
import { TermFilterBy } from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import type { RawVocabulary } from "../../typings/raw";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ToggleFrequencyTermBtnMemo,
} from "../Form/OptionsBar";
import StackNavButton from "../Form/StackNavButton";
import "../../css/Kanji.css";

const KanjiMeta = {
  location: "/kanji/",
  label: "Kanji",
};

export default function Kanji() {
  const dispatch = useDispatch<AppDispatch>();

  const addFrequencyTerm = useCallback(
    (uid: string) => {
      setFrequency((f) => [...f, uid]);
      dispatch(addFrequencyKanji(uid));
    },
    [dispatch]
  );
  const removeFrequencyTerm = useCallback(
    (uid: string) => {
      setFrequency((f) => f.filter((id) => id !== uid));
      dispatch(removeFrequencyKanji(uid));
    },
    [dispatch]
  );

  const {
    kanjiList,

    filterType: filterTypeREF,
    reinforce: reinforceREF,
    activeTags,
    repetition,
  } = useConnectKanji();

  const { vocabList } = useConnectVocabulary();

  // after initial render
  useEffect(() => {
    if (kanjiList.length === 0) {
      void dispatch(getKanji());
    }
    if (vocabList.length === 0) {
      void dispatch(getVocabulary());
    }
  }, []);

  /** metadata table ref */
  const metadata = useRef(repetition);
  metadata.current = repetition;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);

  const [frequency, setFrequency] = useState<string[]>([]); //subset of frequency words within current active group
  const [showOn, setShowOn] = useState(false);
  const [showKun, setShowKun] = useState(false);
  const [showEx, setShowEx] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  const filteredTerms = useMemo(() => {
    if (kanjiList.length === 0) return [];
    if (Object.keys(metadata.current).length === 0 && activeTags.length === 0)
      return kanjiList;

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
      kanjiList,
      allFrequency,
      filterTypeREF.current === TermFilterBy.TAGS ? activeTags : [],
      buildAction(dispatch, toggleKanjiFilter)
    );

    const frequency = filtered.reduce<string[]>((acc, cur) => {
      if (metadata.current[cur.uid]?.rein === true) {
        acc = [...acc, cur.uid];
      }
      return acc;
    }, []);
    setFrequency(frequency);

    return filtered;
  }, [dispatch, kanjiList, filterTypeREF, activeTags]);

  const order = useMemo(() => {
    if (filteredTerms.length === 0) return [];

    return randomOrder(filteredTerms);
  }, [filteredTerms]);

  const gotoNext = useCallback(() => {
    const l = filteredTerms.length;
    const newSel = (selectedIndex + 1) % l;

    setSelectedIndex(newSel);
    setReinforcedUID(null);
    setShowOn(false);
    setShowKun(false);
    setShowEx(false);
    setShowMeaning(false);
  }, [filteredTerms, selectedIndex]);

  const gotoNextSlide = useCallback(() => {
    let filtered = filteredTerms;
    // include frequency terms outside of filtered set
    if (reinforceREF.current && filterTypeREF.current === TermFilterBy.TAGS) {
      const allFrequency = Object.keys(repetition).reduce<string[]>(
        (acc, cur) => {
          if (repetition[cur]?.rein === true) {
            acc = [...acc, cur];
          }
          return acc;
        },
        []
      );

      const additional = kanjiList.filter((k) => allFrequency.includes(k.uid));
      filtered = [...filteredTerms, ...additional];
    }

    play(
      reinforceREF.current,
      filterTypeREF.current,
      frequency,
      // filteredTerms,
      filtered,
      repetition, //metadata,
      reinforcedUID,
      setReinforcedUID,
      gotoNext
    );
  }, [
    gotoNext,

    kanjiList,
    filteredTerms,
    frequency,
    reinforcedUID,
    repetition,

    reinforceREF,
    filterTypeREF,
  ]);

  const gotoPrev = useCallback(() => {
    const l = filteredTerms.length;
    const i = selectedIndex - 1;

    let newSel = i < 0 ? (l + i) % l : i % l;

    setSelectedIndex(newSel);
    setReinforcedUID(null);
    setShowOn(false);
    setShowKun(false);
    setShowEx(false);
    setShowMeaning(false);
  }, [filteredTerms, selectedIndex]);

  const swipeActionHandler = useCallback(
    (direction: string) => {
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

      return Promise.resolve(/** interrupt, fetch */);
    },
    [gotoNextSlide, gotoPrev]
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(swipeActionHandler);

  const w = useWindowSize();
  const xPad = (w.width && w.height ? w.width > w.height : true) ? 0 : 70;
  const halfWidth = w.width ? w.width / 2 : 0;

  const yOffset = 0; // horizontal alignment spacing
  const xOffset = 0 - halfWidth + xPad; // vertical spacing between tooltip and element
  const { x, y, strategy, refs, update } = useFloating({
    placement: "bottom",
    middleware: [offset({ mainAxis: yOffset, crossAxis: xOffset }), shift()],
  });

  useEffect(() => {
    // force a recalculate on
    // window resize
    update();
  }, [update, w.height, w.width]);

  if (order.length < 1) return <NotReady addlStyle="main-panel" />;

  const uid = reinforcedUID ?? getTermUID(selectedIndex, filteredTerms, order);
  const term = getTerm(uid, kanjiList);

  const match = vocabList.filter(
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

  let examples: RawVocabulary[] = [];
  if (match.length > 0) {
    const [first, ...theRest] = orderBy(match, (ex) => ex.english.length);
    examples = [first, ...shuffleArray(theRest)];
  }

  // console.log(
  //   JSON.stringify({
  //     rein: (reinforcedUID && reinforcedUID.slice(0, 6)) || "",
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     k: kanjiList.length,
  //     v: vocabList.length,
  //     ord: order.length,
  //     rep: Object.keys(repetition).length,
  //     fre: frequency.length,
  //     filt: filteredTerms.length,
  //   })
  // );

  // TODO: does it need to be active?
  const aGroupLevel =
    term.tag
      ?.find((t) => activeTags.includes(t) && isGroupLevel(t))
      ?.replace("_", " ") ??
    term.tag?.find((t) => isGroupLevel(t))?.replace("_", " ") ??
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
        <div ref={refs.setReference} />
        <div
          ref={refs.setFloating}
          style={{
            //  height: "200px",
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            width: "max-content",
          }}
          className="grp-info"
        >
          <div>
            <div>{term.grp}</div>
            <div>{aGroupLevel}</div>
          </div>
        </div>
        <div
          ref={HTMLDivElementSwipeRef}
          className="d-flex justify-content-between h-100"
        >
          <StackNavButton ariaLabel="Previous" action={gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>

          <div className="d-flex flex-column justify-content-around text-center">
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
          {/* <div className="right-info"></div> */}

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
              visible={reinforcedUID !== null}
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
