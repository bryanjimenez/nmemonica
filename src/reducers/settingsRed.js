import { FIREBASE_LOGOUT, GET_USER_SETTINGS } from "../actions/firebase";
import {
  FLIP_PHRASES_PRACTICE_SIDE,
  SET_HIRAGANA_BTN_N,
  SET_OPPOSITES_A_ROMAJI,
  SET_OPPOSITES_Q_ROMAJI,
  SET_PHRASES_ORDERING,
  TOGGLE_PHRASES_ROMAJI,
  SET_VOCABULARY_ORDERING,
  TOGGLE_VOCABULARY_ROMAJI,
  FLIP_VOCABULARY_PRACTICE_SIDE,
  SET_VERB_ORDERING,
  SET_PARTICLES_A_ROMAJI,
} from "../actions/settingsAct";

const DEFAULT_STATE = {
  hiragana: { choiceN: 16 },
  verbs: { ordered: true },
  phrases: { ordered: true, practiceSide: false, romaji: false },
  vocabulary: { ordered: true, practiceSide: false, romaji: false },
  opposites: { qRomaji: false, aRomaji: false },
  particles: { aRomaji: false },
};
const DEFAULT_ACTION = {};

const settingsReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case SET_HIRAGANA_BTN_N:
      const choiceN = action.value ? action.value : !state.hiragana.choiceN;
      return {
        ...state,
        hiragana: { ...state.hiragana, choiceN },
      };
    case SET_VERB_ORDERING:
      const ordered = action.value ? action.value : !state.verbs.ordered;
      return {
        ...state,
        verbs: { ...state.verbs, ordered },
      };
    case SET_PHRASES_ORDERING:
      const newOrder = action.value ? action.value : !state.phrases.ordered;
      return {
        ...state,
        phrases: { ...state.phrases, ordered: newOrder },
      };
    case SET_VOCABULARY_ORDERING:
      const newVOrder = action.value || !state.vocabulary.ordered;
      return {
        ...state,
        vocabulary: { ...state.vocabulary, ordered: newVOrder },
      };
    case TOGGLE_VOCABULARY_ROMAJI:
      const vocabRomaji = action.value || !state.vocabulary.romaji;
      return {
        ...state,
        vocabulary: { ...state.vocabulary, romaji: vocabRomaji },
      };
    case FLIP_VOCABULARY_PRACTICE_SIDE:
      const practiceVSide = action.value || !state.vocabulary.practiceSide;
      return {
        ...state,
        vocabulary: { ...state.vocabulary, practiceSide: practiceVSide },
      };
    case SET_OPPOSITES_Q_ROMAJI:
      const qRomaji = action.value ? action.value : !state.opposites.qRomaji;
      return {
        ...state,
        opposites: { ...state.opposites, qRomaji },
      };
    case SET_OPPOSITES_A_ROMAJI:
      const aRomaji = action.value ? action.value : !state.opposites.aRomaji;
      return {
        ...state,
        opposites: { ...state.opposites, aRomaji },
      };
    case SET_PARTICLES_A_ROMAJI:
      const paRomaji = action.value ? action.value : !state.particles.aRomaji;
      return {
        ...state,
        particles: { ...state.particles, aRomaji: paRomaji },
      };
    case FLIP_PHRASES_PRACTICE_SIDE:
      const practiceSide = action.value
        ? action.value
        : !state.phrases.practiceSide;
      return {
        ...state,
        phrases: { ...state.phrases, practiceSide },
      };
    case TOGGLE_PHRASES_ROMAJI:
      const phraRomaji = action.value ? action.value : !state.phrases.romaji;
      return {
        ...state,
        phrases: { ...state.phrases, romaji: phraRomaji },
      };
    case GET_USER_SETTINGS:
      return {
        ...state,
        ...action.value,
      };
    case FIREBASE_LOGOUT:
      return DEFAULT_STATE;
    default:
      return state;
  }
};

export default settingsReducer;
