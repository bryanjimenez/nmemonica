import React from "react";
import PropTypes from "prop-types";

/**
 * @typedef {{
 * onClick?: function,
 * children?: string|JSX.Element,
 * largeValue?: string|JSX.Element,
 * smallValue?: string|JSX.Element,
 * largeStyle?: any,
 * smallStyle?: any}} SizableProps
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

  return (
    <div>
      <span
        className="clickable"
        onClick={() => {
          if (typeof props.onClick === "function") {
            props.onClick();
          }
        }}
      >
        <span style={props.largeStyle} className="d-none d-sm-inline">
          {largeValue}
        </span>
        <span style={props.smallStyle} className="d-inline d-sm-none">
          {smallValue}
        </span>
      </span>
    </div>
  );
}

Sizable.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  largeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  smallValue: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),

  largeStyle: PropTypes.object,
  smallStyle: PropTypes.object,
};
