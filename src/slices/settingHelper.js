/**
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

// enum
export const DebugLevel = Object.freeze({
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  DEBUG: 3,
});

// enum
export const TermFilterBy = Object.freeze({
  GROUP: 0,
  FREQUENCY: 1,
  TAGS: 2,
});

// enum
export const TermSortBy = Object.freeze({
  RANDOM: 0,
  ALPHABETIC: 1,
  VIEW_DATE: 2,
  GAME: 3,
  DIFFICULTY: 4,
});

export const TermSortByLabel = [
  "Randomized",
  "Alphabetic",
  "Staleness",
  "Space Rep",
  "Difficulty",
];

/**
 * Toggle a filter, or override. Skips non-allowed values
 * @param {number} filter
 * @param {number[]} allowed
 * @param {number} [override]
 */
export function toggleAFilter(filter, allowed, override) {
  const max = Math.max(...allowed);

  let newFilter = filter;
  if (override !== undefined && allowed.includes(override)) {
    newFilter = override;
  } else {
    while (!allowed.includes(newFilter) || newFilter > max) {
      newFilter = filter + 1 > max ? 0 : filter + 1;
    }
  }

  return newFilter;
}

/**
 * Adds or removes grpNames to the activeGroup list.
 * Returns an updated list of selected groups
 * @param {string[]} grpNames a group name to be toggled
 * @param {string[]} activeGroup a list of groups that are selected
 */
export function grpParse(grpNames, activeGroup) {
  /** @type {string[]} */
  let newValue = [];

  const grpNamesSet = [...new Set(grpNames)];
  const activeGroupSet = [...new Set(activeGroup)];

  grpNamesSet.forEach((grpEl) => {
    const isGrp = grpEl.indexOf(".") === -1;

    if (isGrp) {
      if (activeGroupSet.some((e) => e.indexOf(grpEl + ".") !== -1)) {
        newValue = [
          ...activeGroupSet.filter((v) => v.indexOf(grpEl + ".") === -1),
          grpEl,
        ];
      } else if (activeGroupSet.includes(grpEl)) {
        newValue = [...activeGroupSet.filter((v) => v !== grpEl)];
      } else {
        newValue = [...activeGroupSet, grpEl];
      }
    } else {
      newValue = activeGroupSet.includes(grpEl)
        ? activeGroupSet.filter((v) => v !== grpEl)
        : [...activeGroupSet, grpEl];
    }
  });

  return newValue;
}

/**
 * Update term metadata
 * @param {string} uid
 * @param {SpaceRepetitionMap} spaceRep
 * @param {{count?: boolean, date?: boolean}} update Update options
 * @param {{toggle?: (import("../typings/raw").FilterKeysOfType<SpaceRepetitionMap["uid"], boolean>)[], set?: {[k in keyof SpaceRepetitionMap["uid"]]+?: SpaceRepetitionMap["uid"][k]|null}}} [options] additional optional settable attributes ({@link furiganaToggled })
 */
export function updateSpaceRepTerm(
  uid,
  spaceRep,
  update = { count: true, date: true },
  options
) {
  let prevMap =
    spaceRep[uid] === undefined ? undefined : { [uid]: spaceRep[uid] };

  let count;
  if (spaceRep[uid] && spaceRep[uid].vC > 0 && update.count === true) {
    count = spaceRep[uid].vC + 1;
  } else if (spaceRep[uid] && spaceRep[uid].vC > 0 && update.count === false) {
    count = spaceRep[uid].vC;
  } else {
    count = 1;
  }

  let uidChangedAttr = {};
  if (options !== undefined) {
    if (options.toggle) {
      const optToggled = options.toggle.reduce((acc, attr) => {
        let val;
        if (["f"].includes(attr)) {
          // this default is only for furigana so far
          val = !(spaceRep[uid] && spaceRep[uid][attr] === false) || false;
        } else {
          val = spaceRep[uid] && spaceRep[uid][attr];
        }

        return { ...acc, [attr]: !val };
      }, {});

      uidChangedAttr = { ...uidChangedAttr, ...optToggled };
    }

    if (options.set !== undefined) {
      const optSet = Object.keys(options.set).reduce((acc, k) => {
        if (options.set !== undefined && options.set[k] !== undefined) {
          if (options.set[k] === null) {
            acc = { ...acc, [k]: undefined };
          } else {
            acc = { ...acc, [k]: options.set[k] };
          }
        }
        return acc;
      }, {});

      uidChangedAttr = { ...uidChangedAttr, ...optSet };
    }
  }

  const keepPrevDate = spaceRep[uid]?.d !== undefined && update.date === false;
  const now = keepPrevDate ? spaceRep[uid].d : new Date().toJSON();
  /** @type {SpaceRepetitionMap["uid"]} */
  const o = {
    ...(spaceRep[uid] || {}),
    vC: count,
    d: now,
    ...uidChangedAttr,
  };

  const map = { [uid]: o };
  prevMap = prevMap === undefined ? { ...map } : prevMap;

  /** @type {SpaceRepetitionMap} */
  const newValue = { ...spaceRep, ...map };

  return { map, prevMap, value: newValue };
}
