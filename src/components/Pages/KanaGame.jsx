import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { swapKana } from "../../helper/kanaHelper";
import { setStateFunction } from "../../hooks/helperHK";
import {
  useCheckAnswer,
  useChoiceButton,
  useKanaGameConnected,
  usePrepareGame,
} from "../../hooks/kanaGamesHK";
import { NotReady } from "../Form/NotReady";
import { TogglePracticeSideBtn } from "../Form/OptionsBar";
import StackNavButton from "../Form/StackNavButton";

/**
 * @typedef {Object} Choice
 * @property {string} val
 * @property {string} hint
 * @property {number} cSet
 * @property {boolean} [q]
 * @property {boolean} [practiceSide]
 */

/**
 * @typedef {Object} Mora
 * @property {number} consonant
 * @property {number} vowel
 */

const KanaGameMeta = {
  location: "/kana/",
  label: ["平仮名 Game", "片仮名 Game", "仮名 Game"],
};

export default function KanaGame() {
  const {
    hiragana: h,
    katakana: k,
    vowels: v,
    consonants: c,
    sounds: s,
    choiceN,
    wideMode,
    easyMode,
    charSet,
  } = useKanaGameConnected();

  // Objects to memo
  const vowelsR = useRef(v);
  const consonantsR = useRef(c);
  const soundsR = useRef(s);
  const hiraganaR = useRef(h);
  const katakanaR = useRef(k);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [reinforce, setReinforce] = useState(/** @type {Choice[]} */ ([])); // list of recently wrong chosen hiragana used to reinforce
  const [practiceSide, setPracticeSide] = useState(false); //false=hiragana q shown (read), true=romaji q shown (write)

  const {
    prepareGame,
    setWrongs,
    setCorrect,

    answer,
    correct,
    question,
    wrongs,
    choices,
    gameOrder,
  } = usePrepareGame({
    charSet,
    choiceN,
    wideMode,

    practiceSide,
    reinforce,
    selectedIndex,

    vowelsR,
    consonantsR,
    soundsR,
    hiraganaR,
    katakanaR,
  });

  const gotoNext = useCallback(() => {
    const l = gameOrder.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
    setWrongs([]);
    setCorrect(false);
  }, [setCorrect, setWrongs, gameOrder, selectedIndex]);

  const gotoPrev = useCallback(() => {
    const l = gameOrder.length;
    const i = selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    setSelectedIndex(newSel);
    setWrongs([]);
    setCorrect(false);
  }, [setCorrect, setWrongs, gameOrder, selectedIndex]);

  const { checkAnswer } = useCheckAnswer({
    setCorrect,
    setWrongs,
    setReinforce,
    gotoNext,

    practiceSide,

    answer,
    choices,
    wrongs,
    reinforce,
  });

  const { choiceButton } = useChoiceButton({
    checkAnswer,

    wideMode,
    easyMode,
    charSet,
    practiceSide,
    choiceN,

    wrongs,
    choices,
    answer,
    correct,
  });

  useEffect(() => {
    if (hiraganaR.current.length > 0) {
      prepareGame();
    }
  }, [selectedIndex, practiceSide, charSet, choiceN]);

  if (!question) return <NotReady addlStyle="kana" />;

  // console.log(question);
  // console.log(answer);
  // console.log(choices);
  const mainPanel = classNames({
    "kana main-panel h-100": true,
  });

  const choiceAreaCSS = classNames({
    "choices-row d-flex justify-content-around": true,
    "w-50": !wideMode,
    "w-100": wideMode,
  });

  return (
    <React.Fragment>
      <div className={mainPanel}>
        <div className="d-flex justify-content-between h-100">
          <StackNavButton ariaLabel="Previous" action={gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          {!wideMode && (
            <div
              className={classNames({
                "pt-3 d-flex flex-column justify-content-center text-center w-50": true,
                "correct-color": correct,
              })}
            >
              <h1 className="clickable">{question}</h1>
              {easyMode && !practiceSide && (
                <div className="d-flex justify-content-around">
                  <h6>{swapKana(question)}</h6>
                </div>
              )}
            </div>
          )}
          <div className={choiceAreaCSS}>
            <div className="choices-column w-100 d-flex flex-wrap ">
              {choices.map((c, i) => choiceButton(i))}
            </div>
          </div>
          <StackNavButton ariaLabel="Next" action={gotoNext}>
            <ChevronRightIcon size={16} />
          </StackNavButton>
        </div>
      </div>
      <div className="options-bar mb-2 flex-shrink-1">
        <div className="row">
          <div className="col">
            <TogglePracticeSideBtn
              toggle={practiceSide}
              action={setStateFunction(setPracticeSide, (p) => !p)}
            />
          </div>
          <div className="col"></div>
          <div className="col"></div>
        </div>
      </div>
    </React.Fragment>
  );
}

export { KanaGameMeta };
