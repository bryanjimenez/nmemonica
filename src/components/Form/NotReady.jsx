import React from "react";
import classNames from "classnames";

export function NotReady(props) {
  const css = classNames({
    [props.addlStyle]: true,
    "d-flex flex-column justify-content-around text-center": true,
  });
  return (
    <div className={css}>
      <div>Awaiting data ...</div>
    </div>
  );
}
