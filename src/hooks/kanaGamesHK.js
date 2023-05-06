import React, { useCallback, useState } from "react";
import { KanaType } from "../slices/settingHelper";
import { shuffleArray } from "../helper/arrayHelper";
import classNames from "classnames";
import { swapKana } from "../helper/kanaHelper";
import { shallowEqual, useSelector } from "react-redux";

/**
 * @typedef {import("../components/Pages/KanaGame").Choice} Choice
 * @typedef {import("../components/Pages/KanaGame").Mora} Mora
 */

/**
 * 0 = hiragana
 *
 * 1 = katakana
 *
 * 2 = randomize 0 or 1
 * @param {typeof KanaType[keyof KanaType]} charSet
 * @note Not reactive
 */
function kanaTypeLogic(charSet) {
  let useCharSet;
  if (charSet === KanaType.MIXED) {
    useCharSet = /** @type {0|1} */ (Math.floor(Math.random() * 2));
  } else {
    useCharSet = charSet;
  }
  return useCharSet;
}

/**
 * based on the hiragana 2d array returns a shuffled list
 * of {consonant,vowel} corresponding to hiragana
 * consonant and vowel are indexes
 * @param {string[][]} hiragana
 * @note Not reactive
 */
function shuffleGameOrder(hiragana) {
  /** @type {Mora[]} */
  let gameOrder = [];
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

/**
 * @template {{
 * vowels: string[]
 * consonants: string[]
 * sounds: {[uid:string]:string}}} T
 *
 * @param {T} settings
 * @note Not reactive
 */
function buildPronunciation({ vowels, consonants, sounds }) {
  /**
   * @param {number} consonant
   * @param {number} vowel
   */
  return (consonant, vowel) => {
    const sound = consonants[consonant] + vowels[vowel];

    return sounds[sound] || sound;
  };
}

/**
 * @template {{
 * hiragana: string[][]
 * katakana: string[][]}} T
 *
 * @param {T} settings
 * @note Not reactive
 */
function buildKanaCharacter({ hiragana, katakana }) {
  /**
   * @param {number} consonant
   * @param {number} vowel
   * @param {number} set
   */
  return (consonant, vowel, set) => {
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
 * @template {{
 * getPronunciation: Function
 * getKanaCharacter: Function
 * charSet: typeof KanaType[keyof typeof KanaType]
 * choiceN:number
 * practiceSide:boolean}} T
 *
 * @param {T} settings
 * @param {Choice} answer
 * @param {Mora[]} gameOrder
 * @note Not reactive
 */
function populateChoices(
  { getPronunciation, getKanaCharacter, charSet, choiceN, practiceSide },
  answer,
  gameOrder
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
    );
    const cCharacter = getKanaCharacter(
      gameOrder[idx].consonant,
      gameOrder[idx].vowel,
      useChar
    );
    /** @type {Choice} */
    let choice;
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

/**
 * @template {{
 * vowelsR: React.MutableRefObject<string[]>
 * consonantsR: React.MutableRefObject<string[]>
 * soundsR: React.MutableRefObject<{ [uid: string]: string }>
 * hiraganaR: React.MutableRefObject<string[][]>
 * katakanaR: React.MutableRefObject<string[][]>
 * charSet: typeof KanaType[keyof typeof KanaType]
 * choiceN: number
 * wideMode: boolean
 * practiceSide: boolean
 * reinforce: Choice[]
 * selectedIndex: number}} T
 * @param {T} param0
 */
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
}) {
  const [question, setQuestion] = useState("undefined");
  const [answer, setAnswer] = useState(
    /** @type {Choice} */ ({ val: "", hint: "", cSet: KanaType.HIRAGANA })
  );
  const [choices, setChoices] = useState(/** @type {Choice[]} */ ([]));
  const [gameOrder, setGameOrder] = useState(/** @type {Mora[]} */ ([]));
  const [wrongs, setWrongs] = useState(/** @type {number[]} */ ([])); // list of index of current wrong answered choices used for visual hints
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

    /** @type {string} */
    let question;
    /** @type {Choice} */
    let answer;

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
    choiceN,
    gameOrder,
    wideMode,
    consonantsR,
    vowelsR,
    soundsR,
    hiraganaR,
    katakanaR,

    practiceSide,
    reinforce,
    selectedIndex,
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

/**
 * @template {{
 * setCorrect: Function
 * setWrongs: Function
 * setReinforce: Function
 * gotoNext: Function
 * answer: Choice
 * choices: Choice[]
 * wrongs: number[]
 * reinforce: Choice[]
 * practiceSide: boolean}} T
 * @param {T} param0
 */
export function useCheckAnswer({
  setCorrect,
  setWrongs,
  setReinforce,
  gotoNext,
  answer,
  choices,
  wrongs,
  reinforce,
  practiceSide,
}) {
  const checkAnswer = useCallback(
    /**
     * @param {Choice} answered
     */
    (answered) => {
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
    },
    [
      setCorrect,
      setReinforce,
      setWrongs,

      gotoNext,
      answer,
      choices,
      wrongs,
      reinforce,
      practiceSide,
    ]
  );

  return { checkAnswer };
}

/**
 * @template {{
 * checkAnswer: Function
 * wideMode: boolean
 * easyMode: boolean
 * charSet: typeof KanaType[keyof typeof KanaType]
 * practiceSide: boolean
 * wrongs: number[]
 * choices: Choice[]
 * answer: Choice
 * correct: boolean
 * choiceN: number}} T
 * @param {T} param0
 */
export function useChoiceButton({
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
}) {
  const choiceButton = useCallback(
    /**
     * @param {number} index
     */
    (index) => {
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

      const width =
        Math.trunc((1 / Math.ceil(Math.sqrt(choiceN))) * wide * 100) + "%";

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
    },
    [
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
    ]
  );

  return { choiceButton };
}

/**
 * KanaGame app-state props
 */
export function useKanaGameConnected() {
  const debug = useSelector(
    (/** @type {RootState}*/ { global }) => global.debug
  );

  const [hiragana, katakana, vowels, consonants, sounds] = useSelector(
    (/** @type {RootState}*/ { kana }) => {
      const { hiragana, katakana, vowels, consonants, sounds } = kana;

      return /** @type {[typeof hiragana, typeof katakana, typeof vowels, typeof consonants, typeof sounds]}*/ ([
        hiragana,
        katakana,
        vowels,
        consonants,
        sounds,
      ]);
    },
    () => true
  );

  const [wideMode, easyMode, charSet, choiceN] = useSelector(
    (/** @type {RootState}*/ { kana }) => {
      const { wideMode, easyMode, charSet, choiceN } = kana.setting;
      return /** @type {[typeof wideMode, typeof easyMode, typeof charSet, typeof choiceN]} */ ([
        wideMode,
        easyMode,
        charSet,
        choiceN,
      ]);
    },
    shallowEqual
  );

  const choiceNum = wideMode ? 31 : choiceN;

  return {
    debug,
    hiragana,
    katakana,
    vowels,
    consonants,
    sounds,
    choiceN: choiceNum,
    wideMode,
    easyMode,
    charSet,
  };
}
