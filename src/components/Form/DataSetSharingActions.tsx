import { type PropsWithChildren, useContext } from "react";

import { WebRTCContext } from "../../context/webRTC";

export const enum RTCTransferRequired {
  channel = "Required an initialized rtcChannel",
}

export interface DataSetSharingAction {
  action: "import" | "export";
}

export function DataSetSharingActions(props: PropsWithChildren<unknown>) {
  const { children } = props;
  const { rtcChannel, direction } = useContext(WebRTCContext);

  if (rtcChannel === null || children === null || children === undefined) {
    return null;
  }

  const cNode = children as (React.ReactNode & {
    props: DataSetSharingAction;
  })[];
  if (!cNode.every((c) => "action" in c.props && c.props.action.length > 0)) {
    throw new Error("Required prop 'action' missing");
  }

  if (cNode.length < 2) {
    throw new Error("Expected atleast two nodes");
  }

  return cNode.filter((c) =>
    direction === "incoming"
      ? c.props.action === "import"
      : c.props.action === "export"
  );
}
