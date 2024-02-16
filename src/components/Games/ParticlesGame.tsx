import { LinearProgress } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FourChoicesWRef,
  type GameChoice,
  type GameQuestion,
} from "./FourChoices";
import { shuffleArray } from "../../helper/arrayHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { kanjiOkuriganaSpliceApplyCss } from "../../helper/kanjiHelper";
import { randomOrder } from "../../helper/sortHelper";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import type { AppDispatch, RootState } from "../../slices";
import { getParticleGame } from "../../slices/particleSlice";
import type { RawPhrase } from "../../typings/raw";
import { NotReady } from "../Form/NotReady";
import "../../css/ParticlesGame.css";

export interface ChoiceParticle {
  japanese: string;
  romaji: string;
}

export interface AnswerParticle {
  japanese: string;
  romaji: string;
  /** Starting index of particle in phrase */
  start: number;
  /** Ending index of particle in phrase */
  end: number;
}

export interface ParticleGamePhrase {
  answer: AnswerParticle;
  question: RawPhrase;
  english: string;
  literal?: string;
}

const ParticlesGameMeta = {
  location: "/particles/",
  label: "Particles Game",
};

export default function ParticlesGame() {
  const dispatch = useDispatch<AppDispatch>();

  const { phrases, particles } = useSelector(
    ({ particle }: RootState) => particle.particleGame
  );

  const [aRomaji, fadeInAnswers] = useSelector<RootState, boolean[]>(
    ({ particle }: RootState) => {
      const { aRomaji, fadeInAnswers } = particle.setting;
      return [aRomaji, fadeInAnswers];
    }
  );

  useEffect(() => {
    if (phrases.length === 0) {
      void dispatch(getParticleGame());
    }
  }, []);

  const order = useRef<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // TODO: memoize?
  function prepareGame(
    selectedIndex: number,
    phrases: ParticleGamePhrase[],
    particles: ChoiceParticle[]
  ) {
    if (phrases.length === 0 || particles.length === 0) return;

    if (order.current.length === 0) {
      order.current = randomOrder(phrases);
    }

    const phrase = phrases[order.current[selectedIndex]];
    const { answer: a, question: q, english, literal } = phrase;
    const answer = { ...a, toHTML: () => <>{a.japanese}</> };
    particles = particles.map((p) => ({
      ...p,
      toHTML: () => <>{p.japanese}</>,
    }));

    const choices = createChoices(answer, particles);

    const question: GameQuestion = {
      english: english,
      toHTML: (correct: boolean) => (
        <div className="fs-1">
          {buildQuestionElement(JapaneseText.parse(q), answer, correct)}
        </div>
      ),
    };

    return { question, answer, choices, literal };
  }

  const gotoNext = useCallback(() => {
    // function gotoNext() {
    const l = phrases.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
    // }
  }, [selectedIndex, phrases]);

  const gotoPrev = useCallback(() => {
    // function gotoPrev() {
    const l = phrases.length;
    const i = selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    setSelectedIndex(newSel);
    // }
  }, [selectedIndex, phrases]);

  const game = prepareGame(selectedIndex, phrases, particles);

  const swipeHandler = useCallback(
    (direction: string) => {
      switch (direction) {
        case "right":
          gotoPrev();
          break;
        case "left":
          gotoNext();
          break;

        default:
          break;
      }

      return Promise.resolve(/** interrupt, fetch */);
    },
    [gotoPrev, gotoNext]
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(swipeHandler);

  if (!game) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / phrases.length) * 100;

  return (
    <>
      <FourChoicesWRef
        ref={HTMLDivElementSwipeRef}
        question={game.question}
        isCorrect={(answered) => answered.japanese === game.answer.japanese}
        hint={game.literal}
        choices={game.choices}
        aRomaji={aRomaji}
        gotoPrev={gotoPrev}
        gotoNext={gotoNext}
        fadeInAnswers={fadeInAnswers}
      />
      <div className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

/**
 * Returns a list of choices which includes the right answer
 */
function createChoices(answer: AnswerParticle, particleList: ChoiceParticle[]) {
  const choiceCss = "fs-1";
  let choices: GameChoice[] = [
    {
      ...answer,
      compare: answer.japanese,
      toHTML: () => <span className={choiceCss}>{answer.japanese}</span>,
    },
  ];
  while (choices.length < 4) {
    const i = Math.floor(Math.random() * particleList.length);

    const choice = particleList[i];

    // should not be same choices or the right answer
    if (choices.every((c) => c.compare !== choice.japanese)) {
      choices = [
        ...choices,
        {
          ...choice,
          compare: choice.japanese,
          toHTML: () => <span className={choiceCss}>{choice.japanese}</span>,
        },
      ];
    }
  }

  shuffleArray(choices);

  return choices;
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

export { ParticlesGameMeta };
