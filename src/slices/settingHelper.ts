import type {
  FilterKeysOfType,
  MetaDataObj,
  SpaceRepetitionMap,
} from "../typings/raw";

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

// enum
export const KanaType = Object.freeze({
  HIRAGANA: 0,
  KATAKANA: 1,
  MIXED: 2,
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
 */
export function toggleAFilter(
  filter: number,
  allowed: number[],
  override?: number
) {
  const max = Math.max(...allowed);

  let newFilter = filter;
  if (override !== undefined && allowed.includes(override)) {
    newFilter = override;
  } else {
    while (!allowed.includes(newFilter) || newFilter > max) {
      newFilter = newFilter + 1 > max ? 0 : newFilter + 1;
    }
  }

  return newFilter;
}

/**
 * Adds or removes grpNames to the activeGroup list.
 * Returns an updated list of selected groups
 * @param grpNames a list of group names to be toggled
 * @param activeGroup a list of groups that are selected
 */
export function grpParse(grpNames: string[], activeGroup: string[]) {
  // const grpNamesSet = [...new Set(grpNames)];
  // let activeGroupSet = [...new Set(activeGroup)];
  const grpNamesSet = Array.from(new Set(grpNames));
  let activeGroupSet = Array.from(new Set(activeGroup));

  grpNamesSet.forEach((grpEl) => {
    const isParentGrp = !grpEl.includes(".");

    // toggle parent
    activeGroupSet = activeGroupSet.includes(grpEl)
      ? activeGroupSet.filter((v) => v !== grpEl)
      : [...activeGroupSet, grpEl];

    if (isParentGrp) {
      // remove children
      if (activeGroupSet.some((e) => e.includes(grpEl + "."))) {
        activeGroupSet = activeGroupSet.filter(
          (e) => !e.startsWith(grpEl + ".")
        );
      }
    }
  });

  return activeGroupSet;
}

/**
 * Update term metadata
 * @param uid
 * @param spaceRep
 * @param update Update options
 * @param options additional optional settable attributes ({@link furiganaToggled })
 */
export function updateSpaceRepTerm(
  uid: string,
  spaceRep: SpaceRepetitionMap,
  update: { count?: boolean; date?: boolean } = { count: true, date: true },
  options?: {
    toggle?: FilterKeysOfType<SpaceRepetitionMap["uid"], boolean>[];
    set?: Record<string, unknown>;
  }
) {
  // TODO: create test updateSpaceRepTerm
  const uidData = spaceRep[uid];
  let prevMap = uidData === undefined ? undefined : { [uid]: spaceRep[uid] };

  const views = uidData?.vC ?? -1;

  let count;
  if (views > 0 && update.count === true) {
    count = views + 1;
  } else if (views > 0 && update.count === false) {
    count = views;
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
          val = !(spaceRep[uid]?.[attr] === false) || false;
        } else {
          val = spaceRep[uid]?.[attr];
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

  const prevDate = uidData?.d;
  const keepPrevDate = prevDate !== undefined && update.date === false;
  const now = keepPrevDate ? prevDate : new Date().toJSON();
  const o: MetaDataObj = {
    ...(spaceRep[uid] || {}),
    vC: count,
    d: now,
    ...uidChangedAttr,
  };

  const map = { [uid]: o };
  prevMap = prevMap === undefined ? { ...map } : prevMap;

  const newValue: SpaceRepetitionMap = { ...spaceRep, ...map };

  // TODO: rename this to value-> record, map->value, prevMap -> prevValue
  return { map, prevMap, value: newValue };
}
