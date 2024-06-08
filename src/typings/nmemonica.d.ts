declare module "nmemonica" {
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
    opposite?: string[];
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
    lastView: string;
    /** View count */ vC: number;

    /** Furigana shown (yes:undefined|true) */ f?: boolean;
    /** Reinforce */ rein?: boolean;
    /** Pronunciation incorrect */ pron?: true;

    /** Timed play play-count */ tpPc?: number;
    /** Timed play accuracy [0,1] */ tpAcc?: number;
    /** Timed play correct avg (ms) */ tpCAvg?: number;

    // Space Repetition
    /**
     * Last date reviewed
     * (Date.toJSON '2020-01-01T01:01:01.001Z')
     */
    lastReview?: string;
    consecutiveRight?: number;

    /** Item difficulty percentage [0,100]*/
    difficultyP?: number;
    /** Recall accuracy percentage [0,100]*/
    accuracyP?: number;

    /** Calculated review value */
    daysBetweenReviews?: number;
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
    MediaSessionActionHandler,
  ];
}
