import type { GroupListMap, RawVocabulary, SourceVocabulary } from "nmemonica";

export function getPropsFromTags(tag: string | undefined) {
  let tagList: string[] = [];
  try {
    if (tag !== undefined) {
      const { tags } = JSON.parse(tag) as { tags: string[] };
      tagList = tags;
    }
  } catch (err) {
    // TODO: Return error obj?
  }

  if (tagList.length === 0)
    return { tags: [] as string[], similarKanji: [] as string[] };

  const h = "[\u3041-\u309F]{1,4}"; //  hiragana particle
  const commonK = "\u4E00-\u9FAF"; //   kanji
  const rareK = "\u3400-\u4DBF"; //     kanji
  const hasParticle = new RegExp("[pP]:" + h + "(?:," + h + ")*");
  const hasInverse = new RegExp("inv:[a-z0-9]{32}");
  const isIntransitiveWPair = new RegExp("intr:[a-z0-9]{32}");
  const isAdjective = new RegExp("(i|na)-adj");
  const nonWhiteSpace = new RegExp(/\S/);
  const hasPhoneticKanji = new RegExp(
    "[pP]:[" + commonK + rareK + "][+][\u3041-\u309F]+"
  );
  const hasRadicalExample = new RegExp(
    "[eE]:[" + commonK + rareK + "]" + "(?:,[" + commonK + rareK + "])*"
  );
  const hasSimilarKanji = new RegExp(
    "[sS]:[" + commonK + rareK + "]" + "(?:,[" + commonK + rareK + "])*"
  );

  const isPolite = new RegExp(/^polite$/i);
  const isKeigo = new RegExp(/^keigo$/i);
  const isIntransitive = new RegExp(/^intr$/i);

  let remainingTags: string[] = [];
  let particles: string[] = [];
  let inverse: string | undefined;
  let slang: boolean | undefined;
  let keigo: boolean | undefined;
  let polite: boolean | undefined;
  let exv: 1 | 2 | 3 | undefined;
  let intr: true | undefined;
  let trans: string | undefined;
  let adj: string | undefined;
  let phoneticKanji: { k: string; p: string } | undefined;
  let radicalExample: string[] | undefined;
  let similarKanji: string[] = [];

  tagList.forEach((tagWSpace: string) => {
    const t = tagWSpace.trim();

    switch (t) {
      // Vocabulary
      case "slang":
        slang = true;
        break;
      case isKeigo.test(t) && t:
        keigo = true;
        break;
      case "EV1":
        exv = 1;
        break;
      case isIntransitive.test(t) && t:
        intr = true;
        break;
      case isIntransitiveWPair.test(t) && t:
        trans = t.split(":")[1];
        break;
      case isAdjective.test(t) && t:
        adj = t.split("-")[0];
        break;

      // Phrases
      case isPolite.test(t) && t:
        polite = true;
        break;
      case hasParticle.test(t) && t:
        particles = t.split(":")[1].split(",");
        break;
      case hasInverse.test(t) && t:
        inverse = t.split(":")[1];
        break;

      // Kanji
      case hasPhoneticKanji.test(t) && t:
        const [_p, ktag] = t.split(":");
        const [k, p] = ktag.split("+");
        phoneticKanji = { k, p };
        break;
      case hasRadicalExample.test(t) && t:
        const [_e, example] = t.split(":");
        radicalExample = example.split(",");
        break;
      case hasSimilarKanji.test(t) && t:
        const [_s, similar] = t.split(":");
        similarKanji = similar.split(",");
        break;

      default:
        if (t && nonWhiteSpace.test(t)) {
          // don't add empty whitespace
          if (remainingTags.length === 0) {
            remainingTags = [t];
          } else {
            remainingTags = [...remainingTags, t];
          }
        }
    }
  });

  return {
    tags: remainingTags,
    // Vocabulary
    slang,
    keigo,
    exv,
    intr,
    trans,
    adj,

    // Phrases
    polite,
    inverse,
    particles,

    // Kanji
    /** Radical in this Kanji with common pronunciation */
    phoneticKanji,
    /** Example of Kanji containing this radical */
    radicalExample,
    /** Similar Kanji that can be confused with this Kanji */
    similarKanji,
  };
}

/**
 * Parses tag info to RawVocabulary
 */
export function buildVocabularyArray<T extends SourceVocabulary>(
  original: Record<string, T>
) {
  let transitivity: Record<string, { trans?: string; intr: string }> = {};
  let value: RawVocabulary[] = Object.keys(original).map((k) => {
    const iTerm = original[k];
    const { tags, slang, keigo, exv, intr, trans, adj } = getPropsFromTags(
      iTerm.tag
    );

    if (trans !== undefined) {
      const uid = trans;
      transitivity[uid] = {
        intr: k,
        trans: uid,
      };
    }

    return {
      ...iTerm,
      uid: k,

      // Keep raw metadata
      tag:
        iTerm.tag !== undefined
          ? (JSON.parse(iTerm.tag) as Record<string, string[]>)
          : undefined,

      // Derived from tag
      tags,
      slang,
      keigo,
      adj,
      exv,
      // TODO: these need type fix, don't reuse intr and trans
      intr,
      trans,
    };
  });

  value = value.map((v) => {
    return transitivity[v.uid] !== undefined
      ? { ...v, intr: transitivity[v.uid].intr }
      : v;
  });

  return value;
}

/**
 * Builds group info object. Keys are mainGrp.
 * For each mainGrp aggregates all subGrp of a mainGrp
 */
export function buildGroupObject<T extends { grp?: string; subGrp?: string }>(
  termObj: Record<string, T>
) {
  const mainGrp: keyof RawVocabulary = "grp";
  const subGrp: keyof RawVocabulary = "subGrp";

  return Object.values(termObj).reduce<GroupListMap>((a, o) => {
    if (o[mainGrp] !== undefined) {
      if (a[o[mainGrp]] !== undefined) {
        if (o[subGrp] !== undefined && !a[o[mainGrp]].includes(o[subGrp])) {
          return { ...a, [o[mainGrp]]: [...a[o[mainGrp]], o[subGrp]] };
        }
        return a;
      }

      if (o[subGrp] !== undefined) {
        return { ...a, [o[mainGrp]]: [o[subGrp]] };
      }

      return { ...a, [o[mainGrp]]: [] };
    } else {
      // o[mainGrp] === undefined
      return { ...a };
    }
  }, {});
}

/**
 * Creates a list of unique tags
 */
export function buildTagObject<T extends { tags: string[] }>(termObj: T[]) {
  const tagK: keyof RawVocabulary = "tags";
  let tags: string[] = [];

  termObj.forEach((o) => {
    if (o[tagK] !== undefined && o[tagK]?.length > 0) {
      tags = [...tags, ...o[tagK]];
    }
  });

  return Array.from(new Set(tags));
}

/**
 * Build a map which key is a uid and value is a set of kanji's uids.
 * Describes similarity relationship between Kanjis.
 * @param allSimilars Map of relationship between a kanji(uid) and it's simliar kanji(uid[])
 * @param kanjiUID
 * @param kanjiSimilarList
 */
export function buildSimilarityMap(
  allSimilars: Map<string, Set<string>>,
  kanjiUID: string,
  kanjiSimilarList: string[]
) {
  const s0 = allSimilars.get(kanjiUID) ?? new Set();

  kanjiSimilarList.forEach((s) => {
    s0.add(s);
    const s1 = allSimilars.get(s) ?? new Set();
    s1.add(kanjiUID);
    kanjiSimilarList.forEach((ss) => {
      if (ss !== s) {
        s1.add(ss);
      }
    });
    if (s1.size > 0) {
      allSimilars.set(s, s1);
    }
  });

  if (s0.size > 0) {
    allSimilars.set(kanjiUID, s0);
  }

  return allSimilars;
}
