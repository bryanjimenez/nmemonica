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
  lit?: string; // literal translation
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

export interface GroupListMap {
  [mainGrp: string]: string[];
}

export interface SpaceRepetitionMap {
  [uid: string]: {
    /**
     * Last view
     * (Date.toJSON '2020-01-01T01:01:01.001Z')
     **/
    d: string;
    /** View count */ vC: number;
    /** Furigana shown (yes:undefined|true) */ f?: boolean;
    /** Reinforce */ rein?: boolean;
    /** Pronunciation incorrect */ pron?: true,

    /** Timed play play-count */ tpPc?: number;
    /** Timed play accuracy [0,1] */ tpAcc?: number;
    /** Timed play correct avg (ms) */ tpCAvg?: number;
  };
}

export interface FuriganaToggleMap {
  [uid: string]: {
    /** Furigana shown (yes:undefined|true) */ f?: boolean;
  };
}

export interface AudioQueryParams {
  /** Target language */ tl: string;
  /** Query */ q: string;
  /** Caching/indexedDB key */ uid: string;
}

export type VerbFormArray = {
  /** Verb form (tense label) */ name: string;
  /** inflected/conjugated verb */ value: JapaneseText;
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

export type SetStateOb<T> = (arg0: Partial<T>) => void;
export type SetStateFn<T> = (arg0: (arg0: T) => Partial<T> | undefined) => void;

/**
 * Function overloads for Component.setState
 */
export type SetState<T> = SetStateOb<T> & SetStateFn<T>;

/**
 * Removes optional (?) from all of O's properties
 * @param O Object to remove optional attribute from properties
 */
 export type WithoutOpt<O> = {
  [k in keyof O]-?: O[k];
}

/**
 * @param O Object
 * @param type type to filter
 */
export type FilterKeysOfType<O,type> = {
  [k in keyof WithoutOpt<O>]: WithoutOpt<O>[k] extends type? k: never
}[keyof O]
