import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LinearProgress } from "@mui/material";
import { shuffleArray } from "../../helper/arrayHelper";
import { kanjiOkuriganaSpliceApplyCss } from "../../helper/kanjiHelper";
import { randomOrder } from "../../helper/gameHelper";
import { NotReady } from "../Form/NotReady";
import FourChoices from "./FourChoices";
import { useParticlePhrasesStore } from "../../hooks/phrasesHK";

import "./ParticlesGame.css";

/**
 * @typedef {import("../../helper/JapaneseText").JapaneseText} JapaneseText
 * @typedef {import("../../typings/raw").RawPhrase} RawPhrase
 * @typedef {{ japanese: string, romaji: string, start?:number, end?:number, toHTML: (correct:boolean)=>void }} ParticleChoice
 * @typedef {{ japanese: string, romaji: string, start:number, end:number, toHTML: (correct:boolean)=>void }} ParticleAnswer
 * @typedef {{ answer: ParticleAnswer, question: JapaneseText, english:string, literal?:string }} ParticleGamePhrase
 *
 * @typedef {import("../../typings/state").AppRootState} AppRootState
 */

/**
 * @typedef {Object} ParticlesGameProps
 * @property {boolean} aRomaji
 */

/**
 * @typedef {Object} ParticlesGameState
 * @property {number} selectedIndex
 */

const ParticlesGameMeta = {
  location: "/particles/",
  label: "Particles Game",
};

/**
 * Returns a list of choices which includes the right answer
 * @param {ParticleAnswer} answer
 * @param {ParticleChoice[]} particleList
 */
function createChoices(answer, particleList) {
  let choices = /** @type {ParticleChoice[]} */ ([answer]);
  while (choices.length < 4) {
    const max = Math.floor(particleList.length);
    const i = Math.floor(Math.random() * max);

    const choice = particleList[i];

    // should not be same choices or the right answer
    if (choices.every((c) => c.japanese !== choice.japanese)) {
      choices = [...choices, choice];
    }
  }

  shuffleArray(choices);

  return choices;
}

function ParticlesGame() {
  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  /**
   * @param {number} selectedIndex
   * @param {ParticleGamePhrase[]} phrases
   * @param {ParticleChoice[]} particles
   */
  function prepareGame(selectedIndex, phrases, particles) {
    if (phrases.length === 0 || particles.length === 0) return;

    if (order.current.length === 0) {
      order.current = randomOrder(phrases);
    }

    const phrase = phrases[order.current[selectedIndex]];
    const { answer, question, english, literal } = phrase;
    const choices = createChoices(answer, particles);

    /** @type {import("./FourChoices").GameQuestion} */
    const q = {
      english: english,
      toHTML: (correct) => buildQuestionElement(question, answer, correct),
    };

    return { question: q, answer, choices, literal };
  }

  /**
   * @param {JapaneseText} question
   * @param {{start:number, end:number}} answer
   * @param {boolean} correct
   */
  const buildQuestionElement = (question, { start, end }, correct) => {
    const hidden = correct ? "correct-color" : "transparent-font underline";

    return kanjiOkuriganaSpliceApplyCss(
      question?.parseObj,
      { hidden },
      start,
      end
    );
  };

  function gotoNext() {
    const l = phrases.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
  }

  function gotoPrev() {
    const l = phrases.length;
    const i = selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    setSelectedIndex(newSel);
  }

  const dispatch = useDispatch();
  const aRomaji = useSelector(
    (/** @type {AppRootState}*/ { settings }) => settings.particles.aRomaji
  );
  const version = useSelector(
    (/** @type {AppRootState}*/ { version }) => version.phrases
  );
  const {
    value: phrasesArr,
    particleGame: { phrases, particles },
  } = useSelector((/** @type {AppRootState}*/ { phrases }) => phrases);
  const rawPhrases = useMemo(() => phrasesArr, [phrasesArr]);
  const gamePhrases = useMemo(() => phrases, [phrases]);
  useParticlePhrasesStore(dispatch, version, rawPhrases, gamePhrases);
  const game = prepareGame(selectedIndex, phrases, particles);

  // console.log(selectedIndex)
  // console.log("ParticleGame render");

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / phrases.length) * 100;

  return (
    <>
      <FourChoices
        key={0}
        question={game.question}
        isCorrect={(answered) => answered.japanese === game.answer.japanese}
        hint={game.literal}
        choices={game.choices}
        aRomaji={aRomaji}
        gotoPrev={gotoPrev}
        gotoNext={gotoNext}
      />
      <div key={1} className="progress-bar flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

export default ParticlesGame;

export { ParticlesGameMeta };
