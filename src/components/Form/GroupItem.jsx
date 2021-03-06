import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { PlusCircleIcon, XCircleIcon } from "@primer/octicons-react";

export function GroupItem(props) {
  const css = classNames({
    [props.addlStyle]: props.addlStyle && true,
    "p-0 pl-2 pr-2": true,
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
