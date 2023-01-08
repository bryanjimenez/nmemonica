import { GET_PHRASES } from "../actions/phrasesAct";
import { GET_PARTICLE_PHRASES } from "../hooks/phrasesHK";
import { buildGroupObject } from "../helper/reducerHelper";
import { JapaneseText } from "../helper/JapaneseText";
import { romajiParticle } from "../helper/kanaHelper";

/**
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../components/Games/ParticlesGame").ParticleChoice} ParticleChoice
 * @typedef {import("../components/Games/ParticlesGame").ParticleGamePhrase} ParticleGamePhrase
 */

export const DEFAULT_STATE = {
  value: /** @type {RawPhrase[]} */ ([]),
  grpObj: {},
  particleGame: {
    phrases: /** @type {ParticleGamePhrase[]} */ ([]),
    particles: /** @type {ParticleChoice[]} */ ([]),
  },
};
const DEFAULT_ACTION = {};

/**
 * Filters RawPhrase to be used by PhrasesGame
 * @param {RawPhrase[]} rawPhrases
 */
export function getParticleGame(rawPhrases) {
  /** @type {ParticleChoice[]} */
  let particleList = [];
  /** @type {ParticleGamePhrase[]} */
  const wParticles = rawPhrases.reduce(
    (/** @type {ParticleGamePhrase[]} */ acc, curr) => {
      if (curr.particles && curr.particles?.length > 0) {
        const phrase = JapaneseText.parse(curr);
        const spelling = phrase.getSpelling();

        curr.particles.forEach((p) => {
          if (spelling.split(p).length === 2) {
            const romaji = romajiParticle(p);
            const start = spelling.indexOf(p);
            const end = start + p.length;
            const particle = { japanese: p, romaji, toHTML: () => p };
            const particleCopy = {
              japanese: p,
              romaji,
              start,
              end,
              toHTML: () => p,
            };

            particleList = [...particleList, particle];
            acc = [
              ...acc,
              {
                answer: particleCopy,
                question: phrase,
                english: curr.english,
                literal: curr.lit,
              },
            ];
          } else {
            // FIXME: more than one match
            // de vs desu 17612a51a05ef2e9fcc9e67f99f4836f
            // 3c87cb186cc3d94c47d901318fb74252
            // deaab959582cef2051b908d4d6421e00

            // toka, toka 88de5ed206433c2acc88cf61d900ce52
            // mo f919e262650b21a4c7c52be575554f59

            // haha deaab959582cef2051b908d4d6421e00
            console.error(
              JSON.stringify({ split: spelling.split(p).length, curr, p })
            );
          }
        });
      }

      return acc;
    },
    []
  );

  return { phrases: wParticles, particles: particleList };
}

const phrasesReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_PHRASES: {
      const value = Object.keys(action.value).map((k) => ({
        ...action.value[k],
        uid: k,
      }));

      return {
        ...state,
        grpObj: buildGroupObject(action.value),
        value,
      };
    }
    case GET_PARTICLE_PHRASES:
      return {
        ...state,
        particleGame: getParticleGame(action.value),
        value: action.value,
      };

    default:
      return state;
  }
};

export default phrasesReducer;
