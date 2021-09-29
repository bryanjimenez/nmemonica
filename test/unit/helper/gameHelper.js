import { expect } from "chai";
import { alphaOrder, randomOrder, spaceRepOrder } from "../../../src/helper/gameHelper";

describe("gameHelper", function () {
  const terms = [
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
  describe("spaceRepOrder", function () {
    it("has right order", function () {
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0];
      const spaceRepObj = {
        "00c102a7e10b45b19afbab71c030bf63": {
          c: 1,
          d: "2021-09-28T17:38:09.319Z",
        },
      };

      const actual = spaceRepOrder(terms, spaceRepObj);
      expect(actual).to.deep.eq(expected);
    });
    it("has right type", function () {
      const wrongType = ["1","2","3","4","5","6","7","8","9","10","11","12","0"];
      const spaceRepObj = {
        "00c102a7e10b45b19afbab71c030bf63": {
          c: 1,
          d: "2021-09-28T17:38:09.319Z",
        },
      };

      const actual = spaceRepOrder(terms, spaceRepObj);
      expect(actual).to.not.deep.eq(wrongType);
    });
  });
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
      expect(actual).to.not.deep.eq(expected);    //should not be ordered
      expect(actual).to.include.members(expected);//should contain all originals
    })
  })
});
