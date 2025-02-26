/**
 * WebRTC Signaling helper functions
 */

// TODO: create enum with field abbreviations (reuse fields)
// TODO: a=setup actpass/active get from context (remove from msg)

export interface MiniSDP {
  cn: string;
  o: string;
  app: string;
  fr: string;
  pw: string;
  fp: string;
  s: string;
  p: string;
}

/**
 * Transform a mini sdp object to mini sdp string
 */
export function assembleSDPMiniString({
  cn,
  o,
  app,
  fr,
  pw,
  fp,
  s,
  p,
}: MiniSDP) {
  return `cn:${candidateAbbr(cn)}[o:${o}[app:${app}[fr:${fr}[pw:${pw}[fp:${fp}[s:${s}[p:${p}`;
}

const enum Abbreviations {
  A_0 = "typ host tcptype active generation",
  A_1 = "typ host generation",
  A_2 = "network-cost",
  A_3 = "network-id",
}

function candidateAbbr(candidate: string) {
  return candidate
    .replaceAll(Abbreviations.A_0, "A_0")
    .replaceAll(Abbreviations.A_1, "A_1")
    .replaceAll(Abbreviations.A_2, "A_2")
    .replaceAll(Abbreviations.A_3, "A_3");
}

function candidateExp(candidate: string) {
  return candidate
    .replaceAll("A_0", Abbreviations.A_0)
    .replaceAll("A_1", Abbreviations.A_1)
    .replaceAll("A_2", Abbreviations.A_2)
    .replaceAll("A_3", Abbreviations.A_3);
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

  const cn = sdp
    .split("\n")
    .filter((str) => str.startsWith("c=IN") || str.startsWith("a=candidate"))
    .join("\n");
  const fr = sdp
    .split("\n")
    .find((str) => str.startsWith("a=ice-ufrag"))
    ?.split("ice-ufrag:")[1];
  const pw = sdp
    .split("\n")
    .find((str) => str.startsWith("a=ice-pw"))
    ?.split("ice-pwd:")[1];
  const fp = sdp
    .split("\n")
    .find((str) => str.startsWith("a=fingerprint"))
    ?.split("fingerprint:")[1];
  const s = sdp
    .split("\n")
    .find((str) => str.startsWith("a=setup"))
    ?.split("setup:")[1];
  const p = sdp
    .split("\n")
    .find((str) => str.startsWith("a=sctp-port"))
    ?.split("sctp-port:")[1];

  const sdpObj = sdpMiniParamValidate({ cn, o, app, fr, pw, fp, s, p });

  return assembleSDPMiniString(sdpObj);
}

export function sdpExpand(minifiedSDP: string) {
  const fields = minifiedSDP.split("[");

  const cn = fields.find((el) => el.startsWith("cn:"))?.replace("cn:", "");
  const o = fields.find((el) => el.startsWith("o:"))?.replace("o:", "");
  const app = fields.find((el) => el.startsWith("app:"))?.replace("app:", "");
  const fr = fields.find((el) => el.startsWith("fr:"))?.replace("fr:", "");
  const pw = fields.find((el) => el.startsWith("pw:"))?.replace("pw:", "");
  const fp = fields.find((el) => el.startsWith("fp:"))?.replace("fp:", "");
  const s = fields.find((el) => el.startsWith("s:"))?.replace("s:", "");
  const p = fields.find((el) => el.startsWith("p:"))?.replace("p:", "");

  const sdp = sdpMiniParamValidate({ cn, o, app, fr, pw, fp, s, p });

  return `v=0
o=${sdp.o}
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS
m=application ${sdp.app} UDP/DTLS/SCTP webrtc-datachannel
${candidateExp(sdp.cn)}
a=ice-ufrag:${sdp.fr}
a=ice-pwd:${sdp.pw}
a=ice-options:trickle
a=fingerprint:${sdp.fp}
a=setup:${sdp.s}
a=mid:0
a=sctp-port:${sdp.p}
a=max-message-size:262144`;
}

/**
 * Ensure all required params are present
 * @throws if any parameter is missing
 */
export function sdpMiniParamValidate({
  cn,
  o,
  app,
  fr,
  pw,
  fp,
  s,
  p,
}: Partial<MiniSDP>) {
  if (
    cn === undefined ||
    o === undefined ||
    app === undefined ||
    fr === undefined ||
    pw === undefined ||
    fp === undefined ||
    s === undefined ||
    p === undefined
  ) {
    const missing = [
      { k: "cn", v: cn },
      { k: "o", v: o },
      { k: "app", v: app },
      { k: "fr", v: fr },
      { k: "pw", v: pw },
      { k: "fp", v: fp },
      { k: "s", v: s },
      { k: "p", v: p },
    ].filter((el) => el.v === undefined);
    throw new Error(
      `Required fields missing: ${missing.map((el) => el.k).toString()}`
    );
  }

  return { cn, o, app, fr, pw, fp, s, p } as MiniSDP;
}
