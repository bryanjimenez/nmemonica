import type { GroupListMap, RawVocabulary } from "../typings/raw";

// FIXME: kanji tag splitting is different from vocab
export function getPropsFromTagsKanji(tag: string | undefined) {
  if (tag === undefined) return { tags: [] };

  const tags = tag.split(/[,]+/);

  let remainingTags: string[] = [];

  tags.forEach((t) => {
    t = t.trim();
    if (t.endsWith(",")) {
      t = t.slice(0, -1);
    }

    switch (t) {
      // case "slang":
      //   el.slang = true;
      //   break;
      default:
        if (remainingTags.length === 0) {
          remainingTags = [t];
        } else {
          remainingTags = [...remainingTags, t];
        }
    }
  });

  return {
    tags: remainingTags,
  };
}

export function getPropsFromTags(tag: string | undefined) {
  if (tag === undefined) return { tags: [] };

  const tagList = tag.split(/[\n\s, ]+/);
  const h = "[\u3041-\u309F]{1,4}"; // hiragana particle
  const hasParticle = new RegExp("p:" + h + "(," + h + ")*");
  const hasInverse = new RegExp("inv:[a-z0-9]{32}");
  const isIntransitive = new RegExp("intr:[a-z0-9]{32}");
  const isAdjective = new RegExp("(i|na)-adj");
  const nonWhiteSpace = new RegExp(/\S/);

  let remainingTags: string[] = [];
  let particles: string[] = [];
  let inverse: string | undefined;
  let slang: boolean | undefined;
  let keigo: boolean | undefined;
  let exv: 1 | 2 | 3 | undefined;
  let intr: true | undefined;
  let trans: string | undefined;
  let adj: string | undefined;

  tagList.forEach((t: string) => {
    switch (t) {
      // Vocabulary
      case "slang":
        slang = true;
        break;
      case "keigo":
        keigo = true;
        break;
      case "EV1":
        exv = 1;
        break;
      case "intr":
        intr = true;
        break;
      case isIntransitive.test(t) && t:
        trans = t.split(":")[1];
        break;
      case isAdjective.test(t) && t:
        adj = t.split("-")[0];
        break;

      // Phrases
      case hasParticle.test(t) && t:
        particles = t.split(":")[1].split(",");
        break;
      case hasInverse.test(t) && t:
        inverse = t.split(":")[1];
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
    inverse,
    particles,
  };
}

/**
 * Adds intransitive transitive info to RawVocabulary
 */
export function buildVocabularyObject(original: Record<string, RawVocabulary>) {
  let transitivity: Record<string, { trans?: string; intr: string }> = {};
  let value: RawVocabulary[] = Object.keys(original).map((k) => {
    const uid = original[k].trans;
    if (uid) {
      transitivity[uid] = {
        intr: k,
        trans: original[k].trans,
      };
    }

    return {
      ...original[k],
      uid: k,
    };
  });

  value = value.map((v) => {
    return transitivity[v.uid] ? { ...v, intr: transitivity[v.uid].intr } : v;
  });

  return value;
}

/**
 * Builds group info object. Keys are mainGrp.
 * For each mainGrp aggregates all subGrp of a mainGrp
 */
export function buildGroupObject(termObj: Record<string, RawVocabulary>) {
  const mainGrp: keyof RawVocabulary = "grp";
  const subGrp: keyof RawVocabulary = "subGrp";

  return Object.values(termObj).reduce<GroupListMap>((a, o) => {
    if (o[mainGrp]) {
      if (a[o[mainGrp]]) {
        if (o[subGrp] && !a[o[mainGrp]].includes(o[subGrp])) {
          return { ...a, [o[mainGrp]]: [...a[o[mainGrp]], o[subGrp]] };
        }
        return a;
      }

      if (o[subGrp]) {
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
export function buildTagObject<T extends { tag?: string[] }>(
  termObj: Record<string, T>
) {
  const tag: keyof RawVocabulary = "tag";
  let tags: string[] = [];

  Object.values(termObj).forEach((o) => {
    if (o[tag] && o[tag]?.length > 0) {
      tags = [...tags, ...o[tag]];
    }
  });

  return Array.from(new Set(tags));
}
