/**
 * WebRTC Signaling helper functions
 */

// TODO: a=setup actpass/active get from context (remove from msg)

const SDP_MINI_SEP = "\u001E";
const CAN_GROUP_SEP = "\u001D";

export const enum MiniSDPFields {
  /** Candidate Block */
  canBlk = "candidateBlock",
  o = "o",
  app = "application",
  ufrag = "ufrag",
  pw = "password",
  finger = "finger",
  setup = "setup",
  port = "port",
  maxSize = "maxSize",
}

export interface MiniSDP {
  [MiniSDPFields.canBlk]: string;
  [MiniSDPFields.o]: string;
  [MiniSDPFields.app]: string;
  [MiniSDPFields.ufrag]: string;
  [MiniSDPFields.pw]: string;
  [MiniSDPFields.finger]: string;
  [MiniSDPFields.setup]: string;
  [MiniSDPFields.port]: string;
  [MiniSDPFields.maxSize]: string;
}

export type MiniSDPString = string;
/**
 * Transform a mini sdp object to mini sdp string
 */
export function assembleSDPMiniString(sdp: MiniSDP): MiniSDPString {
  return `\
${candidateAbbr(sdp[MiniSDPFields.canBlk])}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.o]}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.app]}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.ufrag]}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.pw]}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.finger]}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.setup]}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.port]}${SDP_MINI_SEP}\
${sdp[MiniSDPFields.maxSize]}`;
}

/**
 * Transform a mini sdp object to plain sdp string
 */
export function assembleSDPPlain(sdp: MiniSDP) {
  return `v=0
o=${sdp[MiniSDPFields.o]}
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS
m=application ${sdp[MiniSDPFields.app]} UDP/DTLS/SCTP webrtc-datachannel
${candidateExp(sdp[MiniSDPFields.canBlk])}
a=ice-ufrag:${sdp[MiniSDPFields.ufrag]}
a=ice-pwd:${sdp[MiniSDPFields.pw]}
a=ice-options:trickle
a=fingerprint:${sdp[MiniSDPFields.finger]}
a=setup:${sdp[MiniSDPFields.setup]}
a=mid:0
a=sctp-port:${sdp[MiniSDPFields.port]}
a=max-message-size:${sdp[MiniSDPFields.maxSize]}
`;
}

const enum Abbreviations {
  A_0 = "typ host tcptype active generation",
  A_1 = "typ host generation",
  A_2 = "network-cost",
  A_3 = "network-id",
  A_4 = "\na=candidate:",
}

function candidateAbbr(candidate: string) {
  return candidate
    .replaceAll(Abbreviations.A_0, `${CAN_GROUP_SEP}0`)
    .replaceAll(Abbreviations.A_1, `${CAN_GROUP_SEP}1`)
    .replaceAll(Abbreviations.A_2, `${CAN_GROUP_SEP}2`)
    .replaceAll(Abbreviations.A_3, `${CAN_GROUP_SEP}3`)
    .replaceAll(Abbreviations.A_4, `${CAN_GROUP_SEP}4`);
}

export function candidateExp(candidate: string) {
  return candidate
    .replaceAll(`${CAN_GROUP_SEP}0`, Abbreviations.A_0)
    .replaceAll(`${CAN_GROUP_SEP}1`, Abbreviations.A_1)
    .replaceAll(`${CAN_GROUP_SEP}2`, Abbreviations.A_2)
    .replaceAll(`${CAN_GROUP_SEP}3`, Abbreviations.A_3)
    .replaceAll(`${CAN_GROUP_SEP}4`, Abbreviations.A_4);
}

export function sdpShrink(plainSDP: string) {
  const sdp = plainSDP.replaceAll("\r", "");

  const o = sdp
    .split("\n")
    .find((str) => str.startsWith("o="))
    ?.split("=")[1];
  const app = sdp
    .split("\n")
    .find((str) => str.startsWith("m=application"))
    ?.split(" ")[1];

  const canBlk = sdp
    .split("\n")
    .filter((str) => str.startsWith("c=IN") || str.startsWith("a=candidate"))
    .join("\n");
  const ufrag = sdp
    .split("\n")
    .find((str) => str.startsWith("a=ice-ufrag"))
    ?.split("ice-ufrag:")[1];
  const pw = sdp
    .split("\n")
    .find((str) => str.startsWith("a=ice-pw"))
    ?.split("ice-pwd:")[1];
  const finger = sdp
    .split("\n")
    .find((str) => str.startsWith("a=fingerprint"))
    ?.split("fingerprint:")[1];
  const setup = sdp
    .split("\n")
    .find((str) => str.startsWith("a=setup"))
    ?.split("setup:")[1];
  const port = sdp
    .split("\n")
    .find((str) => str.startsWith("a=sctp-port"))
    ?.split("sctp-port:")[1];

  const maxSize = sdp
    .split("\n")
    .find((str) => str.startsWith("a=max-message-size"))
    ?.split("max-message-size:")[1];

  const sdpObj = sdpMiniParamValidate({
    [MiniSDPFields.canBlk]: canBlk,
    [MiniSDPFields.o]: o,
    [MiniSDPFields.app]: app,
    [MiniSDPFields.ufrag]: ufrag,
    [MiniSDPFields.pw]: pw,
    [MiniSDPFields.finger]: finger,
    [MiniSDPFields.setup]: setup,
    [MiniSDPFields.port]: port,
    [MiniSDPFields.maxSize]: maxSize,
  });

  return assembleSDPMiniString(sdpObj);
}

export function sdpExpand(minifiedSDP: MiniSDPString) {
  const [canBlk, o, app, ufrag, pw, finger, setup, port, maxSize] =
    minifiedSDP.split(SDP_MINI_SEP);

  const sdp = sdpMiniParamValidate({
    [MiniSDPFields.canBlk]: canBlk,
    [MiniSDPFields.o]: o,
    [MiniSDPFields.app]: app,
    [MiniSDPFields.ufrag]: ufrag,
    [MiniSDPFields.pw]: pw,
    [MiniSDPFields.finger]: finger,
    [MiniSDPFields.setup]: setup,
    [MiniSDPFields.port]: port,
    [MiniSDPFields.maxSize]: maxSize,
  });

  return assembleSDPPlain(sdp);
}

/**
 * Ensure all required params are present
 * @throws if any parameter is missing
 */
export function sdpMiniParamValidate(sdp: Partial<MiniSDP>) {
  if (
    sdp[MiniSDPFields.canBlk] === undefined ||
    sdp[MiniSDPFields.o] === undefined ||
    sdp[MiniSDPFields.app] === undefined ||
    sdp[MiniSDPFields.ufrag] === undefined ||
    sdp[MiniSDPFields.pw] === undefined ||
    sdp[MiniSDPFields.finger] === undefined ||
    sdp[MiniSDPFields.setup] === undefined ||
    sdp[MiniSDPFields.port] === undefined ||
    sdp[MiniSDPFields.maxSize] === undefined
  ) {
    const missing = [
      { k: MiniSDPFields.canBlk, v: sdp[MiniSDPFields.canBlk] },
      { k: MiniSDPFields.o, v: sdp[MiniSDPFields.o] },
      { k: MiniSDPFields.app, v: sdp[MiniSDPFields.app] },
      { k: MiniSDPFields.ufrag, v: sdp[MiniSDPFields.ufrag] },
      { k: MiniSDPFields.pw, v: sdp[MiniSDPFields.pw] },
      { k: MiniSDPFields.finger, v: sdp[MiniSDPFields.finger] },
      { k: MiniSDPFields.setup, v: sdp[MiniSDPFields.setup] },
      { k: MiniSDPFields.port, v: sdp[MiniSDPFields.port] },
      { k: MiniSDPFields.maxSize, v: sdp[MiniSDPFields.maxSize] },
    ].filter((el) => el.v === undefined);
    throw new Error(
      `Required fields missing: ${missing.map((el) => el.k).toString()}`
    );
  }

  return {
    [MiniSDPFields.canBlk]: sdp[MiniSDPFields.canBlk],
    [MiniSDPFields.o]: sdp[MiniSDPFields.o],
    [MiniSDPFields.app]: sdp[MiniSDPFields.app],
    [MiniSDPFields.ufrag]: sdp[MiniSDPFields.ufrag],
    [MiniSDPFields.pw]: sdp[MiniSDPFields.pw],
    [MiniSDPFields.finger]: sdp[MiniSDPFields.finger],
    [MiniSDPFields.setup]: sdp[MiniSDPFields.setup],
    [MiniSDPFields.port]: sdp[MiniSDPFields.port],
    [MiniSDPFields.maxSize]: sdp[MiniSDPFields.maxSize],
  } as MiniSDP;
}
