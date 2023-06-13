import React from "react";
import PropTypes from "prop-types";
import { GroupItem } from "../Form/GroupItem";
import orderBy from "lodash/orderBy";
import type { GroupListMap } from "../../typings/raw";

interface SetTermGListProps {
  termsGroups: GroupListMap;
  termsActive: string[];
  toggleTermActiveGrp: (grp: string) => void;
}

/**
 * Group and subgroup list
 * @param {SetTermGListProps} props
 */
export function SetTermGList(props: SetTermGListProps) {
  return (
    <div>
      <h5 key={0}>Groups</h5>

      {Object.keys(props.termsGroups).map((g, i) => {
        const grpActive = props.termsActive.includes(g);

        return (
          <div key={i + 1}>
            <GroupItem
              key={i}
              active={props.termsActive.includes(g)}
              onClick={() => props.toggleTermActiveGrp(g)}
            >
              {g}
            </GroupItem>

            {!grpActive &&
              orderBy(props.termsGroups[g], (o) => {
                // order numerically if group has _number
                const [, /*lbl,*/ num] = o.split("_");
                if (Number.isInteger(parseInt(num, 10))) {
                  return parseInt(num, 10);
                }
                return o;
              }).map((s, i) => (
                <GroupItem
                  key={i}
                  addlStyle="ms-3"
                  active={props.termsActive.includes(g + "." + s)}
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
  termsGroups: PropTypes.object,
  termsActive: PropTypes.array,
  toggleTermActiveGrp: PropTypes.func,
};
