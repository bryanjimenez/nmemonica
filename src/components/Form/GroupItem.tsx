import classNames from "classnames";
import PropTypes from "prop-types";
import { PlusCircleIcon, XCircleIcon } from "@primer/octicons-react";
import type { MouseEventHandler } from "react";
import React from "react";

interface GroupItemProps {
  addlStyle?: string;
  active: boolean;
  onClick: MouseEventHandler;
  children: React.JSX.Element | string;
}

export function GroupItem(props: GroupItemProps) {
  const css = classNames({
    ["" + props.addlStyle]: props.addlStyle ? true : false,
    "p-0 px-2": true,
    "font-weight-bold": props.active,
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

GroupItem.propTypes = {
  addlStyle: PropTypes.string,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.string,
};
