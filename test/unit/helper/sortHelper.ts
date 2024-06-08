import "jsdom-global/register";
import { expect } from "chai";
import {
  alphaOrder,
  dateViewOrder,
  difficultySubFilter,
  randomOrder,
} from "../../../src/helper/sortHelper";
import type { Optional } from "../../../src/typings/utils";
import type { RawVocabulary } from "nmemonica";

describe("sortHelper", function () {
  const terms: Optional<RawVocabulary, "tags">[] = [
    {
      english: "blue",
      grp: "Noun",
      japanese: "あお\n青",
      romaji: "ao",
      subGrp: "Colors",
      uid: "00c102a7e10b45b19afbab71c030bf63",
    },
    {
      english: "purple",
      grp: "Noun",
      japanese: "むらさき\n紫",
      romaji: "murasaki, murasakiiro",
      subGrp: "Colors",
      uid: "12e960a0d8ae82cf5804a8e9f192d664",
    },
    {
      english: "yellow",
      grp: "Noun",
      japanese: "きいろ\n黄色",
      romaji: "kiiro",
      subGrp: "Colors",
      uid: "3caebfbcc0613501e39f7819e9b2d5a3",
    },
    {
      english: "white",
      grp: "Noun",
      japanese: "しろ\n白",
      romaji: "shiro",
      subGrp: "Colors",
      uid: "3e30afabc4b11c821e398d6ee1226c59",
    },
    {
      english: "green",
      grp: "Noun",
      japanese: "みどり\n緑",
      romaji: "midori",
      subGrp: "Colors",
      uid: "6fca55dd4a82b78256cc9c22e2934938",
    },
    {
      english: "grey",
      grp: "Noun",
      japanese: "ねずみいろ\n鼠色",
      romaji: "nezumiiro",
      subGrp: "Colors",
      uid: "729307b04a77bccc5db86d6b49f55f2f",
    },
    {
      english: "beige",
      grp: "Noun",
      japanese: "ベージュ",
      romaji: "bēju",
      subGrp: "Colors",
      uid: "792bc286417b7ac5cfee4bdd7872f892",
    },
    {
      english: "black",
      grp: "Noun",
      japanese: "くろ\n黒",
      romaji: "kuro",
      subGrp: "Colors",
      uid: "a8787c646e16617ba878fe462e4d1ffe",
    },
    {
      english: "brown",
      grp: "Noun",
      japanese: "ちゃいろ\n茶色",
      romaji: "chairo",
      subGrp: "Colors",
      uid: "b78d1a33132a9090a7b545f7aa3d2f63",
    },
    {
      english: "grey",
      grp: "Noun",
      japanese: "はいいろ\n灰色",
      romaji: "haiiro",
      subGrp: "Colors",
      uid: "de108914e6e86883ed97dc62918ae89a",
    },
    {
      english: "red",
      grp: "Noun",
      japanese: "あか\n赤",
      romaji: "aka",
      subGrp: "Colors",
      uid: "e5d47019e1b948c2445b6c1ea3850c2b",
    },
    {
      english: "orange",
      grp: "Noun",
      japanese: "オレンジ",
      romaji: "orenji",
      subGrp: "Colors",
      uid: "e86638b52f2028b1ff3685e13bfd71ac",
    },
    {
      english: "pink",
      grp: "Noun",
      japanese: "ピンク",
      romaji: "pinku",
      subGrp: "Colors",
      uid: "ee5b790c89a6e8811e7b3c97ee79534c",
    },
  ];

  describe("alphaOrder", function () {
    it("has right order", function () {
      const expected = [0, 10, 2, 7, 3, 8, 5, 9, 4, 1, 11, 12, 6];
      const expectedJ = [
        "00c102a7e10b45b19afbab71c030bf63",
        "e5d47019e1b948c2445b6c1ea3850c2b",
        "3caebfbcc0613501e39f7819e9b2d5a3",
        "a8787c646e16617ba878fe462e4d1ffe",
        "3e30afabc4b11c821e398d6ee1226c59",
        "b78d1a33132a9090a7b545f7aa3d2f63",
        "729307b04a77bccc5db86d6b49f55f2f",
        "de108914e6e86883ed97dc62918ae89a",
        "6fca55dd4a82b78256cc9c22e2934938",
        "12e960a0d8ae82cf5804a8e9f192d664",
        "e86638b52f2028b1ff3685e13bfd71ac",
        "ee5b790c89a6e8811e7b3c97ee79534c",
        "792bc286417b7ac5cfee4bdd7872f892",
      ];
      const expectedE = [
        "792bc286417b7ac5cfee4bdd7872f892",
        "a8787c646e16617ba878fe462e4d1ffe",
        "00c102a7e10b45b19afbab71c030bf63",
        "b78d1a33132a9090a7b545f7aa3d2f63",
        "6fca55dd4a82b78256cc9c22e2934938",
        "729307b04a77bccc5db86d6b49f55f2f",
        "de108914e6e86883ed97dc62918ae89a",
        "e86638b52f2028b1ff3685e13bfd71ac",
        "ee5b790c89a6e8811e7b3c97ee79534c",
        "12e960a0d8ae82cf5804a8e9f192d664",
        "e5d47019e1b948c2445b6c1ea3850c2b",
        "3e30afabc4b11c821e398d6ee1226c59",
        "3caebfbcc0613501e39f7819e9b2d5a3",
      ];

      const { order, jOrder, eOrder } = alphaOrder(terms);
      expect(order, "order").to.deep.eq(expected);

      const jOrderUids = jOrder.map((j) => j.uid);
      expect(jOrderUids, "Japanse order").to.deep.eq(expectedJ);

      const eOrderUids = eOrder.map((e) => e.uid);
      expect(eOrderUids, "English order").to.deep.eq(expectedE);
    });
  });
  describe("randomOrder", function () {
    it("should not be ordered", function () {
      const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      const actual = randomOrder(terms);
      expect(actual).to.not.deep.eq(expected); //should not be ordered
      expect(actual).to.include.members(expected); //should contain all originals
    });
  });
  describe("dateViewOrder", function () {
    it.skip("separate Space Repetition items to the end (COMMENTED)", function () {
      const expected = [4, 5, 3, 0, 1, 2];
      const termsWSpaceRepMixed = [
        { uid: "00c102a7e10b45b19afbab71c030bf63" }, // newest
        { uid: "6fca55dd4a82b78256cc9c22e2934938" }, // Space Repetition item
        { uid: "729307b04a77bccc5db86d6b49f55f2f" }, // Space Repetition item
        { uid: "e5d47019e1b948c2445b6c1ea3850c2b" }, // oldest
        { uid: "e86638b52f2028b1ff3685e13bfd71ac" }, // not viewed
        { uid: "ee5b790c89a6e8811e7b3c97ee79534c" }, // not viewed
      ];
      const spaceRepObj = {
        "00c102a7e10b45b19afbab71c030bf63": {
          // english: 'blue',
          vC: 13,
          lastView: "2020-01-01T01:10:00.000Z",     // newest
        },
        "6fca55dd4a82b78256cc9c22e2934938": {
          // english: 'green',
          vC: 9,
          lastView: "2020-01-01T01:06:00.000Z",
          lastReview: "2020-01-01T01:06:00.000Z",   // Space Repetition item
          daysBetweenReviews: 2,
          accuracyP: 99,
        },
        "729307b04a77bccc5db86d6b49f55f2f": {
          // english: 'grey',
          vC: 8,
          lastView: "2020-01-01T01:05:00.000Z",
          lastReview: "2020-01-01T01:05:00.000Z",   // Space Repetition item
          daysBetweenReviews: 2,
          accuracyP: 99,
        },
        "e5d47019e1b948c2445b6c1ea3850c2b": {
          // english: 'red',
          vC: 3,
          lastView: "2020-01-01T01:00:00.000Z",     // oldest
        },
        "e86638b52f2028b1ff3685e13bfd71ac": {
          // english: 'orange',
          // vC: 2,
          // lastView: "2020-01-01T01:00:00.000Z",  // not viewed
        },
        "ee5b790c89a6e8811e7b3c97ee79534c": {
          // english: 'pink',
          vC: 0,
          // lastView: "2020-01-01T01:00:00.000Z",  // not viewed
          lastView: undefined,
        },
      };

      const actual = dateViewOrder(termsWSpaceRepMixed, spaceRepObj);
      expect(actual).to.deep.eq(expected);
    });

    it("not viewed first, then oldest to newest", function () {
      const expected = [11, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
      const spaceRepObj = {
        "00c102a7e10b45b19afbab71c030bf63": {
          // english: 'blue',
          vC: 13,
          lastView: "2020-01-01T01:10:00.000Z", // newest
        },
        "12e960a0d8ae82cf5804a8e9f192d664": {
          // english: 'purple',
          vC: 12,
          lastView: "2020-01-01T01:09:00.000Z",
        },
        "3caebfbcc0613501e39f7819e9b2d5a3": {
          // english: 'yellow',
          vC: 11,
          lastView: "2020-01-01T01:08:00.000Z",
        },
        "3e30afabc4b11c821e398d6ee1226c59": {
          // english: 'white',
          vC: 10,
          lastView: "2020-01-01T01:07:00.000Z",
        },
        "6fca55dd4a82b78256cc9c22e2934938": {
          // english: 'green',
          vC: 9,
          lastView: "2020-01-01T01:06:00.000Z",
        },
        "729307b04a77bccc5db86d6b49f55f2f": {
          // english: 'grey',
          vC: 8,
          lastView: "2020-01-01T01:05:00.000Z",
        },
        "792bc286417b7ac5cfee4bdd7872f892": {
          // english: 'beige',
          vC: 7,
          lastView: "2020-01-01T01:04:00.000Z",
        },
        "a8787c646e16617ba878fe462e4d1ffe": {
          // english: 'black',
          vC: 6,
          lastView: "2020-01-01T01:03:00.000Z",
        },
        "b78d1a33132a9090a7b545f7aa3d2f63": {
          // english: 'brown',
          vC: 5,
          lastView: "2020-01-01T01:02:00.000Z",
        },
        "de108914e6e86883ed97dc62918ae89a": {
          // english: 'grey',
          vC: 4,
          lastView: "2020-01-01T01:01:00.000Z",
        },
        "e5d47019e1b948c2445b6c1ea3850c2b": {
          // english: 'red',
          vC: 3,
          lastView: "2020-01-01T01:00:00.000Z",     // oldest
        },
        "e86638b52f2028b1ff3685e13bfd71ac": {
          // english: 'orange',
          // vC: 2,
          // lastView: "2020-01-01T01:00:00.000Z",  // not viewed
        },
        "ee5b790c89a6e8811e7b3c97ee79534c": {
          // english: 'pink',
          vC: 0,
          // lastView: "2020-01-01T01:00:00.000Z",  // not viewed
          lastView: undefined,
        },
      };

      const actual = dateViewOrder(terms, spaceRepObj);
      expect(actual).to.deep.eq(expected);
    });
  });
  describe("difficultySubFilter", function () {
    const terms = [
      { uid: "uidA" },
      { uid: "uidB" },
      { uid: "uidC" },
      { uid: "uidD" },
    ];

    it("below a value", function () {
      const expected = [{ uid: "uidA" }];
      const tMeta = {
        uidA: { difficultyP: 36 },
        uidB: { difficultyP: 90 },
        uidC: { difficultyP: 90 },
        uidD: { difficultyP: 90 },
      };

      const actual = difficultySubFilter(-50, terms, tMeta);
      expect(actual).to.deep.eq(expected);
    });
    it("undefined is below", function () {
      const expected = [{ uid: "uidA" }];
      const tMeta = {
        uidA: { difficultyP: undefined },
        uidB: { difficultyP: 90 },
        uidC: { difficultyP: 90 },
        uidD: { difficultyP: 90 },
      };

      const actual = difficultySubFilter(-80, terms, tMeta);
      expect(actual).to.deep.eq(expected);
    });
    it("above a value", function () {
      const expected = [{ uid: "uidB" }, { uid: "uidC" }, { uid: "uidD" }];
      const tMeta = {
        uidA: { difficultyP: 36 },
        uidB: { difficultyP: 90 },
        uidC: { difficultyP: 90 },
        uidD: { difficultyP: 90 },
      };

      const actual = difficultySubFilter(50, terms, tMeta);
      expect(actual).to.deep.eq(expected);
    });
    it("undefined is above", function () {
      const expected = [{ uid: "uidB" }, { uid: "uidC" }, { uid: "uidD" }];
      const tMeta = {
        uidA: { difficultyP: 6 },
        uidB: { difficultyP: undefined },
        uidC: { difficultyP: undefined },
        uidD: { difficultyP: undefined },
      };

      const actual = difficultySubFilter(25, terms, tMeta);
      expect(actual).to.deep.eq(expected);
    });
    it("mixed", function () {
      const expected = [{ uid: "uidA" }, { uid: "uidB" }, { uid: "uidC" }];
      const tMeta = {
        uidA: { difficultyP: 6 },
        uidB: { difficultyP: undefined },
        uidC: { difficultyP: 31 },
        uidD: { difficultyP: 80 },
      };

      const actual = difficultySubFilter(-75, terms, tMeta);
      expect(actual).to.deep.eq(expected);
    });
    it("empty result", function () {
      const expected = [];
      const tMeta = {
        uidA: { difficultyP: 36 },
        uidB: { difficultyP: 90 },
        uidC: { difficultyP: 90 },
        uidD: { difficultyP: 90 },
      };

      const actual = difficultySubFilter(90, terms, tMeta);
      expect(actual).to.deep.eq(expected);
    });
  });
  describe("Recall Interval", function () {

  })
});
