import 'jsdom-global/register';
import { render, screen } from '@testing-library/react'
import { expect } from "chai";
import { JapaneseText } from "../../../src/helper/JapaneseText";
import { 
  getParseObjectHintMask,
  getParseObjectSpliceMask,
  getParseObjectMask,
  kanjiOkuriganaSpliceApplyCss
} from "../../../src/helper/kanjiHelper";

/* global describe it */

describe("kanjiHelper", function () {
  describe("getParseObjectHintMask", function () {
    describe("starts with kana", function () {
      const kanjis = ["会計", "願"];
      const furiganas = ["かいけい", "ねが"];
      const okuriganas = ["お", "をお", "いします"];
      const startsWKana = true;

      const parseObj = {kanjis, furiganas, okuriganas, startsWKana};

      it("1 mora hint", function () {
        const expected = [
          { k: 0, f: 0, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          1
        );

        expect(actual).to.deep.equal(expected);
      });
      it("2 mora hint", function () {
        const expected = [
          { k: 1, f: 1, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          2,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("3 mora hint", function () {
        const expected = [
          { k: 1, f: 2, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          3,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("4 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          4,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("5 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          5,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("6 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 1 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          6,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("7 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 2 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          7,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("8 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 1, o: 2 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          8,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("9 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          9,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("10 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 1 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          10,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("11 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 2 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          11,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("12 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 3 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          12,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("13 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 4 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          13,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("bad input 14 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 4 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          14,
        );

        expect(actual).to.deep.equal(expected);
      });
    });

    describe("starts with kanji", function () {
      const kanjis = ["早起", "三文", "得"];
      const furiganas = ["はやお", "さんもん", "とく"];
      const okuriganas = ["きは", "の"];
      const startsWKana = false;

      const parseObj = {kanjis, furiganas, okuriganas, startsWKana};

      it("1 mora hint", function () {
        const expected = [
          { k: 1, f: 1, o: 0 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          1
        );

        expect(actual).to.deep.equal(expected);
      });

      it("3 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 0 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          3,
        );

        expect(actual).to.deep.equal(expected);
      });

      it("4 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          4
        );

        expect(actual).to.deep.equal(expected);
      });

      it("6 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 1, f: 1, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          6,
        );

        expect(actual).to.deep.equal(expected);
      });
      it("7 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 1, f: 2, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          7
        );

        expect(actual).to.deep.equal(expected);
      });
      it("8 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 3, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          8
        );

        expect(actual).to.deep.equal(expected);
      });
      it("9 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          9
        );

        expect(actual).to.deep.equal(expected);
      });
      it("10 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          10
        );

        expect(actual).to.deep.equal(expected);
      });
      it("11 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 1, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          11
        );

        expect(actual).to.deep.equal(expected);
      });
      it("12 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          12
        );

        expect(actual).to.deep.equal(expected);
      });
      it("bad input 13 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 0 },
        ];
        const actual = getParseObjectHintMask(
          parseObj,
          13
        );

        expect(actual).to.deep.equal(expected);
      });
    });
  }); /** getParseObjectHintMask */




  describe("getParseObjectSpliceMask", function () {
    describe("starts w/ kanji", function () {
      describe("particles", function () {
        const testObj = JapaneseText.parse({
          japanese:
            "かのじょはてでめからひざしをさえぎった。\n彼女は手で目から日差しを遮った。",
        });

        it("で", function () {
          const particle = "で";
          const calc = [
            { k: 2, f: 4, o: 1 },
            { k: 1, f: 1, o: 1 },
            { k: 1, f: 1, o: 2 },
            { k: 2, f: 2, o: 2 },
            { k: 1, f: 3, o: 3 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(particle);
          const end = start + particle.length;
          const info = JSON.stringify({start, end, b:particle, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });

        it("から", function () {
          const particle = "から";
          const calc = [
            { k: 2, f: 4, o: 1 },
            { k: 1, f: 1, o: 1 },
            { k: 1, f: 1, o: 2 },
            { k: 2, f: 2, o: 2 },
            { k: 1, f: 3, o: 3 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 2 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(particle);
          const end = start + particle.length;
          const info = JSON.stringify({start, end, b:particle, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });

        it("を", function () {
          const particle = "を";
          const calc = [
            { k: 2, f: 4, o: 1 },
            { k: 1, f: 1, o: 1 },
            { k: 1, f: 1, o: 2 },
            { k: 2, f: 2, o: 2 },
            { k: 1, f: 3, o: 3 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(particle);
          const end = start + particle.length;
          const info = JSON.stringify({start, end, b:particle, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });
      });
     describe("kanji", function () {
        const testObj = JapaneseText.parse({
          japanese:
            "しょくぶつはつちからすいぶんをとる\n植物は土から水分を取る",
        });

        it("物", function () {
          const kanji = "物";
          const calc = [
            { k: 2, f: 5, o: 1 },
            { k: 1, f: 2, o: 2 },
            { k: 2, f: 4, o: 1 },
            { k: 1, f: 1, o: 1 },
          ];

          const expected = [
            { k: 1, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(kanji);
          const end = start + kanji.length;
          const info = JSON.stringify({start, end, b:kanji, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });

        it("水分", function () {
          const kanji = "水分";
          const calc = [
            { k: 2, f: 5, o: 1 },
            { k: 1, f: 2, o: 2 },
            { k: 2, f: 4, o: 1 },
            { k: 1, f: 1, o: 1 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 2, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(kanji);
          const end = start + kanji.length;
          const info = JSON.stringify({start, end, b:kanji, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });
      });

      describe("kanji okurigana boundary", function () {
        const testObj = JapaneseText.parse({
          japanese:
            "ちきゅうからつきいまでさんじゅうはちまんよんせんよんひゃくキロ\n地球から月まで三十八万四千四百キロ",
        });

        it("球か", function () {
          const boundary = "球か";
          const calc = [
            { k: 2, f: 4, o: 2 },
            { k: 1, f: 3, o: 2 },
            { k: 8, f: 18, o: 2 },
          ];

          const expected = [
            { k: 1, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});


          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });
      });
      describe("okurigana kanji boundary", function () {
        const testObj = JapaneseText.parse({
          japanese:
            "ちきゅうからつきいまでさんじゅうはちまんよんせんよんひゃくキロ\n地球から月まで三十八万四千四百キロ",
        });

        it("から月", function () {
          const boundary = "から月";
          const calc = [
            { k: 2, f: 4, o: 2 },
            { k: 1, f: 3, o: 2 },
            { k: 8, f: 18, o: 2 },
          ];

          const expected = [
            { k: 0, f: 0, o: 2 },
            { k: 1, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});


          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });
      });
      describe("okurigana kanji okurigana boundary", function () {
        const testObj = JapaneseText.parse({
          japanese:
            "ちきゅうからつきいまでさんじゅうはちまんよんせんよんひゃくキロ\n地球から月まで三十八万四千四百キロ",
        });

        it("から月まで", function () {
          const boundary = "から月まで";
          const calc = [
            { k: 2, f: 4, o: 2 },
            { k: 1, f: 3, o: 2 },
            { k: 8, f: 18, o: 2 },
          ];

          const expected = [
            { k: 0, f: 0, o: 2 },
            { k: 1, f: 0, o: 2 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});


          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });
      });
      describe("kanji okurigana kanji boundary", function () {
        const testObj = JapaneseText.parse({
          japanese:
            "しょくぶつはつちからすいぶんをとる\n植物は土から水分を取る",
        });

        it("土から水分", function () {
          const boundary = "土から水分";
          const calc = [
            { k: 2, f: 5, o: 1 },
            { k: 1, f: 2, o: 2 },
            { k: 2, f: 4, o: 1 },
            { k: 1, f: 1, o: 1 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 1, f: 0, o: 2 },
            { k: 2, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);
          // console.log(JSON.stringify(lengths))

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });
      });
      describe("mid kanji", function () {
        const testObj = JapaneseText.parse({
          japanese:
          "しおとかコショウとかはしおかげんです\n塩とかコショウとかは塩加減です",
        });
        //"しおとかコショウとかはしおかげんです\n塩とかコショウとかは塩加減です"

        it("塩_加_減です", function () {
          const boundary = "加";

          const expected = [
            {"k":0,"f":0,"o":0},
            {"k":1,"f":0,"o":0}
          ];

          // const lengths = getParseObjectMask(testObj.parseObj);
          // console.log(JSON.stringify(lengths))

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(actual, info).to.deep.equal(expected);
        })
      })
    });

    describe("starts w/ kana", function () {
      const testObj = JapaneseText.parse({
        japanese:
          "おかあさんはたかいこえでばんごはんができたっていった\nお母さんは高い声で晩ごはんができたって言った",
      });

      describe("particles", function () {
        // p:は,で,が,って

        it("で", function () {
          const particle = "で";
          const calc = [
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 2, o: 3 },
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 1, o: 9 },
            { k: 0, f: 0, o: 2 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(particle);
          const end = start + particle.length;
          const info = JSON.stringify({start, end, b:particle, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });

        it("が", function () {
          const particle = "が";
          const calc = [
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 2, o: 3 },
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 1, o: 9 },
            { k: 0, f: 0, o: 2 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(particle);
          const end = start + particle.length;
          const info = JSON.stringify({start, end, b:particle, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });

        it("って", function () {
          const particle = "って";
          const calc = [
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 2, o: 3 },
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 2, o: 1 },
            { k: 1, f: 1, o: 9 },
            { k: 0, f: 0, o: 2 },
          ];

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 2 },
            { k: 0, f: 0, o: 0 },
          ];

          const lengths = getParseObjectMask(testObj.parseObj);

          const start = testObj.getSpelling().indexOf(particle);
          const end = start + particle.length;
          const info = JSON.stringify({start, end, b:particle, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(lengths, "getParseObjectMask").to.deep.equal(calc);
          expect(actual, info).to.deep.equal(expected);
        });
      });

      describe("kanji okurigana boundary", function () {
        // "おかあさんはたかいこえでばんごはんができたっていった\nお母さんは高い声で晩ごはんができたって言った",

        it("母さん", function () {
          const boundary = "母さん";

          const expected = [
            { k: 1, f: 0, o: 0 },
            { k: 0, f: 0, o: 2 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          // const lengths = getParseObjectMask(testObj.parseObj);
          // console.log(JSON.stringify(lengths))

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(actual, info).to.deep.equal(expected);
        });


        it("start=2", function () {
          // const kanjis = ["会計", "願"];
          // const furiganas = ["かいけい", "ねが"];
          // const okuriganas = ["お", "をお", "いします"];
          // const startsWKana = true;
          // const testObj = { kanjis, furiganas, okuriganas, startsWKana };

          const testObj = JapaneseText.parse({
            japanese:
            "おかいけいをおねがいします\nお会計をお願いします"
          });

          // "おかいけいをおねがいします"
          // "お会 計 をお願いします"
          // "お会[計]をお願いします"

          const boundary="計";
          
          const expected = [
            { k: 1, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];
  
          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(testObj.parseObj, start);
          expect(actual, info).to.deep.equal(expected);
        });
        it("start=2 end=4", function () {
          const testObj = JapaneseText.parse({
            japanese:
            "おかいけいをおねがいします\nお会計をお願いします"
          });

          // "おかいけいをおねがいします"
          // "お会 計を お願いします"
          // "お会[計を]お願いします"
          const boundary = "計を";

    
          const expected = [
            { k: 1, f: 0, o: 0 },
            { k: 0, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
          ];

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});
  
          const actual = getParseObjectSpliceMask(testObj.parseObj, start, end);
          expect(actual, info).to.deep.equal(expected);
        });
        it("start=2 end=5", function () {
          const testObj = JapaneseText.parse({
            japanese:
            "おかいけいをおねがいします\nお会計をお願いします"
          });

          // "おかいけいをおねがいします"
          // "お会 計をお 願いします"
          // "お会[計をお]願いします"

          const boundary = "計をお";
          
          const expected = [
            { k: 1, f: 0, o: 0 },
            { k: 0, f: 0, o: 2 },
            { k: 0, f: 0, o: 0 },
          ];
  
          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(testObj.parseObj, start, end);
          expect(actual, info).to.deep.equal(expected);
        });

      });
      describe("okurigana kanji boundary", function () {
        // "おかあさんはたかいこえでばんごはんができたっていった\nお母さんは高い声で晩ごはんができたって言った",

        it("お母", function () {
          const boundary = "お母";

          const expected = [
            { k: 1, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          // const lengths = getParseObjectMask(testObj.parseObj);
          // console.log(JSON.stringify(lengths))

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(actual, info).to.deep.equal(expected);
        });
      });
      describe("okurigana kanji okurigana boundary", function () {
        // "おかあさんはたかいこえでばんごはんができたっていった\nお母さんは高い声で晩ごはんができたって言った",

        it("お母さん", function () {
          const boundary = "お母さん";

          const expected = [
            { k: 1, f: 0, o: 1 },
            { k: 0, f: 0, o: 2 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          // const lengths = getParseObjectMask(testObj.parseObj);
          // console.log(JSON.stringify(lengths))

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(actual, info).to.deep.equal(expected);
        });
      });
      describe("kanji okurigana kanji boundary", function () {
        // "おかあさんはたかいこえでばんごはんができたっていった\nお母さんは高い声で晩ごはんができたって言った",

        it("母さんは高", function () {
          const boundary = "母さんは高";

          const expected = [
            { k: 1, f: 0, o: 0 },
            { k: 1, f: 0, o: 3 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          // const lengths = getParseObjectMask(testObj.parseObj);
          // console.log(JSON.stringify(lengths))

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(actual, info).to.deep.equal(expected);
        });
      });
      describe("mid okurigana", function () {
        // "おかあさんはたかいこえでばんごはんができたっていった\nお母さんは高い声で晩ごはんができたって言った",

        it("母さ_ん_は高", function () {
          const boundary = "ん";

          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
          ];

          // const lengths = getParseObjectMask(testObj.parseObj);
          // console.log(JSON.stringify(lengths))

          const start = testObj.getSpelling().indexOf(boundary);
          const end = start + boundary.length;
          const info = JSON.stringify({start, end, b:boundary, i: testObj.getSpelling()});

          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(actual, info).to.deep.equal(expected);
        })
      })
    });
    describe("contains space as workaround", function(){
      describe("starts w/ kanji", function(){
        it("behaves?", function(){

          const particle = "を";
          
          const expected = [
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 0 },
            { k: 0, f: 0, o: 1 },
            { k: 0, f: 0, o: 0 },
          ];

          const testObj = JapaneseText.parse({
            japanese:
              "せいとがせんせいに にほんごをおしえてもらう\n生徒が先生に 日本語を教えてもらう"
          });

          const start = testObj.getSpelling().indexOf(particle);
          const end = start + particle.length;
          const info = JSON.stringify({start, end, b:particle, i: testObj.getSpelling()});


          const actual = getParseObjectSpliceMask(
            testObj.parseObj,
            start,
            end
          );

          expect(actual, info).to.deep.equal(expected);
        })
      })
    })
  }); /** getParseObjectSpliceMask */

  describe("kanjiOkuriganaSpliceApplyCss", function () {
    const testObj = JapaneseText.parse({
      japanese: "おかいけいをおねがいします\nお会計をお願いします",
    });

    it("apply css", function () {
      const boundary = "を";
      const start = testObj.getSpelling().indexOf(boundary);
      const end = start + boundary.length;

      const hidden = "transparent-font underline";

      render(kanjiOkuriganaSpliceApplyCss(testObj.parseObj, { hidden }, start, end));

      expect(screen.getAllByText("お")[0].tagName).equal("SPAN");
      expect(screen.getByText("会計").tagName).equal("SPAN");
      expect(screen.getByText("かいけい").tagName).equal("SPAN");
      expect(screen.getByText(boundary).className).equal(hidden);
      expect(screen.getAllByText("お")[1].tagName).equal("SPAN");
      expect(screen.getByText("願").tagName).equal("SPAN");
      expect(screen.getByText("ねが").tagName).equal("SPAN");
      expect(screen.getByText("いします").tagName).equal("SPAN");
    });
  });
});
