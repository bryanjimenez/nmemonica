/**
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 */

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

  return Object.values(termObj).reduce((/** @type {{[mainGrp:string]:string[]}}*/a, o) => {

    if(o[mainGrp]){
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
      return {...a}
    }
  }, {});
}
