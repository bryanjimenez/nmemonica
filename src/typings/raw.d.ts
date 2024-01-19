export interface RawJapanese {
  japanese: string;
  pronounce?: string;
  form?: string;
  slang?: boolean;
  keigo?: boolean;
  adj?: string;
  /** uid of intransitive pair */
  intr?: true | string;
  /** uid of transitive pair */
  trans?: string;
  exv?: 1 | 2 | 3;
}

export type SourceVocabulary = Omit<RawVocabulary, "uid" | "tags"> & {
  tag?: string;
};

export interface RawVocabulary extends RawJapanese {
  uid: string;

  english: string;
  romaji?: string;

  grp?: string;
  subGrp?: string;

  tags: string[];
}

export type SourcePhrase = Omit<
  RawPhrase,
  "uid" | "tags" | "particles" | "inverse"
> & { tag?: string };
export interface RawPhrase {
  uid: string;

  english: string;
  lit?: string; // literal translation
  lesson?: string;
  romaji?: string;

  japanese: string;

  grp?: string;
  subGrp?: string;

  tags: string[];
  particles?: string[];
  inverse?: string;
  polite: boolean;
}

export type SourceKanji = Omit<RawKanji, "uid" | "tags" | "radical"> & {
  tag?: string;
};
export interface RawKanji {
  uid: string;

  kanji: string;
  on?: string;
  kun?: string;
  english: string;

  grp?: string;
  tags: string[];
  /** Radical shown in an example Kanji */
  radex?: string;

  /** Radical info (example Kanji) */
  radical?: { example: string[] };
}

export type GroupListMap = Record<string, string[]>;

export interface MetaDataObj {
  /**
   * Last view
   * (Date.toJSON '2020-01-01T01:01:01.001Z')
   **/
  d: string;
  /** View count */ vC: number;
  difficulty?: number;
  /** number of days to */ nextReview?: number;

  /** Furigana shown (yes:undefined|true) */ f?: boolean;
  /** Reinforce */ rein?: boolean;
  /** Pronunciation incorrect */ pron?: true;

  /** Timed play play-count */ tpPc?: number;
  /** Timed play accuracy [0,1] */ tpAcc?: number;
  /** Timed play correct avg (ms) */ tpCAvg?: number;
}

export type FuriganaToggleMap = Record<
  string,
  | {
      /** Furigana shown (yes:undefined|true) */ f?: boolean;
    }
  | undefined
>;

export interface AudioQueryParams {
  /** Target language */ tl: string;
  /** Query */ q: string;
  /** Caching/indexedDB key */ uid: string;
}

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
};

/**
 * @param O Object
 * @param type type to filter
 */
export type FilterKeysOfType<O, type> = {
  [k in keyof WithoutOpt<O>]: WithoutOpt<O>[k] extends type ? k : never;
}[keyof O];

// Partial<T> & Pick<T, "english" | "kanji">;
// export type Optional<T, K extends keyof T> = Omit<T, K> & { [P in keyof T]: T[P] | undefined; }
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Get all values from a Record */
export type ValuesOf<R> = R[keyof R];
