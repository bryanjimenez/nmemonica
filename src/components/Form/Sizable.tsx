import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

// Conditinal css mapping
interface CSSMap {
  [key:string]: boolean
}

// xs and xxl omitted
type BootStrapBreakPoints = "sm"|"md"|"lg"|"xl"

interface SizableProps {
  fragment?: boolean,
  breakPoint: BootStrapBreakPoints,
  rootClassName?: CSSMap,
  className?: CSSMap,
  largeClassName?: CSSMap,
  smallClassName?: CSSMap
  onClick?: Function,
  children?: string|JSX.Element,
  largeValue?: string|JSX.Element,
  smallValue?: string|JSX.Element
}

export default function Sizable(props:SizableProps) {
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

  const rootClass =
    (props.rootClassName !== undefined && classNames(props.rootClassName)) ||
    undefined;
  const unconditionalClass =
    (props.className !== undefined && props.className) || {};

  const largeViewClass =
    "d-none d-" +
    props.breakPoint +
    "-inline" +
    (props.largeClassName !== undefined
      ? " " + classNames(props.largeClassName)
      : "");
  const smallViewClass =
    "d-inline d-" +
    props.breakPoint +
    "-none" +
    (props.smallClassName !== undefined
      ? " " + classNames(props.smallClassName)
      : "");

  const onClickHandler = () => {
    if (typeof props.onClick === "function") {
      props.onClick();
    }
  };

  const content = [
    <span
      key={0}
      data-name="large"
      className={
        classNames({
          [largeViewClass]: true,
          ...unconditionalClass,
          clickable: typeof props.onClick === "function",
        }) || undefined
      }
      onClick={onClickHandler}
    >
      {largeValue}
    </span>,
    <span
      key={1}
      data-name="small"
      className={
        classNames({
          [smallViewClass]: true,
          ...unconditionalClass,
          clickable: typeof props.onClick === "function",
        }) || undefined
      }
      onClick={onClickHandler}
    >
      {smallValue}
    </span>,
  ];

  return props.fragment === true ? (
    <React.Fragment>{content}</React.Fragment>
  ) : (
    <div className={rootClass}>{content}</div>
  );
}

Sizable.propTypes = {
  fragment: PropTypes.bool,
  breakPoint: PropTypes.string,
  rootClassName: PropTypes.object,
  className: PropTypes.object,
  largeClassName: PropTypes.object,
  smallClassName: PropTypes.object,

  onClick: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  largeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  smallValue: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};
