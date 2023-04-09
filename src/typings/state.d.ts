import {store} from '../reducers/index'

import { DEFAULT_SETTINGS } from "../reducers/settingsRed";
import { DEFAULT_STATE as VOCABULARY_DEFAULT_STATE } from "../reducers/vocabularyRed";
import { DEFAULT_STATE as PHRASES_DEFAULT_STATE } from "../reducers/phrasesRed";
import { DEFAULT_STATE as KANJI_DEFAULT_STATE } from "../reducers/kanjiRed";
import { DEFAULT_STATE as OPPOSITES_DEFAULT_STATE } from "../reducers/oppositesRed";
import { initialState as VERB_INITIAL_STATE } from "../slices/verbsSlice";

type VocabularyRootState = typeof VOCABULARY_DEFAULT_STATE;
type PhrasesRootState = typeof PHRASES_DEFAULT_STATE;
type KanjiRootState = typeof KANJI_DEFAULT_STATE;
type OppositesRootState = typeof OPPOSITES_DEFAULT_STATE;
type SettigsRootState = typeof DEFAULT_SETTINGS;
type VerbRootState = typeof VERB_INITIAL_STATE;

export type AppRootState = {
  version: { [compName: string]: string };
  vocabulary: VocabularyRootState;
  verb: VerbRootState;
  phrases: PhrasesRootState;
  kanji: KanjiRootState;
  opposites: OppositesRootState;
  settings: SettigsRootState;
};


declare global {
  type RootState = ReturnType<typeof store.getState>
}