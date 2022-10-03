import React from "react";
import PropTypes from "prop-types";
import { GroupItem } from "../Form/GroupItem";
import orderBy from "lodash/orderBy";

/**
 * @typedef {{
 * vocabGroups: any,
 * vocabActive: string[],
 * toggleTermActiveGrp: (grp:string)=>function}} SetTermGListProps
 */

/**
 * Group and subgroup list
 * @param {SetTermGListProps} props
 */
export function SetTermGList(props) {
  return (
    <div>
      <h5 key={0}>Groups</h5>

      {Object.keys(props.vocabGroups).map((g, i) => {
        const grpActive = props.vocabActive.includes(g);

        return (
          <div key={i + 1}>
            <GroupItem
              key={i}
              active={props.vocabActive.includes(g)}
              onClick={() => {
                props.toggleTermActiveGrp(g);
              }}
            >
              {g}
            </GroupItem>

            {!grpActive &&
              orderBy(props.vocabGroups[g], (o) => {
                // order numerically if group has _number
                const [lbl, num] = o.split("_");
                if (Number.isInteger(parseInt(num, 10))) {
                  return parseInt(num, 10);
                }
                return o;
              }).map((s, i) => (
                <GroupItem
                  key={i}
                  addlStyle="ms-3"
                  active={props.vocabActive.includes(g + "." + s)}
                  onClick={() => {
                    props.toggleTermActiveGrp(g + "." + s);
                  }}
                >
                  {s}
                </GroupItem>
              ))}
          </div>
        );
      })}
    </div>
  );
}

SetTermGList.propTypes = {
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
  toggleTermActiveGrp: PropTypes.func,
};
