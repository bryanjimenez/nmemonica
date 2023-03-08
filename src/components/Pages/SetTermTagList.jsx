import orderBy from "lodash/orderBy";
import partition from "lodash/partition";
import PropTypes from "prop-types";
import React, { useEffect } from "react";
import { GroupItem } from "../Form/GroupItem";

/**
 * @typedef {Object} SetTermGListProps
 * @property {string[]} termTags
 * @property {string[]} termActive
 * @property {(grp:string)=>function} toggleTermActive
 * @property {number} [selectedCount]
 */

/**
 * If the string contains a name of a group and a level.
 * example: Group_6
 * @param {string} groupName
 */
export function isGroupLevel(groupName){
  return groupName.includes("_") && Number.isInteger(parseInt(groupName.split("_")[1], 10));
}
/**
 * Group and subgroup list
 * @param {SetTermGListProps} props
 */
export function SetTermTagList(props) {
  const { termActive, termTags, toggleTermActive, selectedCount } = props;

  useEffect(() => {
    // remove stale active tags
    termActive.forEach((term) => {
      if (!termTags.includes(term)) {
        toggleTermActive(term);
      }
    });
  }, [termActive, termTags, toggleTermActive]);

  const [numericTags, alphaTags] = partition(
    termTags,
    (t) => isGroupLevel(t)
  );

  // numericGroups = [[grpA_1, grpA_2, ..., grpA_X], [grpB_1, grpB_2, ..., grpB_X]]
  const numericGroups = Object.values(
    numericTags.reduce((/** @type {{[idx:string]:string[]}}*/ acc, curr) => {
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
      <h5 key={0}>Tag List {count}</h5>
      {sorted.map((g, i) => (
        <div key={i + 1}>
          <GroupItem
            key={i}
            active={termActive.includes(g)}
            onClick={() => {
              toggleTermActive(g);
            }}
          >
            {g}
          </GroupItem>
        </div>
      ))}
    </div>
  );
}

SetTermTagList.propTypes = {
  termTags: PropTypes.array,
  termActive: PropTypes.array,
  toggleTermActive: PropTypes.func,
  selectedCount: PropTypes.number,
};
