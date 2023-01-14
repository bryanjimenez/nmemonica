import { DEFAULT_SETTINGS } from "../reducers/settingsRed";
import { DEFAULT_STATE as PHRASES_DEFAULT_STATE } from "../reducers/phrasesRed";
import { DEFAULT_STATE as KANJI_DEFAULT_STATE } from "../reducers/kanjiRed";

export type PhrasesRootState = typeof PHRASES_DEFAULT_STATE;
export type KanjiRootState = typeof KANJI_DEFAULT_STATE;
export type SettigsRootState = typeof DEFAULT_SETTINGS;
export type AppRootState = {version: {[compName:string]:string},phrases: PhrasesRootState, kanji: KanjiRootState, settings:SettigsRootState}