/**
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../typings/raw").GroupListMap} GroupListMap
 */

/**
 * Adds intransitive transitive info to RawVocabulary
 * @param {{[uid:string]:RawVocabulary}} original
 */
export function buildVocabularyObject(original) {
  /** @type {{[uid:string]: {trans:string, intr:string}}} */
  let transitivity = {};
  /** @type {RawVocabulary[]} */
  let value = Object.keys(original).map((k) => {
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
 * @param {{[uid:string]:RawVocabulary}} termObj
 */
export function buildGroupObject(termObj) {
  /** @type {keyof RawVocabulary} */
  const mainGrp = "grp";

  /** @type {keyof RawVocabulary} */
  const subGrp = "subGrp";

  return Object.values(termObj).reduce((/** @type {GroupListMap}*/ a, o) => {
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
 * @param {{[uid:string]:RawVocabulary}} termObj
 */
export function buildTagObject(termObj) {
  /** @type {keyof RawVocabulary} */
  const tag = "tag";
  /** @type {string[]} */
  let tags = [];

  Object.values(termObj).forEach((o) => {
    if (o[tag] && o[tag].length > 0) {
      tags = [...tags, ...o[tag]];
    }
  });

  return Array.from(new Set(tags));
}
