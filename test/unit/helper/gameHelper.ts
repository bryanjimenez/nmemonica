import "jsdom-global/register";
import { expect } from "chai";
import { render, screen } from "@testing-library/react";
import { JapaneseText } from "../../../src/helper/JapaneseText";
import {
  activeGroupIncludes,
  getJapaneseHint,
} from "../../../src/helper/gameHelper";
import type { Optional } from "../../../src/typings/utils";
import type { RawVocabulary } from "nmemonica";

describe("gameHelper", function () {
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
  });
  describe("activeGroupIncludes", function () {
    it("empty");
    it("no group, no subgroup", function () {
      const activeGroup = ["undefined"];

      const pExamples = [
        {
          english: "indigo",
          // grp: "Noun",
          japanese: "インジゴ",
          romaji: "injigo",
          // subGrp: "Colors",
          uid: "6aaca6ff846cd1b55bd6e05831c7de43",
        },
        {
          english: "redundancy",
          // grp: "Noun",
          japanese: "じょうちょうせい\n冗長性",
          romaji: "jōchō-sei",
          subGrp: "Noun",
          uid: "96569ab8964699062f696fe0bd7a63d1",
        },
      ];

      const nExamples = [
        {
          english: "blue",
          grp: "Noun",
          japanese: "あお\n青",
          romaji: "ao",
          subGrp: "Colors",
          uid: "00c102a7e10b45b19afbab71c030bf63",
        },
        {
          english: "stationary, steady",
          grp: "Adjective",
          japanese: "ていじょう\n定常",
          romaji: "teijō",
          // subGrp: "",
          uid: "2110847595c7d2d2e5482748f75a5973",
        },
      ];

      const positive = pExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );
      const negative = nExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );

      expect(positive).to.deep.equal(pExamples.map(() => true));
      expect(negative).to.deep.equal(nExamples.map(() => false));
    });
    it("no group, subgroup", function () {
      const activeGroup = ["undefined.Noun"];

      const pExamples = [
        {
          english: "redundancy",
          // grp: "Noun",
          japanese: "じょうちょうせい\n冗長性",
          romaji: "jōchō-sei",
          subGrp: "Noun",
          uid: "96569ab8964699062f696fe0bd7a63d1",
        },
      ];

      const nExamples = [
        {
          english: "indigo",
          // grp: "Noun",
          japanese: "インジゴ",
          romaji: "injigo",
          // subGrp: "Colors",
          uid: "6aaca6ff846cd1b55bd6e05831c7de43",
        },
        {
          english: "stationary, steady",
          grp: "Adjective",
          japanese: "ていじょう\n定常",
          romaji: "teijō",
          // subGrp: "",
          uid: "2110847595c7d2d2e5482748f75a5973",
        },
        {
          english: "time",
          grp: "Noun",
          japanese: "じかん\n時間",
          romaji: "jikan",
          subGrp: "Noun",
          uid: "7c5086f337bdf69ef4cf924652fc7576",
        },
        {
          english: "blue",
          grp: "Noun",
          japanese: "あお\n青",
          romaji: "ao",
          subGrp: "Colors",
          uid: "00c102a7e10b45b19afbab71c030bf63",
        },
      ];

      const positive = pExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );
      const negative = nExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );

      expect(positive).to.deep.equal(pExamples.map(() => true));
      expect(negative).to.deep.equal(nExamples.map(() => false));
    });
    it("group, no subgroup", function () {
      const activeGroup = ["Adjective"];

      const pExamples = [
        {
          english: "stationary, steady",
          grp: "Adjective",
          japanese: "ていじょう\n定常",
          romaji: "teijō",
          // subGrp: "",
          uid: "2110847595c7d2d2e5482748f75a5973",
        },
        {
          english: "round",
          grp: "Adjective",
          japanese: "まるい\n丸い",
          romaji: "marui",
          subGrp: "Shape",
          uid: "bd2515a563263b6cf3e171f821155bd0",
        },
      ];

      const nExamples = [
        {
          english: "blue",
          grp: "Noun",
          japanese: "あお\n青",
          romaji: "ao",
          subGrp: "Colors",
          uid: "00c102a7e10b45b19afbab71c030bf63",
        },
        {
          english: "indigo",
          // grp: "Noun",
          japanese: "インジゴ",
          romaji: "injigo",
          // subGrp: "Colors",
          uid: "6aaca6ff846cd1b55bd6e05831c7de43",
        },
        {
          english: "stationary, steady",
          // grp: "Adjective",
          japanese: "ていじょう\n定常",
          romaji: "teijō",
          subGrp: "Adjective",
          uid: "2110847595c7d2d2e5482748f75a5973",
        },
        {
          english: "time",
          grp: "Noun",
          japanese: "じかん\n時間",
          romaji: "jikan",
          // subGrp: "",
          uid: "7c5086f337bdf69ef4cf924652fc7576",
        },
      ];

      const positive = pExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );
      const negative = nExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );

      expect(positive).to.deep.equal(pExamples.map(() => true));
      expect(negative).to.deep.equal(nExamples.map(() => false));
    });
    it("group, subgroup", function () {
      const activeGroup = ["Noun.Time"];

      const pExamples = [
        {
          english: "time",
          grp: "Noun",
          japanese: "じかん\n時間",
          romaji: "jikan",
          subGrp: "Time",
          uid: "7c5086f337bdf69ef4cf924652fc7576",
        },
      ];

      const nExamples = [
        {
          english: "blue",
          grp: "Noun",
          japanese: "あお\n青",
          romaji: "ao",
          subGrp: "Colors",
          uid: "00c102a7e10b45b19afbab71c030bf63",
        },
        {
          english: "indigo",
          // grp: "Noun",
          japanese: "インジゴ",
          romaji: "injigo",
          // subGrp: "Colors",
          uid: "6aaca6ff846cd1b55bd6e05831c7de43",
        },
        {
          english: "stationary, steady",
          // grp: "Adjective",
          japanese: "ていじょう\n定常",
          romaji: "teijō",
          subGrp: "Adjective",
          uid: "2110847595c7d2d2e5482748f75a5973",
        },
        {
          english: "time",
          grp: "Noun",
          japanese: "じかん\n時間",
          romaji: "jikan",
          // subGrp: "",
          uid: "7c5086f337bdf69ef4cf924652fc7576",
        },
        {
          english: "to recall",
          grp: "Verb",
          japanese: "おもいだす\n思い出す",
          romaji: "omoidasu",
          subGrp: "Memory",
          uid: "7b18c22af4c8f109f279fcdc66565f55",
        },
      ];

      const positive = pExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );
      const negative = nExamples.map((t) =>
        activeGroupIncludes(activeGroup, t)
      );

      expect(positive).to.deep.equal(pExamples.map(() => true));
      expect(negative).to.deep.equal(nExamples.map(() => false));
    });
  });
  describe("getJapaneseHint", function () {
    it("not hintable", function () {
      const j = JapaneseText.parse({ japanese: "うん\n運" });

      const { container } = render(getJapaneseHint(j));
      // screen.debug()
      expect(container.querySelector(".hint-mora")).to.be.null;
    });
    it("hiragana only", function () {
      const j = JapaneseText.parse({ japanese: "かかる" });

      render(getJapaneseHint(j));

      expect(screen.queryByText("か")?.className).to.equal("hint-mora");
      expect(screen.queryByText("かる")?.className).to.equal("invisible");
    });
    it("katakana only", function () {
      const j = JapaneseText.parse({ japanese: "アパート" });

      render(getJapaneseHint(j));

      expect(screen.queryByText("ア")?.className).to.equal("hint-mora");
      expect(screen.queryByText("パート")?.className).to.equal("invisible");
    });
    it("starting kanji with furigana", function () {
      const j = JapaneseText.parse({ japanese: "あさごはん\n朝ご飯" });

      render(getJapaneseHint(j));

      expect(screen.getByText("朝").tagName).equal("SPAN");
      expect(screen.getByText("あ").tagName).equal("SPAN");
      expect(screen.getByText("さ").className).equal("invisible");
      expect(screen.getByText("ご").className).equal("invisible");
      expect(screen.getByText("飯").className).equal("invisible");
      expect(screen.getByText("はん").className).equal("invisible");
    });
    it("kanji with digraphs (yōon)", function () {
      const j = JapaneseText.parse({ japanese: "しょしんしゃ\n初心者" });

      render(getJapaneseHint(j));

      expect(screen.getByText("初").tagName).equal("SPAN");
      expect(screen.getByText("しょ").tagName).equal("SPAN");
      expect(screen.getByText("心者").className).equal("invisible");
      expect(screen.getByText("しんしゃ").className).equal("invisible");
    });
  });
});
