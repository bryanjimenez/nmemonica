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
import type { GameQuestion } from "./XChoices";
import type { RawPhrase } from "../../typings/raw";
import type { RootState, AppDispatch } from "../../slices";

export interface ParticleChoice {
  japanese: string;
  romaji: string;
  start?: number;
  end?: number;
  toHTML: (correct: boolean) => void;
  html?: React.JSX.Element;
}
interface ParticleAnswer {
  japanese: string;
  romaji: string;
  start: number;
  end: number;
  toHTML: (correct: boolean) => void;
}
export interface ParticleGamePhrase {
  answer: {
    japanese: string;
    romaji: string;
    start: number;
    end: number;
    html: string;
  };
  question: RawPhrase;
  english: string;
  literal?: string;
}

const ParticlesGameMeta = {
  location: "/particles/",
  label: "Particles Game",
};

/**
 * Returns a list of choices which includes the right answer
 */
function createChoices(answer: ParticleAnswer, particleList: ParticleChoice[]) {
  let choices: ParticleChoice[] = [answer];
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
  const dispatch = useDispatch<AppDispatch>();

  const { phrases, particles } = useSelector(
    ({ particle }: RootState) => particle.particleGame
  );

  useEffect(() => {
    if (phrases.length === 0) {
      dispatch(getParticleGame());
    }
  }, []);

  const order = useRef<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  function prepareGame(
    selectedIndex: number,
    phrases: ParticleGamePhrase[],
    particles: ParticleChoice[]
  ) {
    if (phrases.length === 0 || particles.length === 0) return;

    if (order.current.length === 0) {
      order.current = randomOrder(phrases);
    }

    const phrase = phrases[order.current[selectedIndex]];
    const { answer: a, question: q, english, literal } = phrase;
    const answer = { ...a, toHTML: () => a.html };
    particles = particles.map((p) => ({ ...p, toHTML: () => p.html }));

    const choices = createChoices(answer, particles);

    const question: GameQuestion = {
      english: english,
      toHTML: (correct: boolean) =>
        buildQuestionElement(JapaneseText.parse(q), answer, correct),
    };

    return { question, answer, choices, literal };
  }

  const buildQuestionElement = (
    question: JapaneseText,
    { start, end }: { start: number; end: number },
    correct: boolean
  ) => {
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
    ({ particle }: RootState) => particle.setting.aRomaji
  );

  const game = prepareGame(selectedIndex, phrases, particles);

  // console.log(selectedIndex)
  // console.log("ParticleGame render");

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / phrases.length) * 100;

  return (
    <>
      <FourChoices
        question={game.question}
        isCorrect={(answered) => answered.japanese === game.answer.japanese}
        hint={game.literal}
        choices={game.choices}
        aRomaji={aRomaji}
        gotoPrev={gotoPrev}
        gotoNext={gotoNext}
      />
      <div className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

export { ParticlesGameMeta };
