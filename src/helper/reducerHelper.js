/**
 * Builds a groub object from the list of terms (words or phrases) with grp info
 * @param {Object} termObj
 * @returns {Object} groupObject
 */
export function buildGroupObject(termObj, mainGrp = "grp", subGrp = "subGrp") {
  return Object.values(termObj).reduce((a, o) => {
    if (a[o[mainGrp]]) {
      if (!a[o[mainGrp]].includes(o[subGrp]) && o[subGrp]) {
        return { ...a, [o[mainGrp]]: [...a[o[mainGrp]], o[subGrp]] };
      }
      return a;
    }

    if (o[subGrp]) {
      return { ...a, [o[mainGrp]]: [o[subGrp]] };
    }

    return { ...a, [o[mainGrp]]: [] };
  }, {});
}
