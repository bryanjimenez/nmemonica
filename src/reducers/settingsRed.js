import { FIREBASE_LOGOUT, GET_USER_SETTINGS } from "../actions/firebase";
import {
  FLIP_PHRASES_PRACTICE_SIDE,
  SET_HIRAGANA_BTN_N,
  TOGGLE_HIRAGANA_WIDEMODE,
  SET_OPPOSITES_A_ROMAJI,
  SET_OPPOSITES_Q_ROMAJI,
  SET_PHRASES_ORDERING,
  TOGGLE_PHRASES_ROMAJI,
  SET_VOCABULARY_ORDERING,
  TOGGLE_VOCABULARY_ROMAJI,
  TOGGLE_VOCABULARY_HINT,
  FLIP_VOCABULARY_PRACTICE_SIDE,
  SET_VERB_ORDERING,
  SET_PARTICLES_A_ROMAJI,
  ADD_FREQUENCY_WORD,
  REMOVE_FREQUENCY_WORD,
  TOGGLE_VOCABULARY_ACTIVE_GROUP,
  TOGGLE_VOCABULARY_AUTO_PLAY,
  TOGGLE_DARK_MODE,
  SET_VERB_MASU,
  SCROLLING_STATE,
} from "../actions/settingsAct";

export const DEFAULT_SETTINGS = {
  global: { darkMode: false, scrolling: false },
  hiragana: { choiceN: 16, wideMode: false },
  verbs: { ordered: true, masu: false },
  phrases: { ordered: true, practiceSide: false, romaji: false },
  vocabulary: {
    ordered: true,
    practiceSide: false,
    romaji: false,
    hint: false,
    frequency: [],
    activeGroup: [],
    autoPlay: false,
  },
  opposites: { qRomaji: false, aRomaji: false },
  particles: { aRomaji: false },
};
const DEFAULT_ACTION = {};

const settingsReducer = (state = DEFAULT_SETTINGS, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case TOGGLE_DARK_MODE:
      return {
        ...state,
        global: {
          ...state.global,
          darkMode: action.value || !state.global.darkMode,
        },
      };
    case SCROLLING_STATE:
      return {
        ...state,
        global: {
          ...state.global,
          scrolling: action.value,
        },
      };
    case SET_HIRAGANA_BTN_N:
      return {
        ...state,
        hiragana: {
          ...state.hiragana,
          choiceN: action.value || !state.hiragana.choiceN,
        },
      };
    case TOGGLE_HIRAGANA_WIDEMODE:
      return {
        ...state,
        hiragana: {
          ...state.hiragana,
          wideMode: action.value || !state.hiragana.wideMode,
        },
      };
    case SET_VERB_ORDERING:
      return {
        ...state,
        verbs: {
          ...state.verbs,
          ordered: action.value || !state.verbs.ordered,
        },
      };
    case SET_VERB_MASU:
      return {
        ...state,
        verbs: {
          ...state.verbs,
          masu: action.value || !state.verbs.masu,
        },
      };
    case SET_PHRASES_ORDERING:
      return {
        ...state,
        phrases: {
          ...state.phrases,
          ordered: action.value || !state.phrases.ordered,
        },
      };
    case SET_VOCABULARY_ORDERING:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          ordered: action.value || !state.vocabulary.ordered,
        },
      };
    case TOGGLE_VOCABULARY_ROMAJI:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          romaji: action.value || !state.vocabulary.romaji,
        },
      };
    case TOGGLE_VOCABULARY_HINT:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          hint: action.value || !state.vocabulary.hint,
        },
      };
    case FLIP_VOCABULARY_PRACTICE_SIDE:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          practiceSide: action.value || !state.vocabulary.practiceSide,
        },
      };
    case TOGGLE_VOCABULARY_AUTO_PLAY:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          autoPlay: action.value || !state.vocabulary.autoPlay,
        },
      };
    case ADD_FREQUENCY_WORD:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          frequency: action.value,
        },
      };
    case REMOVE_FREQUENCY_WORD:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          frequency: action.value,
        },
      };

    case TOGGLE_VOCABULARY_ACTIVE_GROUP:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          activeGroup: action.value,
        },
      };

    case SET_OPPOSITES_Q_ROMAJI:
      return {
        ...state,
        opposites: {
          ...state.opposites,
          qRomaji: action.value || !state.opposites.qRomaji,
        },
      };
    case SET_OPPOSITES_A_ROMAJI:
      return {
        ...state,
        opposites: {
          ...state.opposites,
          aRomaji: action.value || !state.opposites.aRomaji,
        },
      };
    case SET_PARTICLES_A_ROMAJI:
      return {
        ...state,
        particles: {
          ...state.particles,
          aRomaji: action.value || !state.particles.aRomaji,
        },
      };
    case FLIP_PHRASES_PRACTICE_SIDE:
      return {
        ...state,
        phrases: {
          ...state.phrases,
          practiceSide: action.value || !state.phrases.practiceSide,
        },
      };
    case TOGGLE_PHRASES_ROMAJI:
      return {
        ...state,
        phrases: {
          ...state.phrases,
          romaji: action.value || !state.phrases.romaji,
        },
      };
    case GET_USER_SETTINGS:
      return {
        ...state,
        ...action.value,
      };
    case FIREBASE_LOGOUT:
      return DEFAULT_SETTINGS;
    default:
      return state;
  }
};

export default settingsReducer;
