import type { MetaDataObj } from "nmemonica";

import type { FilterKeysOfType } from "../typings/utils";

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
  DIFFICULTY: 2,
  VIEW_DATE: 3,
  RECALL: 4,
});

export const TermSortByLabel = [
  "Randomized",
  "Alphabetic",
  "Difficulty",
  "Viewed Date",
  "Recall Interval",
];

// enum
export const KanaType = Object.freeze({
  HIRAGANA: 0,
  KATAKANA: 1,
  MIXED: 2,
});

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
  spaceRep: Record<string, MetaDataObj | undefined>,
  update: { count?: boolean; date?: boolean } = { count: true, date: true },
  options?: {
    toggle?: FilterKeysOfType<MetaDataObj, boolean>[];
    set?: Record<string, unknown>;
  }
) {
  const uidData = spaceRep[uid];
  const prevVal = spaceRep[uid] ? { ...spaceRep[uid] } : undefined;

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
        if (options.set?.[k] !== undefined) {
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

  const prevDate = uidData?.lastView;
  const keepPrevDate = prevDate !== undefined && update.date === false;
  const now = keepPrevDate ? prevDate : new Date().toJSON();
  const newVal: MetaDataObj = {
    ...(spaceRep[uid] ?? {}),
    vC: count,
    lastView: now,
    ...uidChangedAttr,
  };

  const newRecord = { ...spaceRep, [uid]: newVal };

  return { record: newRecord, value: newVal, prevVal: prevVal ?? newVal };
}

/**
 * Returns a new metadata record without the uid specified
 * @param uidList List of uids to remove from metadata
 * @param metadata
 */
export function deleteMetadata(
  uidList: string[],
  metadata: Record<string, MetaDataObj | undefined>
) {
  const newRecord = uidList.reduce(
    (acc, uid) => {
      const r = { ...acc, [uid]: undefined };
      /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
      delete r[uid];

      return r;
    },
    { ...metadata }
  );

  return { record: newRecord };
}
