import { offset, shift, useFloating } from "@floating-ui/react-dom";
import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  addFrequencyKanji,
  removeFrequencyKanji,
} from "../../slices/settingSlice";
import { randomOrder } from "../../helper/gameHelper";
import { useFrequency } from "../../hooks/frequencyHK";
import { useWindowSize } from "../../hooks/helperHK";
import { useCreateChoices, useFilterTerms } from "../../hooks/kanjiGamesHK";
import { useRandomTerm } from "../../hooks/randomTermHK";
import { useReinforcePlay } from "../../hooks/reinforcePlayHK";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ToggleFrequencyTermBtnMemo,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { KanjiGameMeta, oneFromList } from "./KanjiGame";
import XChoices from "./XChoices";
import { getKanji } from "../../slices/kanjiSlice";

/**
 * @typedef {import("../../typings/state").AppRootState} AppRootState
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 */

/**
 * @typedef {Object} KanjiGridProps
 * @property {typeof removeFrequencyKanji} removeFrequencyKanji
 * @property {typeof addFrequencyKanji} addFrequencyKanji
 */

const KanjiGridMeta = {
  location: "/kanji-grid/",
  label: "Kanji Grid Game",
};

/**
 * @param {RawKanji} kanji
 * @param {RawKanji[]} choices
 * @param {boolean} writePractice
 * @param {string} currExmpl    current english example shown
 * @param {function} nextExmpl  next english example when clicked
 */
function prepareGame(kanji, choices, writePractice, currExmpl, nextExmpl) {
  if (!kanji || choices.length === 0) return;
  // console.log("prepareGame("+kanji.english+", "+choices.length+")");

  const { english, kanji: japanese, on, kun, uid } = kanji;

  const isShortened = currExmpl !== english;

  /** @type {import("./XChoices").GameQuestion} */
  const q = {
    // english, not needed, shown as a choice
    toHTML: (correct) => {
      if (writePractice) {
        return (
          <div>
            <div
              className={classNames({
                "correct-color": correct,
              })}
            >
              <span>{japanese}</span>
            </div>
            {(on !== undefined || kun !== undefined) && (
              <div
                className={classNames({
                  "d-flex flex-column mt-3 h4": true,
                  "transparent-color": !correct,
                  "correct-color": correct,
                })}
              >
                <span>{on}</span>
                <span>{kun}</span>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div onClick={isShortened ? nextExmpl : undefined}>
            {currExmpl + (isShortened ? "..." : "")}
          </div>
        );
      }
    },
  };

  return {
    question: q,
    answer: uid,
    choices: choices.map((c) => ({
      compare: c.uid,
      toHTML: (/** @type {boolean} */ side) =>
        side ?? writePractice ? c.english : c.kanji,
    })),
  };
}

/**
 * @param {KanjiGridProps} props
 */
function KanjiGrid(props) {
  const dispatch = useDispatch();
  const { value: rawKanjis } = useSelector(
    (/** @type {RootState} */ { kanji }) => kanji
  );
  useMemo(() => {
    if (rawKanjis.length === 0) {
      dispatch(getKanji());
    }
  }, []);

  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [writePractice, setEnglishSide] = useState(false);

  const {
    choiceN,
    activeTags,
    filter: filterType,
    reinforce,
    repetition,
  } = useSelector((/** @type {AppRootState}*/ { settings }) => settings.kanji);

  const filteredTerms = useFilterTerms(
    repetition,
    rawKanjis,
    reinforce,
    filterType,
    activeTags
  );
  order.current = useMemo(() => randomOrder(filteredTerms), [filteredTerms]);

  const [currExmpl, setCurrExmpl] = useState("");

  const [willReinforce, setWillReinforce] = useState(false);
  const frequencyUids = useFrequency(repetition, filteredTerms);
  const randomTerm = useRandomTerm(willReinforce, frequencyUids, filteredTerms);

  let [kanji, setMove] = useReinforcePlay(
    willReinforce,
    randomTerm,
    filteredTerms.length,
    setSelectedIndex
  );

  kanji = useMemo(() => {
    const k = kanji ?? filteredTerms[order.current[selectedIndex]];

    if (k) {
      const englishShortened = oneFromList(k.english);
      setCurrExmpl(englishShortened);
    }

    return k;
  }, [kanji, filteredTerms, selectedIndex]);
  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const choices = useCreateChoices(choiceN, "english", kanji, rawKanjis);

  const nextExample = useCallback(() => {
    // console.log('hint?')

    if (kanji?.english.includes(",")) {
      let ex = currExmpl;
      while (ex === currExmpl) {
        ex = oneFromList(kanji.english);
      }
      // console.log(engShort+" "+englishShortened)

      setCurrExmpl(ex);
    }
  }, [kanji, currExmpl]);

  const game = useMemo(
    () => prepareGame(kanji, choices, writePractice, currExmpl, nextExample),
    [kanji, choices, writePractice, currExmpl, nextExample]
  );

  // console.log("KanjiGrid render "+selectedIndex);
  const fadeRef = useRef(-1);
  const [answ, setAnswered] = useState("");

  const [floatDim, setOffset] = useState({ w: 0, h: 0 });
  const w = useWindowSize();
  const { x, y, strategy, refs, update } = useFloating({
    placement: "bottom",
    middleware: [
      offset({
        mainAxis: w.height === undefined ? 0 : w.height / 2 - floatDim.h,
        crossAxis: 0,
      }),
      shift(),
    ],
  });

  // get wrong answer float dimensions
  useEffect(() => {
    const floatW = refs.floating.current?.clientWidth;
    const floatH = refs.floating.current?.clientHeight;

    if (answ.length > 0 && floatW && floatW > 0 && floatH && floatH > 0) {
      setOffset({
        w: floatW,
        h: floatH,
      });
      update();
    }
  }, [answ, setOffset, refs.floating, update]);

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

  return (
    <>
      <div className="tooltip-anchor" ref={refs.setReference}></div>
      <div
        ref={refs.setFloating}
        style={{
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
          width: "max-content",

          fontWeight: "bold",
          fontSize: "xxx-large",
        }}
        className={classNames({
          "dark-mode-color": true,
          "notification-fade": answ.length > 0,
        })}
      >
        {answ}
      </div>
      <XChoices
        question={game.question}
        isCorrect={(answered) => {
          const correct = answered.compare === game.answer;
          const correctIdx = game.choices.findIndex(
            (c) => c.compare === game.answer
          );

          if (!correct) {
            if (fadeRef.current > -1 && answ.length > 0) {
              clearTimeout(fadeRef.current);
              setAnswered("");
              setTimeout(
                () => setAnswered(answered.toHTML(!writePractice)),
                100
              );
            } else {
              setAnswered(answered.toHTML(!writePractice));
              fadeRef.current = window.setTimeout(() => setAnswered(""), 2500);
            }
          }
          return [correct, correctIdx];
        }}
        choices={game.choices}
        gotoPrev={() => {
          setWillReinforce(false);
          setMove((v) => v - 1);
        }}
        gotoNext={() => {
          const willReinforce = reinforce && Math.random() < 1 / 3;
          setWillReinforce(willReinforce);
          setMove((v) => v + 1);
        }}
      />
      <div className="options-bar mb-3 flex-shrink-1">
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start">
              <Link
                to={
                  writePractice
                    ? KanjiGridMeta.location
                    : KanjiGameMeta.location
                }
              >
                <TogglePracticeSideBtn
                  toggle={writePractice}
                  action={() => setEnglishSide((prevSide) => !prevSide)}
                />
              </Link>
            </div>
          </div>
          <div className="col text-center">
            <FrequencyTermIcon
              visible={
                term_reinforce &&
                kanji.uid !== filteredTerms[order.current[selectedIndex]].uid
              }
            />
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <span>{game.question.toHTML(false)}</span>
              <ToggleFrequencyTermBtnMemo
                addFrequencyTerm={props.addFrequencyKanji}
                removeFrequencyTerm={props.removeFrequencyKanji}
                toggle={term_reinforce}
                term={kanji}
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
    </>
  );
}

KanjiGrid.propTypes = {
  addFrequencyKanji: PropTypes.func,
  removeFrequencyKanji: PropTypes.func,
};

export default connect(null, {
  addFrequencyKanji,
  removeFrequencyKanji,
})(KanjiGrid);
export { KanjiGridMeta };
