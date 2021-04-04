import { GET_KANA } from "../actions/kanaAct";

const DEFAULT_STATE = {
  hiragana: [],
  katakana: [],
  vowels: [],
  consonants: [],
  sounds: {},
};
const DEFAULT_ACTION = {};

const hiraganaReducer = (state = DEFAULT_STATE, action = DEFAULT_ACTION) => {
  switch (action.type) {
    case GET_KANA:
      return {
        ...state,
        hiragana: action.hiragana,
        katakana: action.katakana,
        vowels: action.vowels,
        consonants: action.consonants,
        sounds: action.sounds,
      };
    default:
      return state;
  }
};

export default hiraganaReducer;
