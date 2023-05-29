import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LinearProgress } from "@mui/material";
import { shuffleArray } from "../../helper/arrayHelper";
import { kanjiOkuriganaSpliceApplyCss } from "../../helper/kanjiHelper";
import { randomOrder } from "../../helper/gameHelper";
import { NotReady } from "../Form/NotReady";
import FourChoices from "./FourChoices";

import "./ParticlesGame.css";
import { getParticleGame } from "../../slices/particleSlice";
import { JapaneseText } from "../../helper/JapaneseText";

/**
 * @typedef {import("../../typings/raw").RawPhrase} RawPhrase
 * @typedef {{ japanese: string, romaji: string, start?:number, end?:number, toHTML: (correct:boolean)=>void }} ParticleChoice
 * @typedef {{ japanese: string, romaji: string, start:number, end:number, toHTML: (correct:boolean)=>void }} ParticleAnswer
 * @typedef {{ answer: {japanese:string, romaji:string, start:number, end:number, html:string}, question: RawPhrase, english:string, literal?:string }} ParticleGamePhrase
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
    const i = Math.floor(Math.random() * particleList.length);

    const choice = particleList[i];

    // should not be same choices or the right answer
    if (choices.every((c) => c.japanese !== choice.japanese)) {
      choices = [...choices, choice];
    }
  }

  shuffleArray(choices);

  return choices;
}

export default function ParticlesGame() {
  const dispatch = /** @type {AppDispatch}*/ (useDispatch());

  const {
    particleGame: { phrases, particles },
  } = useSelector((/** @type {RootState}*/ { particle }) => {
    return particle;
  });

  useEffect(() => {
    if (phrases.length === 0) {
      dispatch(getParticleGame());
    }
  }, []);

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
    const { answer: a, question: q, english, literal } = phrase;
    const answer = { ...a, toHTML: () => a.html };
    particles = particles.map((p) => ({ ...p, toHTML: () => p.html }));

    const choices = createChoices(answer, particles);

    /** @type {import("./FourChoices").GameQuestion} */
    const question = {
      english: english,
      toHTML: (correct) =>
        buildQuestionElement(JapaneseText.parse(q), answer, correct),
    };

    return { question, answer, choices, literal };
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

  const aRomaji = useSelector(
    (/** @type {RootState}*/ { particle }) => particle.setting.aRomaji
  );

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
      <div key={1} className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

export { ParticlesGameMeta };
