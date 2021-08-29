/**
 * Builds a groub object from the list of terms (words or phrases) with grp info
 * @param {Array} termList
 * @returns {Object} groupObject
 */
export function buildGroupObject(termList) {
  return Object.values(termList).reduce((a, o) => {
    if (a[o.grp]) {
      if (!a[o.grp].includes(o.subGrp) && o.subGrp) {
        return { ...a, [o.grp]: [...a[o.grp], o.subGrp] };
      }
      return a;
    }

    if (o.subGrp) {
      return { ...a, [o.grp]: [o.subGrp] };
    }

    return { ...a, [o.grp]: [] };
  }, {});
}
