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
    [MiniSDPFields.port]: 5000,
    [MiniSDPFields.maxSize]: 262144,
  };

  const sample = `v=0
o=${expected[MiniSDPFields.o]}
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

  describe("sdpShrink", function () {
    it("sdpShrink", function () {
      const actual = sdpShrink(sample);

      expect(actual).to.eq(assembleSDPMiniString(expected));
    });
  });

  describe("sdpExpand", function () {
    describe("throws on", function () {
      it("missing field", function () {
        const missing = { ...expected, [MiniSDPFields.o]: undefined };
        // @ts-expect-error incompatible type
        const minimized = assembleSDPMiniString(missing);

        const actual = () => sdpExpand(minimized);

        expect(actual).to.throw(Error, "Required fields missing: object");
      });
      it("incorrect field type (num)", function () {
        const missing = { ...expected, [MiniSDPFields.port]: "a" };
        // @ts-expect-error incompatible type
        const minimized = assembleSDPMiniString(missing);

        const actual = () => sdpExpand(minimized);

        expect(actual).to.throw(Error, "Required fields missing: port");
      });
      it("incorrect field type (alpha)", function () {
        // \u001D is candidate block separator
        const missing = { ...expected, [MiniSDPFields.pw]: "\u001D" };

        const minimized = assembleSDPMiniString(missing);

        const actual = () => sdpExpand(minimized);

        expect(actual).to.throw(Error, "Required fields missing: password");
      });
    });

    describe("parses", function () {
      it("sdpExpand", function () {
        const minimized = assembleSDPMiniString(expected);

        const actual = sdpExpand(minimized);

        expect(actual).to.deep.eq(sample);
      });
      it("candidate block separator", function () {
        // \u001D is candidate block separator
        const missing = {
          ...expected,
          [MiniSDPFields.canBlk]:
            "some stuff some number 123 and symbols +=. \u001D",
        };

        const minimized = assembleSDPMiniString(missing);

        const actual = () => sdpExpand(minimized);

        expect(actual).to.not.throw(Error, "Required fields missing: candidateBlock");
      });
    });
  });
});
