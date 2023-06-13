import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { swapKana } from "../../helper/kanaHelper";
import { setStateFunction } from "../../hooks/helperHK";
import { NotReady } from "../Form/NotReady";
import { TogglePracticeSideBtn } from "../Form/OptionsBar";
import StackNavButton from "../Form/StackNavButton";
import { useConnectKana } from "../../hooks/useConnectKana";
import { shuffleArray } from "../../helper/arrayHelper";
import { KanaType } from "../../slices/settingHelper";

interface Choice {
  val: string;
  hint: string;
  cSet: number;
  q?: boolean;
  practiceSide?: boolean;
}

interface Mora {
  consonant: number;
  vowel: number;
}

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
    choiceN: cn,
    wideMode: wm,
    easyMode: em,
    charSet,
  } = useConnectKana();

  const vowelsR = useRef(v);
  const consonantsR = useRef(c);
  const soundsR = useRef(s);
  const hiraganaR = useRef(h);
  const katakanaR = useRef(k);
  const wideMode = useRef(wm);
  // wideMode.current = wm;
  const easyMode = useRef(em);
  // easyMode.current = em;
  const choiceN = useRef(cn);
  // choiceN.current = cn;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforce, setReinforce] = useState<Choice[]>([]); // list of recently wrong chosen hiragana used to reinforce
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
    choiceN: choiceN.current,
    wideMode: wideMode.current,

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

  const checkAnswer = buildCheckAnswer({
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

  const choiceButton = buildChoiceButton({
    checkAnswer,

    charSet,
    practiceSide,

    wrongs,
    choices,
    answer,
    correct,

    wideMode: wideMode.current,
    easyMode: easyMode.current,
    choiceN: choiceN.current,
  });

  useEffect(() => {
    if (hiraganaR.current.length > 0) {
      prepareGame();
    }
  }, [selectedIndex, practiceSide, charSet]);

  if (!question) return <NotReady addlStyle="kana" />;

  // console.log(question);
  // console.log(answer);
  // console.log(choices);
  const mainPanel = classNames({
    "kana main-panel h-100": true,
  });

  const choiceAreaCSS = classNames({
    "choices-row d-flex justify-content-around": true,
    "w-50": !wideMode.current,
    "w-100": wideMode.current,
  });

  return (
    <React.Fragment>
      <div className={mainPanel}>
        <div className="d-flex justify-content-between h-100">
          <StackNavButton ariaLabel="Previous" action={gotoPrev}>
            <ChevronLeftIcon size={16} />
          </StackNavButton>
          {!wideMode.current && (
            <div
              className={classNames({
                "pt-3 d-flex flex-column justify-content-center text-center w-50":
                  true,
                "correct-color": correct,
              })}
            >
              <h1 className="clickable">{question}</h1>
              {easyMode.current && !practiceSide && (
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

/**
 * 0 = hiragana
 *
 * 1 = katakana
 *
 * 2 = randomize 0 or 1
 */
function kanaTypeLogic(charSet: (typeof KanaType)[keyof typeof KanaType]) {
  let useCharSet;
  if (charSet === KanaType.MIXED) {
    useCharSet = Math.floor(Math.random() * 2) as 0 | 1;
  } else {
    useCharSet = charSet;
  }
  return useCharSet;
}

/**
 * based on the hiragana 2d array returns a shuffled list
 * of {consonant,vowel} corresponding to hiragana
 * consonant and vowel are indexes
 */
function shuffleGameOrder(hiragana: string[][]) {
  let gameOrder: Mora[] = [];
  const xMax = hiragana[0].length;
  const yMax = hiragana.length;

  for (let vowel = 0; vowel < xMax; vowel++) {
    for (let consonant = 0; consonant < yMax; consonant++) {
      // should not include yi, ye, wu, or empty row (except -n)
      if (
        (vowel != 1 || consonant != 12) &&
        (vowel != 3 || consonant != 12) &&
        (vowel != 2 || consonant != 14) &&
        (vowel === 0 || consonant != 15)
      )
        gameOrder = [...gameOrder, { vowel, consonant }];
    }
  }
  shuffleArray(gameOrder);

  return gameOrder;
}

function buildPronunciation({
  vowels,
  consonants,
  sounds,
}: {
  vowels: string[];
  consonants: string[];
  sounds: Record<string, string>;
}) {
  return (consonant: number, vowel: number) => {
    const sound = consonants[consonant] + vowels[vowel];

    return sounds[sound] || sound;
  };
}

function buildKanaCharacter({
  hiragana,
  katakana,
}: {
  hiragana: string[][];
  katakana: string[][];
}) {
  return (consonant: number, vowel: number, set: number) => {
    let kana;

    if (set === KanaType.HIRAGANA) {
      kana = hiragana[consonant][vowel];
    } else {
      kana = katakana[consonant][vowel];
    }

    return kana;
  };
}

/**
 * Creates a shuffled list of choices containing the answer
 */
function populateChoices(
  {
    getPronunciation,
    getKanaCharacter,
    charSet,
    choiceN,
    practiceSide,
  }: {
    getPronunciation: Function;
    getKanaCharacter: Function;
    charSet: (typeof KanaType)[keyof typeof KanaType];
    choiceN: number;
    practiceSide: boolean;
  },
  answer: Choice,
  gameOrder: Mora[]
) {
  let choices = [answer];

  const difficult = practiceSide;

  while (choices.length < choiceN) {
    const min = 0;
    const max = gameOrder.length;
    const idx = Math.floor(Math.random() * (max - min) + min);

    let useChar = kanaTypeLogic(charSet);

    const cPronunciation = getPronunciation(
      gameOrder[idx].consonant,
      gameOrder[idx].vowel
    ) as string;
    const cCharacter = getKanaCharacter(
      gameOrder[idx].consonant,
      gameOrder[idx].vowel,
      useChar
    ) as string;

    let choice: Choice;
    if (difficult) {
      choice = {
        val: cCharacter,
        hint: cPronunciation,
        cSet: useChar,
      };
    } else {
      choice = {
        val: cPronunciation,
        hint: cCharacter,
        cSet: useChar,
      };
    }

    // should not add duplicates or the right answer
    // duplicate check based on pronunciation
    if (
      (difficult && !choices.some((c) => c.hint === choice.hint)) ||
      (!difficult && !choices.some((c) => c.val === choice.val))
    ) {
      choices = [...choices, choice];
    }
  }

  shuffleArray(choices);
  return choices;
}

export function usePrepareGame({
  charSet,
  choiceN,
  wideMode,
  vowelsR,
  consonantsR,
  soundsR,
  hiraganaR,
  katakanaR,

  practiceSide,
  reinforce,
  selectedIndex,
}: {
  charSet: (typeof KanaType)[keyof typeof KanaType];
  choiceN: number;
  wideMode: boolean;
  vowelsR: React.MutableRefObject<string[]>;
  consonantsR: React.MutableRefObject<string[]>;
  soundsR: React.MutableRefObject<Record<string, string>>;
  hiraganaR: React.MutableRefObject<string[][]>;
  katakanaR: React.MutableRefObject<string[][]>;

  practiceSide: boolean;
  reinforce: Choice[];
  selectedIndex: number;
}) {
  const [question, setQuestion] = useState("undefined");
  const [answer, setAnswer] = useState<Choice>({
    val: "",
    hint: "",
    cSet: KanaType.HIRAGANA,
  });
  const [choices, setChoices] = useState<Choice[]>([]);
  const [gameOrder, setGameOrder] = useState<Mora[]>([]);
  const [wrongs, setWrongs] = useState<number[]>([]); // list of index of current wrong answered choices used for visual hints
  const [correct, setCorrect] = useState(false);

  const prepareGame = useCallback(() => {
    const hiragana = hiraganaR.current;
    const katakana = katakanaR.current;

    let gameOrderCurr;
    if (gameOrder.length > 0) {
      gameOrderCurr = gameOrder;
    } else {
      gameOrderCurr = shuffleGameOrder(hiragana);
    }

    let question: string;
    let answer: Choice;

    // some games will come from the reinforced list
    const willReinforce = Math.random() < 1 / 3;

    const vowels = vowelsR.current;
    const consonants = consonantsR.current;
    const sounds = soundsR.current;
    const getPronunciation = buildPronunciation({ vowels, consonants, sounds });
    const getKanaCharacter = buildKanaCharacter({ hiragana, katakana });

    if (willReinforce && reinforce.length > 0) {
      // console.log('reinforced')
      const missedQuestion = reinforce[reinforce.length - 1];

      if (practiceSide === missedQuestion.practiceSide) {
        answer = missedQuestion;
      } else {
        const { val, hint, cSet } = missedQuestion;
        answer = { val: hint, hint: val, cSet };
      }
    } else {
      // console.log('regular')
      const { consonant, vowel } = gameOrderCurr[selectedIndex];

      let useChar = kanaTypeLogic(charSet);

      const pronunciation = getPronunciation(consonant, vowel);
      const character = getKanaCharacter(consonant, vowel, useChar);

      if (practiceSide) {
        answer = {
          val: character,
          hint: pronunciation,
          cSet: useChar,
        };
      } else {
        answer = {
          val: pronunciation,
          hint: character,
          cSet: useChar,
        };
      }
    }

    question = answer.hint;

    let choices = populateChoices(
      { getPronunciation, getKanaCharacter, charSet, choiceN, practiceSide },
      answer,
      gameOrderCurr
    );

    if (wideMode) {
      choices = [
        ...choices,
        { val: question, hint: question, cSet: answer.cSet, q: true },
      ];
    }

    setQuestion(question);
    setAnswer(answer);
    setChoices(choices);
    setGameOrder(gameOrderCurr);
    setWrongs([]);
    setCorrect(false);
  }, [
    charSet,
    gameOrder,
    consonantsR,
    vowelsR,
    soundsR,
    hiraganaR,
    katakanaR,

    practiceSide,
    reinforce,
    selectedIndex,

    wideMode,
    choiceN,
  ]);

  return {
    prepareGame,
    setWrongs,
    setCorrect,
    answer,
    correct,
    wrongs,
    question,
    choices,
    gameOrder,
  };
}

function buildCheckAnswer({
  setCorrect,
  setWrongs,
  setReinforce,
  gotoNext,
  answer,
  choices,
  wrongs,
  reinforce,
  practiceSide,
}: {
  setCorrect: Function;
  setWrongs: Function;
  setReinforce: Function;
  gotoNext: Function;
  answer: Choice;
  choices: Choice[];
  wrongs: number[];
  reinforce: Choice[];
  practiceSide: boolean;
}) {
  return function checkAnswer(answered: Choice) {
    if (answered.val === answer?.val) {
      // console.log("RIGHT!");
      setCorrect(true);
      setTimeout(gotoNext, 500);
    } else {
      // console.log("WRONG");
      const wrong = choices.findIndex((c) => c.val === answered.val);

      setWrongs([...wrongs, wrong]);
      setReinforce([...reinforce, { ...answered, practiceSide }]);
    }
  };
}

export function buildChoiceButton({
  checkAnswer,
  wideMode,
  easyMode,
  charSet,
  practiceSide,
  wrongs,
  choices,
  answer,
  correct,
  choiceN,
}: {
  checkAnswer: Function;
  wideMode: boolean;
  easyMode: boolean;
  charSet: (typeof KanaType)[keyof typeof KanaType];
  practiceSide: boolean;
  wrongs: number[];
  choices: Choice[];
  answer: Choice;
  correct: boolean;
  choiceN: number;
}) {
  return function choiceButton(index: number) {
    const isWrong = wrongs.includes(index);
    const isRight = choices[index].val === answer.val && correct;

    const choiceCSS = classNames({
      clickable: !choices[index].q,
      "text-center": true,
      "d-flex flex-column justify-content-center": true,
      "correct-color": isRight || (wideMode && choices[index].q && correct),
      "incorrect-color": isWrong,
      "question-color": wideMode && choices[index].q && !correct,
    });

    const choiceH2CSS = classNames({
      "mb-0": wideMode,
    });

    const hintDivCSS = "d-flex justify-content-around";

    const hintH6CSS = classNames({
      "mb-0": true,
      invisible: !isWrong,
    });

    const wide = wideMode ? 3 / 4 : 1;

    const width = `${Math.trunc(
      (1 / Math.ceil(Math.sqrt(choiceN))) * wide * 100
    )}%`;

    const englishShown = !practiceSide;

    let hintElement;
    if (!easyMode || (easyMode && !englishShown)) {
      if (
        easyMode &&
        !englishShown &&
        choices[index].q !== true &&
        charSet === KanaType.MIXED
      ) {
        // kanaHints for mixed mode
        hintElement = (
          <div className={hintDivCSS}>
            <h6 className={hintH6CSS}>{choices[index].hint}</h6>
            <h6 className={hintH6CSS}>{swapKana(choices[index].val)}</h6>
          </div>
        );
      }
      // no hinting
      else if (choices[index].q !== true) {
        // the choices
        hintElement = (
          <div className={hintDivCSS}>
            <h6 className={hintH6CSS}>
              {choices[index].cSet === answer.cSet
                ? choices[index].hint
                : swapKana(choices[index].hint)}
            </h6>
          </div>
        );
      } else {
        // the question
        // keep hint transparent to match spacing
        hintElement = (
          <div className={hintDivCSS}>
            <h6 className="mb-0 invisible">{swapKana(choices[index].val)}</h6>
          </div>
        );
      }
    } else {
      // easymode
      if (choices[index].q !== true) {
        // the choices
        hintElement = (
          <div className={hintDivCSS}>
            <h6 className={hintH6CSS}>
              {choices[index].cSet === KanaType.HIRAGANA
                ? choices[index].hint
                : swapKana(choices[index].hint)}
            </h6>
            <h6 className={hintH6CSS}>
              {choices[index].cSet === KanaType.HIRAGANA
                ? swapKana(choices[index].hint)
                : choices[index].hint}
            </h6>
          </div>
        );
      } else {
        // the question
        hintElement = (
          <div className={hintDivCSS}>
            <h6 className="mb-0">{swapKana(choices[index].val)}</h6>
          </div>
        );
      }
    }

    return (
      <div
        key={index}
        onClick={() => {
          if (!choices[index].q) {
            checkAnswer(choices[index]);
          }
        }}
        className={choiceCSS}
        style={{ width }}
      >
        <h2 className={choiceH2CSS}>{choices[index].val}</h2>
        {hintElement}
      </div>
    );
  };
}

export { KanaGameMeta };
