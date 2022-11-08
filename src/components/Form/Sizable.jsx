import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

/**
 * @typedef {{
 * breakPoint: string,
 * className?: string,
 * onClick?: function,
 * children?: string|JSX.Element,
 * largeValue?: string|JSX.Element,
 * smallValue?: string|JSX.Element,
 * largeView?: string,
 * smallView?: string}} SizableProps
 */

/**
 * @param {SizableProps} props
 */
export default function Sizable(props) {
  let largeValue, smallValue;
  if (props.children) {
    largeValue = props.children;
    smallValue = props.children;
  }

  if (props.largeValue) {
    largeValue = props.largeValue;
  }

  if (props.smallValue) {
    smallValue = props.smallValue;
  }

  const parentConstClass =
    (props.className && { [props.className]: true }) || {};

  let largeViewClass = "d-none d-" + props.breakPoint + "-inline";
  // let largeViewClass = "d-none d-md-inline"
  if (props.largeView) {
    largeViewClass += " " + props.largeView;
  }

  let smallViewClass = "d-inline d-" + props.breakPoint + "-none";
  // let smallViewClass = "d-inline d-md-none";
  if (props.smallView) {
    smallViewClass += " " + props.smallView;
  }

  return (
    <span
      className={
        classNames({
          ...parentConstClass,
          clickable: typeof props.onClick === "function",
        }) || undefined
      }
      onClick={() => {
        if (typeof props.onClick === "function") {
          props.onClick();
        }
      }}
    >
      <span data-name="large" className={largeViewClass}>
        {largeValue}
      </span>
      <span data-name="small" className={smallViewClass}>
        {smallValue}
      </span>
    </span>
  );
}

Sizable.propTypes = {
  breakPoint: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  largeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  smallValue: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),

  largeView: PropTypes.string,
  smallView: PropTypes.string,
};
