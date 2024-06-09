import { PlusCircleIcon, XCircleIcon } from "@primer/octicons-react";
import classNames from "classnames";
import type { MouseEventHandler } from "react";
import type React from "react";

interface GroupItemProps {
  addlStyle?: string;
  active: boolean;
  onClick: MouseEventHandler;
  children: React.JSX.Element | string;
}

export function GroupItem(props: GroupItemProps) {
  const css = classNames({
    [String(props.addlStyle)]: props.addlStyle ? true : false,
    "p-0 px-2": true,
    "fw-bold": props.active,
  });

  return (
    <div className={css} onClick={props.onClick}>
      <span className="p-1">
        {props.active ? (
          <XCircleIcon
            className="clickable incorrect-color"
            size="small"
            aria-label="remove"
          />
        ) : (
          <PlusCircleIcon className="clickable" size="small" aria-label="add" />
        )}
      </span>
      <span className="p-1">{props.children}</span>
    </div>
  );
}
