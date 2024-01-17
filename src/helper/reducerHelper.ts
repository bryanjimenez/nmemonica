import type { RawVocabulary, GroupListMap } from "../typings/raw";

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
export function buildTagObject<T extends { tag: string[] }>(
  termObj: Record<string, T>
) {
  const tag: keyof RawVocabulary = "tag";
  let tags: string[] = [];

  Object.values(termObj).forEach((o) => {
    if (o[tag] && o[tag].length > 0) {
      tags = [...tags, ...o[tag]];
    }
  });

  return Array.from(new Set(tags));
}
