import classNames from "classnames";
import type React from "react";

// Conditinal css mapping
interface CSSMap {
  [key: string]: boolean;
}

// xs and xxl omitted
type BootStrapBreakPoints = "sm" | "md" | "lg" | "xl";

interface SizableProps {
  fragment?: boolean;
  breakPoint: BootStrapBreakPoints;
  rootClassName?: CSSMap;
  className?: CSSMap;
  largeClassName?: CSSMap;
  smallClassName?: CSSMap;
  onClick?: () => void;
  children?: string | React.JSX.Element;
  largeValue?: string | React.JSX.Element;
  smallValue?: string | React.JSX.Element;
}

export default function Sizable(props: SizableProps) {
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

  const content = (
    <>
      <span
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
      </span>
      <span
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
      </span>
    </>
  );

  return props.fragment === true ? (
    <>{content}</>
  ) : (
    <div className={rootClass}>{content}</div>
  );
}
