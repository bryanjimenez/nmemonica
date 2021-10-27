import { expect } from "chai";
import {
  alphaOrder,
  randomOrder,
  spaceRepOrder,
  termFilterByType,
} from "../../../src/helper/gameHelper";
import { FILTER_FREQ } from "../../../src/reducers/settingsRed";

/* global describe it */

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
    it("term order when undefined", function () {
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
    it("date order oldest first", function () {
      const expected = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
      const spaceRepObj = {
        "00c102a7e10b45b19afbab71c030bf63": {
          // english: 'blue',
          c: 1,
          d: "2020-01-01T01:12:00.000Z",
        },
        "12e960a0d8ae82cf5804a8e9f192d664": {
          // english: 'purple',
          c: 1,
          d: "2020-01-01T01:11:00.000Z",
        },
        "3caebfbcc0613501e39f7819e9b2d5a3": {
          // english: 'yellow',
          c: 1,
          d: "2020-01-01T01:10:00.000Z",
        },
        "3e30afabc4b11c821e398d6ee1226c59": {
          // english: 'white',
          c: 1,
          d: "2020-01-01T01:09:00.000Z",
        },
        "6fca55dd4a82b78256cc9c22e2934938": {
          // english: 'green',
          c: 1,
          d: "2020-01-01T01:08:00.000Z",
        },
        "729307b04a77bccc5db86d6b49f55f2f": {
          // english: 'grey',
          c: 1,
          d: "2020-01-01T01:07:00.000Z",
        },
        "792bc286417b7ac5cfee4bdd7872f892": {
          // english: 'beige',
          c: 1,
          d: "2020-01-01T01:06:00.000Z",
        },
        "a8787c646e16617ba878fe462e4d1ffe": {
          // english: 'black',
          c: 1,
          d: "2020-01-01T01:05:00.000Z",
        },
        "b78d1a33132a9090a7b545f7aa3d2f63": {
          // english: 'brown',
          c: 1,
          d: "2020-01-01T01:04:00.000Z",
        },
        "de108914e6e86883ed97dc62918ae89a": {
          // english: 'grey',
          c: 1,
          d: "2020-01-01T01:03:00.000Z",
        },
        "e5d47019e1b948c2445b6c1ea3850c2b": {
          // english: 'red',
          c: 1,
          d: "2020-01-01T01:02:00.000Z",
        },
        "e86638b52f2028b1ff3685e13bfd71ac": {
          // english: 'orange',
          c: 1,
          d: "2020-01-01T01:01:00.000Z",
        },
        "ee5b790c89a6e8811e7b3c97ee79534c": {
          // english: 'pink',
          c: 1,
          d: "2020-01-01T01:00:00.000Z",
        },
      };

      const actual = spaceRepOrder(terms, spaceRepObj);
      expect(actual).to.deep.eq(expected);
    });
    it("count order lowest first", function () {
      const expected = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
      const spaceRepObj = {
        "00c102a7e10b45b19afbab71c030bf63": {
          // english: 'blue',
          c: 13,
          d: "2020-01-01T01:00:00.000Z",
        },
        "12e960a0d8ae82cf5804a8e9f192d664": {
          // english: 'purple',
          c: 12,
          d: "2020-01-01T01:00:00.000Z",
        },
        "3caebfbcc0613501e39f7819e9b2d5a3": {
          // english: 'yellow',
          c: 11,
          d: "2020-01-01T01:00:00.000Z",
        },
        "3e30afabc4b11c821e398d6ee1226c59": {
          // english: 'white',
          c: 10,
          d: "2020-01-01T01:00:00.000Z",
        },
        "6fca55dd4a82b78256cc9c22e2934938": {
          // english: 'green',
          c: 9,
          d: "2020-01-01T01:00:00.000Z",
        },
        "729307b04a77bccc5db86d6b49f55f2f": {
          // english: 'grey',
          c: 8,
          d: "2020-01-01T01:00:00.000Z",
        },
        "792bc286417b7ac5cfee4bdd7872f892": {
          // english: 'beige',
          c: 7,
          d: "2020-01-01T01:00:00.000Z",
        },
        "a8787c646e16617ba878fe462e4d1ffe": {
          // english: 'black',
          c: 6,
          d: "2020-01-01T01:00:00.000Z",
        },
        "b78d1a33132a9090a7b545f7aa3d2f63": {
          // english: 'brown',
          c: 5,
          d: "2020-01-01T01:00:00.000Z",
        },
        "de108914e6e86883ed97dc62918ae89a": {
          // english: 'grey',
          c: 4,
          d: "2020-01-01T01:00:00.000Z",
        },
        "e5d47019e1b948c2445b6c1ea3850c2b": {
          // english: 'red',
          c: 3,
          d: "2020-01-01T01:00:00.000Z",
        },
        "e86638b52f2028b1ff3685e13bfd71ac": {
          // english: 'orange',
          c: 2,
          d: "2020-01-01T01:00:00.000Z",
        },
        "ee5b790c89a6e8811e7b3c97ee79534c": {
          // english: 'pink',
          c: 1,
          d: "2020-01-01T01:00:00.000Z",
        },
      };

      const actual = spaceRepOrder(terms, spaceRepObj);
      expect(actual).to.deep.eq(expected);
    });
    it("date order superseedes count order", function () {
      const expected = [11, 12, 10, 9, 8, 7, 6, 5, 4, 3, 0, 1, 2];
      const spaceRepObj = {
        "00c102a7e10b45b19afbab71c030bf63": {
          // english: 'blue',
          c: 1,
          d: "2020-01-01T01:10:00.000Z",
        },
        "12e960a0d8ae82cf5804a8e9f192d664": {
          // english: 'purple',
          c: 2,
          d: "2020-01-01T01:10:00.000Z",
        },
        "3caebfbcc0613501e39f7819e9b2d5a3": {
          // english: 'yellow',
          c: 2,
          d: "2020-01-01T01:10:00.000Z",
        },
        "3e30afabc4b11c821e398d6ee1226c59": {
          // english: 'white',
          c: 1,
          d: "2020-01-01T01:09:00.000Z",
        },
        "6fca55dd4a82b78256cc9c22e2934938": {
          // english: 'green',
          c: 1,
          d: "2020-01-01T01:08:00.000Z",
        },
        "729307b04a77bccc5db86d6b49f55f2f": {
          // english: 'grey',
          c: 1,
          d: "2020-01-01T01:07:00.000Z",
        },
        "792bc286417b7ac5cfee4bdd7872f892": {
          // english: 'beige',
          c: 1,
          d: "2020-01-01T01:06:00.000Z",
        },
        "a8787c646e16617ba878fe462e4d1ffe": {
          // english: 'black',
          c: 1,
          d: "2020-01-01T01:05:00.000Z",
        },
        "b78d1a33132a9090a7b545f7aa3d2f63": {
          // english: 'brown',
          c: 1,
          d: "2020-01-01T01:04:00.000Z",
        },
        "de108914e6e86883ed97dc62918ae89a": {
          // english: 'grey',
          c: 1,
          d: "2020-01-01T01:03:00.000Z",
        },
        "e5d47019e1b948c2445b6c1ea3850c2b": {
          // english: 'red',
          c: 1,
          d: "2020-01-01T01:02:00.000Z",
        },
        "e86638b52f2028b1ff3685e13bfd71ac": {
          // english: 'orange',
          c: 1,
          d: "2020-01-01T01:00:00.000Z",
        },
        "ee5b790c89a6e8811e7b3c97ee79534c": {
          // english: 'pink',
          c: 1,
          d: "2020-01-01T01:01:00.000Z",
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
      expect(actual).to.not.deep.eq(expected); //should not be ordered
      expect(actual).to.include.members(expected); //should contain all originals
    });
  });
  describe("termFilterByType", function () {
    const timeGrpTerms = [
      {
        english: "next year",
        grp: "Noun",
        japanese: "らいねん\n来年",
        romaji: "rainen",
        subGrp: "Time",
        uid: "0bc88148bb66adb1e530a045f8deb3b2",
      },
      {
        english: "time",
        grp: "Noun",
        japanese: "じかん\n時間",
        romaji: "jikan",
        subGrp: "Time",
        uid: "7c5086f337bdf69ef4cf924652fc7576",
      },
    ];
    const verbGrpTerms = [
      {
        english: "to recall",
        grp: "Verb",
        japanese: "おもいだす\n思い出す",
        romaji: "omoidasu",
        subGrp: "Memory",
        uid: "7b18c22af4c8f109f279fcdc66565f55",
      },
    ];
    describe("FILTER_FREQ", function () {
      const filterType = FILTER_FREQ;
      const termList = [...terms, ...timeGrpTerms];
      const toggleFilterType = () => {};

      it("group not found", function () {
        const frequencyList = ["0bc88148bb66adb1e530a045f8deb3b2"];
        const activeGrpList = ["Verb"];

        const expected = [];
        const actual = termFilterByType(
          filterType,
          termList,
          frequencyList,
          activeGrpList,
          toggleFilterType
        );

        expect(actual).to.deep.eq(expected);
      });
      it("group found", function () {
        const expectedItem = timeGrpTerms[0];
        const frequencyList = [expectedItem.uid];
        const activeGrpList = ["Noun"];

        const expected = [expectedItem];
        const actual = termFilterByType(
          filterType,
          termList,
          frequencyList,
          activeGrpList,
          toggleFilterType
        );

        expect(actual).to.deep.eq(expected);
      });
      it("sub group found", function () {
        const expectedItem = timeGrpTerms[1];
        const frequencyList = [expectedItem.uid];
        const activeGrpList = ["Noun.Time"];

        const expected = [expectedItem];
        const actual = termFilterByType(
          filterType,
          termList,
          frequencyList,
          activeGrpList,
          toggleFilterType
        );

        expect(actual).to.deep.eq(expected);
      });
      it("group and sub group found", function () {
        const expectedItem1 = timeGrpTerms[1];
        const expectedItem2 = verbGrpTerms[0];

        const mixedGrpTermList = [...termList, ...verbGrpTerms];
        const frequencyList = [expectedItem1.uid, expectedItem2.uid];
        const activeGrpList = ["Noun.Time", "Verb"];

        const expected = [expectedItem1, expectedItem2];
        const actual = termFilterByType(
          filterType,
          mixedGrpTermList,
          frequencyList,
          activeGrpList,
          toggleFilterType
        );

        expect(actual).to.deep.eq(expected);
      });
    });
  });
});
