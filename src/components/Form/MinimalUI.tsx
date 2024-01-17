import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import StackNavButton from "./StackNavButton";
import type { MouseEventHandler } from "react";
import React from "react";

interface MinimalUIProps {
  prev: MouseEventHandler;
  next: MouseEventHandler;
  children?: React.JSX.Element;
}

export function MinimalUI(props: MinimalUIProps) {
  const color = "error";
  return (
    <div className="d-flex justify-content-between h-100">
      <StackNavButton color={color} ariaLabel="Previous" action={props.prev}>
        <ChevronLeftIcon size={16} />
      </StackNavButton>
      {props.children}
      <StackNavButton color={color} ariaLabel="Next" action={props.next}>
        <ChevronRightIcon size={16} />
      </StackNavButton>
    </div>
  );
}

MinimalUI.propTypes = {
  prev: PropTypes.func,
  next: PropTypes.func,
  color: PropTypes.string,
  children: PropTypes.object,
};
