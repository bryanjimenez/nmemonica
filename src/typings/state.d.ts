import { DEFAULT_SETTINGS } from "../reducers/settingsRed";
import { DEFAULT_STATE as VOCABULARY_DEFAULT_STATE } from "../reducers/vocabularyRed";
import { DEFAULT_STATE as PHRASES_DEFAULT_STATE } from "../reducers/phrasesRed";
import { DEFAULT_STATE as KANJI_DEFAULT_STATE } from "../reducers/kanjiRed";
import { DEFAULT_STATE as OPPOSITES_DEFAULT_STATE } from "../reducers/oppositesRed";

export type VocabularyRootState = typeof VOCABULARY_DEFAULT_STATE;
export type PhrasesRootState = typeof PHRASES_DEFAULT_STATE;
export type KanjiRootState = typeof KANJI_DEFAULT_STATE;
export type OppositesRootState = typeof OPPOSITES_DEFAULT_STATE;
export type SettigsRootState = typeof DEFAULT_SETTINGS;
export type AppRootState = {
  version: { [compName: string]: string };
  vocabulary: VocabularyRootState;
  phrases: PhrasesRootState;
  kanji: KanjiRootState;
  opposites: OppositesRootState;
  settings: SettigsRootState;
};
