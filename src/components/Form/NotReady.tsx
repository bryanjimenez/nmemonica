import classNames from "classnames";
import React from "react";

export function NotReady(props: { addlStyle: string; text?: string }) {
  const css = classNames({
    [props.addlStyle]: true,
    "d-flex flex-column justify-content-around text-center h-100": true,
  });
  return (
    <div className={css}>
      <div>{props.text ?? "Awaiting data ..."}</div>
    </div>
  );
}
