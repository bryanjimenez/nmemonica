import React from "react";
import PropTypes from "prop-types";
import { GroupItem } from "../Form/GroupItem";
import orderBy from "lodash/orderBy";

/**
 * @typedef {Object} SetTermGListProps
 * @property {string[]} termTags
 * @property {string[]} termActive
 * @property {(grp:string)=>function} toggleTermActive
 * @property {number} [selectedCount]
 */

/**
 * Group and subgroup list
 * @param {SetTermGListProps} props
 */
export function SetTermTagList(props) {
  const numericTags = props.termTags.filter((t) => t.includes("_"));
  const alphaTags = props.termTags.filter((t) => !t.includes("_"));

  const sorted = [
    ...orderBy(alphaTags),
    ...orderBy(numericTags, (o) => {
      // order numerically if group has _number
      const [, /*lbl*/ num] = o.split("_");
      if (Number.isInteger(parseInt(num, 10))) {
        return parseInt(num, 10);
      }
      return o;
    }),
  ];

  const count =
    (props.selectedCount &&
      props.selectedCount > 0 &&
      "(" + props.selectedCount + ")") ||
    "";

  return (
    <div>
      <h5 key={0}>Tag List {count}</h5>
      {sorted.map((g, i) => (
        <div key={i + 1}>
          <GroupItem
            key={i}
            active={props.termActive.includes(g)}
            onClick={() => {
              props.toggleTermActive(g);
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
