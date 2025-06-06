import orderBy from "lodash/orderBy";
import type { GroupListMap } from "nmemonica";

import { GroupItem } from "../Form/GroupItem";

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
      <span className="fs-5 fw-light">Groups</span>

      {Object.keys(props.termsGroups).map((g) => {
        const grpActive = props.termsActive.includes(g);

        return (
          <div key={g}>
            <GroupItem
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
              }).map((s) => (
                <GroupItem
                  key={`${g}.${s}`}
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
