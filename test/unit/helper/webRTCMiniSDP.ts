import { expect } from "chai";
import {
  sdpExpand,
  sdpShrink,
  assembleSDPMiniString,
  candidateExp,
  MiniSDPFields,
} from "../../../src/helper/webRTCMiniSDP";

describe("webRTCMiniSDP", function () {
  const expected = {
    [MiniSDPFields.o]: "- 9876543210987654321 2 IN IP4 127.0.0.1",
    [MiniSDPFields.app]: "44444",
    [MiniSDPFields.canBlk]: `c=IN IP4 192.168.1.1
a=candidate:3586001007 1 udp 2122194687 192.168.1.1 44444 typ host generation 0 network-id 1 network-cost 10
a=candidate:2743987636 1 udp 2122265343 0000:1111:2222:3:4444:5555:6666:7777 46314 typ host generation 0 network-id 2 network-cost 10
a=candidate:2876369655 1 tcp 1518214911 192.168.1.1 9 typ host tcptype active generation 0 network-id 1 network-cost 10
a=candidate:3712093996 1 tcp 1518285567 0000:1111:2222:3:4444:5555:6666:7777 9 typ host tcptype active generation 0 network-id 2 network-cost 10`,
    [MiniSDPFields.ufrag]: "NViE",
    [MiniSDPFields.pw]: "123456789012345678901234",
    [MiniSDPFields.finger]:
      "sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00",
    [MiniSDPFields.setup]: "actpass",
    [MiniSDPFields.port]: "5000",
    [MiniSDPFields.maxSize]: "262144",
  };

  const sample = `v=0
o=${expected.o}
s=-
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS
m=application ${expected[MiniSDPFields.app]} UDP/DTLS/SCTP webrtc-datachannel
${candidateExp(expected[MiniSDPFields.canBlk])}
a=ice-ufrag:${expected[MiniSDPFields.ufrag]}
a=ice-pwd:${expected[MiniSDPFields.pw]}
a=ice-options:trickle
a=fingerprint:${expected[MiniSDPFields.finger]}
a=setup:${expected[MiniSDPFields.setup]}
a=mid:0
a=sctp-port:${expected[MiniSDPFields.port]}
a=max-message-size:${expected[MiniSDPFields.maxSize]}
`;

  it("sdpShrink", function () {
    const actual = sdpShrink(sample);

    expect(actual).to.eq(assembleSDPMiniString(expected));
  });

  it("sdpExpand", function () {
    const minimized = assembleSDPMiniString(expected);

    const actual = sdpExpand(minimized);

    expect(actual).to.deep.eq(sample);
  });
});
