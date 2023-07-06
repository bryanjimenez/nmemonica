import { expect } from "chai";
import {
  buildGroupObject,
  buildTagObject,
  getPropsFromTags,
} from "../../../src/helper/reducerHelper";

describe("reducerHelper", function () {
  const terms = {
    "12e960a0d8ae82cf5804a8e9f192d661": {
      english: "violet",
      grp: "Noun",
      japanese: "バイオレット",
      romaji: "Baioretto",
      subGrp: "Name",
      tags: [],
      uid: "12e960a0d8ae82cf5804a8e9f192d661",
    },

    "00c102a7e10b45b19afbab71c030bf63": {
      english: "blue",
      grp: "Noun",
      japanese: "あお\n青",
      romaji: "ao",
      subGrp: "Colors",
      tags: ["Primary"],
      uid: "00c102a7e10b45b19afbab71c030bf63",
    },
    "12e960a0d8ae82cf5804a8e9f192d664": {
      english: "purple",
      grp: "Noun",
      japanese: "むらさき\n紫",
      romaji: "murasaki, murasakiiro",
      subGrp: "Colors",
      tags: ["Secondary"],
      uid: "12e960a0d8ae82cf5804a8e9f192d664",
    },
  };
  describe("buildGroupObject", function () {
    it("aggregate groups", function () {
      const expected = { Noun: ["Name", "Colors"] };
      const actual = buildGroupObject(terms);

      expect(actual).to.deep.eq(expected);
    });
  });
  describe("buildTagObject", function () {
    it("aggregate tags", function () {
      const expected = ["Primary", "Secondary"];

      const termsArray = Object.keys(terms).map((k) => terms[k]);

      const actual = buildTagObject(termsArray);
      expect(actual).to.deep.eq(expected);
    });
  });

  describe("getPropsFromTags", function () {
    it("empty", function () {
      const initialTags = "";

      const { tags } = getPropsFromTags(initialTags);

      expect(tags).to.be.an("Array").of.length(0);
    });
    it("space", function () {
      const initialTags = " \t \t";

      const { tags } = getPropsFromTags(initialTags);

      expect(tags).to.be.an("Array").of.length(0);
    });
    it("tags multiple", function () {
      const expected = ["casual", "onomatopoetic", "negative"];
      const initialTags = "onomatopoetic\ncasual; negative\nkeigo";

      const { tags, keigo } = getPropsFromTags(initialTags);

      expect(tags).to.be.length(expected.length).and.include.members(expected);
      expect(keigo).to.be.true;
    });
    describe("vocabulary", function () {
      it("na-adj", function () {
        const initialTags = "na-adj; onomatopoetic; Adjective; ";
        const { tags, adj } = getPropsFromTags(initialTags);

        expect(adj).to.equal("na");
        expect(tags)
          .to.be.length(2)
          .and.include.members(["Adjective", "onomatopoetic"]);
      });
      it("i-adj", function () {
        const initialTags = "i-adj; onomatopoetic; Adjective; ";
        const { tags, adj } = getPropsFromTags(initialTags);

        expect(adj).to.equal("i");
        expect(tags)
          .to.be.length(2)
          .and.include.members(["Adjective", "onomatopoetic"]);
      });
      it("keigo", function () {
        const expected = ["casual", "negative"];
        const initialTags = "casual; negative\nkeigo";

        const { tags, keigo } = getPropsFromTags(initialTags);

        expect(tags)
          .to.be.length(expected.length)
          .and.include.members(expected);
        expect(keigo).to.be.true;
      });

      it("EV1", function () {
        const expected = ["casual", "negative"];
        const initialTags = "casual;negative\nkeigo; \n EV1";

        const { tags, exv } = getPropsFromTags(initialTags);

        expect(tags)
          .to.be.length(expected.length)
          .and.include.members(expected);
        expect(exv).to.eq(1);
      });

      it("intransitive", function () {
        const expected = ["casual", "negative"];
        const initialTags = "casual\nnegative\nkeigo; EV1; intr";

        const { tags, intr } = getPropsFromTags(initialTags);

        expect(tags, "tags")
          .to.be.length(expected.length)
          .and.include.members(expected);
        expect(intr, "intr").to.be.true;
      });

      it("transitive (w/ intransitive pair)", function () {
        const expected = ["casual", "negative"];
        const expectedUid = "00000000000000000000000000000000";
        const initialTags = `casual; negative\nkeigo EV1 intr:${expectedUid}`;

        const { tags, trans } = getPropsFromTags(initialTags);

        expect(tags)
          .to.be.length(expected.length)
          .and.include.members(expected);
        expect(trans).to.equal(expectedUid);
      });
    });
    describe("phrases", function () {
      it("particles", function () {
        const initialTags = "p:は,から,を";

        const { tags, particles } = getPropsFromTags(initialTags);

        expect(tags, "tags").to.be.an("Array").of.length(0);
        expect(particles, "particles")
          .to.be.length(3)
          .and.include.members(["は", "から", "を"]);
      });

      it("particles and tags", function () {
        const expected = ["casual", "negative"];
        const initialTags = "casual\n negative\np:は,から,を";

        const { tags, particles } = getPropsFromTags(initialTags);

        expect(tags, "tags")
          .to.be.length(expected.length)
          .and.include.members(expected);
        expect(particles, "particles")
          .to.be.length(3)
          .and.include.members(["は", "から", "を"]);
      });

      it("inverse", function () {
        const expected = ["casual", "negative"];
        const expectedUid = "4f3b0dffa85324487e7130022fa2a87c";
        const initialTags = `casual; negative\np:は,から,を; inv:${expectedUid}`;

        const { tags, particles, inverse } = getPropsFromTags(initialTags);

        expect(tags, "tags")
          .to.be.length(expected.length)
          .and.include.members(expected);
        expect(particles, "particles")
          .to.be.length(3)
          .and.include.members(["は", "から", "を"]);
        expect(inverse, "inverse").to.equal(expectedUid);
      });
    });
  });
});
