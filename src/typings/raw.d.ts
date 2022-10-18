export interface RawJapanese {
  japanese: string;
  pronounce?: string;
  form?: string;
  slang?: boolean;
  keigo?: boolean;
  adj?: string;
  intr?: true | string;
  trans?: string;
  exv?: 1 | 2 | 3;
}

export interface RawVocabulary extends RawJapanese {
  uid: string;

  english: string;
  romaji?: string;

  grp?: string;
  subGrp?: string;
  tag?: string[];
}

export interface RawPhrase {
  uid: string;

  english: string;
  lit: string; // literal translation
  romaji: string;

  japanese: string;

  grp?: string;
  subGrp?: string;
  tag?: string[];
  particles?: string[];
}

export interface RawKanji {
  uid: string;

  kanji: string;
  on: string;
  kun: string;
  eng: string; // english

  grp?: string;
  subGrp?: string;
  tag?: string[];
}

export interface SpaceRepetitionMap {
  [uid: string]: {
    d: Date;
    c: number;
  };
}

export interface FuriganaToggleMap {
  [uid: string]: {
    f: boolean;
  };
}

export interface AudioQueryParams {
  tl: string;
  q: string;
  uid: string;
}

export type VerbFormArray = {
  name: string;
  value: JapaneseText;
}[];

/**
 * Parsing used for Ruby Element
 */
export interface FuriganaParseObject {
  kanjis: string[];
  furiganas: string[];
  okuriganas: string[];
  startsWKana: boolean;
}

/**
 * Mask of FuriganaParseObject
 */
export type FuriganaParseObjectMask = {
  k: number;
  f: number;
  o: number;
}[];

export type ActionHandlerTuple = [
  MediaSessionAction,
  MediaSessionActionHandler
];
