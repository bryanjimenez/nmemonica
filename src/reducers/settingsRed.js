import { FIREBASE_LOGOUT, GET_USER_SETTINGS } from "../actions/firebase";
import {
  FLIP_PHRASES_PRACTICE_SIDE,
  SET_KANA_BTN_N,
  TOGGLE_KANA_WIDEMODE,
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
  AUTO_VERB_VIEW,
  TOGGLE_VOCABULARY_FILTER,
  ADD_FREQUENCY_PHRASE,
  REMOVE_FREQUENCY_PHRASE,
  TOGGLE_PHRASES_FILTER,
  TOGGLE_KANA_CHAR_SET,
} from "../actions/settingsAct";

export const DEFAULT_SETTINGS = {
  global: { darkMode: false, scrolling: false },
  kana: { choiceN: 16, wideMode: false, charSet: 0 },
  verbs: { ordered: true, masu: false },
  phrases: {
    ordered: true,
    practiceSide: false,
    romaji: false,
    frequency: [],
    filter: false,
  },
  vocabulary: {
    ordered: true,
    practiceSide: false,
    romaji: false,
    hint: false,
    filter: false,
    frequency: [],
    activeGroup: [],
    autoPlay: false,
    autoVerbView: false,
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
    case SET_KANA_BTN_N:
      return {
        ...state,
        kana: {
          ...state.kana,
          choiceN: action.value || !state.kana.choiceN,
        },
      };
    case TOGGLE_KANA_WIDEMODE:
      return {
        ...state,
        kana: {
          ...state.kana,
          wideMode: action.value || !state.kana.wideMode,
        },
      };
    case TOGGLE_KANA_CHAR_SET:
      return {
        ...state,
        kana: {
          ...state.kana,
          charSet: action.value,
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
    case TOGGLE_VOCABULARY_FILTER:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          filter: !state.vocabulary.filter,
        },
      };
    case ADD_FREQUENCY_PHRASE:
      return {
        ...state,
        phrases: {
          ...state.phrases,
          frequency: action.value,
        },
      };
    case REMOVE_FREQUENCY_PHRASE:
      return {
        ...state,
        phrases: {
          ...state.phrases,
          frequency: action.value,
        },
      };
    case TOGGLE_PHRASES_FILTER:
      return {
        ...state,
        phrases: {
          ...state.phrases,
          filter: !state.phrases.filter,
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
    case AUTO_VERB_VIEW:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          autoVerbView: !state.vocabulary.autoVerbView,
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
