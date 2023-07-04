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
      uid: "12e960a0d8ae82cf5804a8e9f192d661",
    },

    "00c102a7e10b45b19afbab71c030bf63": {
      english: "blue",
      grp: "Noun",
      japanese: "あお\n青",
      romaji: "ao",
      subGrp: "Colors",
      tag: ["Primary"],
      uid: "00c102a7e10b45b19afbab71c030bf63",
    },
    "12e960a0d8ae82cf5804a8e9f192d664": {
      english: "purple",
      grp: "Noun",
      japanese: "むらさき\n紫",
      romaji: "murasaki, murasakiiro",
      subGrp: "Colors",
      tag: ["Secondary"],
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

      const actual = buildTagObject(terms);
      expect(actual).to.deep.eq(expected);
    });
  });

  describe("getPropsFromTags", function () {
    it("empty", function () {
      const initialTags = "";

      const { tags, particles } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal([]);
      expect(particles).to.deep.equal([]);
    });

    it("keigo", function () {
      const initialTags = "casual negative\nkeigo";

      const { tags, keigo } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal(["casual", "negative"]);
      expect(keigo).to.be.true;
    });

    it("EV1", function () {
      const initialTags = "casual negative\nkeigo EV1";

      const { tags, exv } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal(["casual", "negative"]);
      expect(exv).to.eq(1);
    });

    it("intransitive", function () {
      const initialTags = "casual negative\nkeigo EV1 intr";

      const { tags, intr } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal(["casual", "negative"]);
      expect(intr).to.be.true;
    });

    it("transitive (w/ intransitive pair)", function () {
      const expected = "00000000000000000000000000000000";
      const initialTags = `casual negative\nkeigo EV1 intr:${expected}`;

      const { tags, trans } = getPropsFromTags(initialTags);

      expect(tags).to.deep.equal(["casual", "negative"]);
      expect(trans).to.equal(expected);
    });
  });
});
