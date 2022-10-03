import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";

/**
 * @typedef {{
 * addlStyle: string}} NotReadyProps
 */

/**
 * @param {NotReadyProps} props
 */
export function NotReady(props) {
  const css = classNames({
    [props.addlStyle]: true,
    "d-flex flex-column justify-content-around text-center h-100": true,
  });
  return (
    <div className={css}>
      <div>Awaiting data ...</div>
    </div>
  );
}

NotReady.propTypes = {
  addlStyle: PropTypes.string,
};
