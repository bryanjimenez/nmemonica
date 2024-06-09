import orderBy from "lodash/orderBy";
import partition from "lodash/partition";
import React, { useEffect } from "react";

import { GroupItem } from "../Form/GroupItem";

interface SetTermTagListProps {
  termsTags: string[]; //List of all available tags
  termsActive: string[]; //List of tags that are selected
  toggleTermActive: (grp: string) => void;
  selectedCount?: number; //Number of terms currently selected by filter
}

/**
 * If the string contains a name of a group and a level.
 * example: Group_6
 */
export function isGroupLevel(groupName: string) {
  return (
    groupName.includes("_") &&
    Number.isInteger(parseInt(groupName.split("_")[1], 10))
  );
}
/**
 * Group and subgroup list
 */
export function SetTermTagList(props: SetTermTagListProps) {
  const { termsActive, termsTags, toggleTermActive, selectedCount } = props;

  useEffect(() => {
    // remove stale active tags
    termsActive.forEach((term) => {
      if (!termsTags.includes(term)) {
        toggleTermActive(term);
      }
    });
  }, [termsActive, termsTags, toggleTermActive]);

  const [numericTags, alphaTags] = partition(termsTags, (t) => isGroupLevel(t));

  // numericGroups = [[grpA_1, grpA_2, ..., grpA_X], [grpB_1, grpB_2, ..., grpB_X]]
  const numericGroups = Object.values(
    numericTags.reduce<{ [idx: string]: string[] }>((acc, curr) => {
      const groupName = curr.split("_")[0];
      if (acc[groupName]) {
        acc[groupName] = [...acc[groupName], curr];
      } else {
        acc[groupName] = [curr];
      }
      return acc;
    }, {})
  );

  const sorted = [
    ...orderBy(alphaTags),

    ...numericGroups.reduce((acc, curr) => {
      const sortd = orderBy(curr, (o) => {
        // order numerically if group has _number
        const [, /*lbl*/ num] = o.split("_");
        if (Number.isInteger(parseInt(num, 10))) {
          return parseInt(num, 10);
        }
        return o;
      });

      return [...acc, ...sortd];
    }, []),
  ];

  const count =
    (selectedCount && selectedCount > 0 && "(" + selectedCount + ")") || "";

  return (
    <div>
      <span className="fs-5 fw-light">Tag List {count}</span>
      {sorted.map((g) => (
        <GroupItem
          key={g}
          active={termsActive.includes(g)}
          onClick={() => {
            toggleTermActive(g);
          }}
        >
          {g}
        </GroupItem>
      ))}
    </div>
  );
}
