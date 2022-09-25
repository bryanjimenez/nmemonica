import { expect } from "chai";
import { calcHintElements } from "../../../src/helper/kanjiHelper";

/* global describe it */

describe("KanjiHTML", function () {
  describe("calcHintElements", function () {
    describe("starts with kana", function () {
      const kanjis = ["会計", "願"];
      const furiganas = ["かいけい", "ねが"];
      const okuriganas = ["お", "をお", "いします"];
      const startsWKana = true;

      it("1 mora hint", function () {
        const expected = [
          { k: 0, f: 0, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          1,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("2 mora hint", function () {
        const expected = [
          { k: 1, f: 1, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          2,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("3 mora hint", function () {
        const expected = [
          { k: 1, f: 2, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          3,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("4 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          4,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("5 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          5,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("6 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 1 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          6,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("7 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 2 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          7,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("8 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 1, o: 2 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          8,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("9 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          9,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("10 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 1 },
        ];
        const actual = calcHintElements(
          10,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("11 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 2 },
        ];
        const actual = calcHintElements(
          11,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("12 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 3 },
        ];
        const actual = calcHintElements(
          12,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("13 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 4 },
        ];
        const actual = calcHintElements(
          13,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("bad input 14 mora hint", function () {
        const expected = [
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 2 },
          { k: 0, f: 0, o: 4 },
        ];
        const actual = calcHintElements(
          14,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
    });

    describe("starts with kanji", function () {
      const kanjis = ["早起", "三文", "得"];
      const furiganas = ["はやお", "さんもん", "とく"];
      const okuriganas = ["きは", "の"];
      const startsWKana = false;

      it("1 mora hint", function () {
        const expected = [
          { k: 1, f: 1, o: 0 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          1,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });

      it("3 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 0 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          3,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });

      it("4 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 1 },
          { k: 0, f: 0, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          4,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });

      it("6 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 1, f: 1, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          6,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("7 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 1, f: 2, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          7,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("8 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 3, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          8,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("9 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 0 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          9,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("10 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 0, f: 0, o: 0 },
        ];
        const actual = calcHintElements(
          10,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("11 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 1, o: 0 },
        ];
        const actual = calcHintElements(
          11,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("12 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 0 },
        ];
        const actual = calcHintElements(
          12,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
      it("bad input 13 mora hint", function () {
        const expected = [
          { k: 2, f: 3, o: 2 },
          { k: 2, f: 4, o: 1 },
          { k: 1, f: 2, o: 0 },
        ];
        const actual = calcHintElements(
          13,
          kanjis,
          furiganas,
          okuriganas,
          startsWKana
        );

        expect(actual).to.deep.equal(expected);
      });
    });
  });
});
