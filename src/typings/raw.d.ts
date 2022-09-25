interface RawJapanese {
    japanese: string,
    pronounce?: string,
    form?: string,
    slang?: boolean,
    keigo?: boolean,
    adj?: string,
    intr?: true|string,
    trans?: string,
    exv?: 1|2|3, 
}

export interface RawVocabulary extends RawJapanese {
    english: string,
    // japanese: string,
    // pronounce?: string,
    uid: string,
    grp?: string,
    subGrp?: string,
    // form?: string,
    // slang?: boolean,
    // keigo?: boolean,
    // adj?: string,
    // intr?: true|string,
    // trans?: string,
    // exv?: 1|2|3,
    tag?: string[],
}

interface SpaceRepetitionMap {
    [uid: string]: {
        d: Date,
        c: number,
    }
}

interface AudioQueryParams {
    tl: string,
    q: string,
    uid: string,
}

export type VerbFormArray = {
    name: string,
    value: JapaneseText,
}[]
