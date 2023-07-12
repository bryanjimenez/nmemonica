import "jsdom-global/register";
import { expect } from "chai";
import { render, screen } from "@testing-library/react";

import {
  choiceToHtml,
  oneFromList,
  createEnglishChoices,
} from "../../../src/components/Games/KanjiGame";

describe("KanjiGame", function () {
  describe("oneFromList", function () {
    it("no choices", function () {
      const expected = ["Zero"];
      const list = ["zero"];

      const stringList = list.join(", ");
      const actual = oneFromList(stringList);

      expect(expected).to.contain(actual);
    });
    it("selects one and uses propercase", function () {
      const expected = ["One", "Two", "Three", "Four"];
      const list = ["one", "two", "three", "four"];

      const stringList = list.join(", ");
      const actual = oneFromList(stringList);

      expect(expected).to.contain(actual);
    });
  });
  describe("choiceToHtml", function () {
    describe("non verb", function () {
      it("show first fade rest", function () {
        const k = { english: "Test" };

        const choiceFn = choiceToHtml(k);

        render(choiceFn({ fadeIn: false }));

        expect(screen.getByText("T")).to.not.be.null;
        expect(screen.getByText("est")).to.not.be.null;
      });
      it.skip("visibility", function () {
        // TODO: need mocha -> jest
        const k = { english: "Test" };

        const choiceFn = choiceToHtml(k);

        render(choiceFn({ fadeIn: false }));

        expect(screen.getByText("T")).to.not.be.null;
        expect(screen.getByText("est")).to.not.be.null;
      });
    });

    describe("verb", function () {
      it("show first fade rest (exclude 'to ')", function () {
        const k = { english: "To test" };

        const choiceFn = choiceToHtml(k);

        render(choiceFn({ fadeIn: false }));

        expect(screen.getByText("To")).to.not.be.null;
        expect(screen.getByText("t")).to.not.be.null;
        expect(screen.getByText("est")).to.not.be.null;
      });
    });
    describe("non alpha start", function () {
      it("show first fade rest (exclude non alpha)", function () {
        const k = { english: "-years old" };

        const choiceFn = choiceToHtml(k);

        render(choiceFn({ fadeIn: false }));

        // screen.debug();
        expect(screen.getByText("-")).to.not.be.null;
        expect(screen.getByText("y")).to.not.be.null;
        expect(screen.getByText("ears old")).to.not.be.null;
      });
    });
  });
  describe("createEnglishChoices", function () {
    const choiceN = 4;

    describe("terminates", function () {
      it("not enough choices", function () {
        const expected = { english: "Place", kanji: "所", tags: ["Jōyō_1"], uid: "1def10bd27b54e5f2b56b37c418ae363", };
        const excluded = { english: "Location, Place", kanji: "場", tags: ["Jōyō_1", "Traffic"], uid: "5d6e07abd357c9cb894e535708f61f1f", };
        const places = [
          expected,
          excluded,
          // choiceN - 2
          // {"english":"Outside","grp":"Musical Drill","kanji":"外","tags":["Musical Drill","Places & Direction","JLPN5","Jōyō_1"], "uid":"0e0e0111aa0ea198bec62d0b155f7db0",},
          // {"english":"South","grp":"Radical","kanji":"南","tags":["Radical","Level_36","Places & Direction","JLPN5","Jōyō_4","Maps"], "uid":"48029ea20853308ea6bcd411d4ec2ef3",},
          { english: "Country", kanji: "国", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "62f8ae5410fdbd852d35c4fdc6e5e363", },
        ];

        const answer = expected;
        const kanjiList = places;
        const exampleList = [];
        const actual = createEnglishChoices(answer, kanjiList, exampleList);

        expect(actual, "include answer")
          .to.be.length(choiceN - 2)
          .and.deep.include.members([answer]);
        expect(
          actual,
          "exclude duplicate answer choice"
        ).to.not.deep.include.members([excluded]);
      });
    });
    describe("exclude choices", function () {
      it("should not match the right answer(s)", function () {
        const expected = { english: "Place", kanji: "所", tags: ["Jōyō_1"], uid: "1def10bd27b54e5f2b56b37c418ae363", };
        const excluded = { english: "Location, Place", kanji: "場", tags: ["Jōyō_1", "Traffic"], uid: "5d6e07abd357c9cb894e535708f61f1f", };
        const places = [
          expected,
          excluded,
          { english: "Outside", kanji: "外", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "0e0e0111aa0ea198bec62d0b155f7db0", },
          { english: "South", kanji: "南", tags: [ "Radical", "Level_36", "Places & Direction", "JLPN5", "Jōyō_4", "Maps",], uid: "48029ea20853308ea6bcd411d4ec2ef3", },
          { english: "Country", kanji: "国", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "62f8ae5410fdbd852d35c4fdc6e5e363", },
        ];

        const answer = expected;
        const kanjiList = places;
        const exampleList = [];
        const actual = createEnglishChoices(answer, kanjiList, exampleList);

        expect(actual, "include answer")
          .to.be.length(choiceN)
          .and.deep.include.members([answer]);
        expect(
          actual,
          "exclude duplicate answer choice"
        ).to.not.deep.include.members([excluded]);
      });
      it("should not match a previous choice", function () {
        const expected = {english: "Outside", kanji: "外", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "0e0e0111aa0ea198bec62d0b155f7db0", };
        const excludeOne = [
          { english: "Place", kanji: "所", tags: ["Jōyō_1"], uid: "1def10bd27b54e5f2b56b37c418ae363", },
          { english: "Place", kanji: "場", tags: ["Jōyō_1", "Traffic"], uid: "5d6e07abd357c9cb894e535708f61f1f", },
        ];
        const places = [
          ...excludeOne,
          expected,
          { english: "Right", kanji: "右", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Radical", "Level_19", "Jōyō_4",], uid: "4d9c32c23df5d234e629c922c58d8e12", },
          { english: "Clown", kanji: "咅", tags: ["Radical", "Level_9"], uid: "836d9194ee035c14e535cac137a5693e", },
        ];

        const answer = expected;
        const kanjiList = places;
        const exampleList = [];
        const actual = createEnglishChoices(answer, kanjiList, exampleList);
        const oneOrOther = actual.find((c) => c.uid === excludeOne[0].uid);
        const includeOne = oneOrOther ? excludeOne[0] : excludeOne[1];
        const excludeOther = oneOrOther ? excludeOne[1] : excludeOne[0];

        expect(actual, "include answer")
          .to.be.length(choiceN)
          .and.deep.include.members([answer]);
        expect(actual, "include choice").to.deep.include.members([includeOne]);
        expect(actual, "exclude duplicate choice").to.not.deep.include.members([
          excludeOther,
        ]);
      });

      it("should not match a previous firstLetter fade hint", function () {
        const expected = { english: "Clown", kanji: "咅", tags: ["Radical", "Level_9"], uid: "836d9194ee035c14e535cac137a5693e", };
        const excluded = { english: "Country", kanji: "国", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "62f8ae5410fdbd852d35c4fdc6e5e363", };
        const places = [
          { english: "Place", kanji: "所", tags: ["Jōyō_1"], uid: "1def10bd27b54e5f2b56b37c418ae363", },
          { english: "Right", kanji: "右", tags: [ "Musical Drill", "Places & Direction", "JLPN5", "Radical", "Level_19", "Jōyō_4", ], uid: "4d9c32c23df5d234e629c922c58d8e12", },
          { english: "Outside", kanji: "外", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "0e0e0111aa0ea198bec62d0b155f7db0", },
          excluded,
          expected,
        ];

        const answer = expected;
        const kanjiList = places;
        const exampleList = [];
        const actual = createEnglishChoices(answer, kanjiList, exampleList);
        expect(actual, "include answer")
          .to.be.length(choiceN)
          .and.deep.include.members([answer]);
        expect(
          actual,
          "exclude duplicate first letter choices"
        ).to.not.deep.include.members([excluded]);
      });
    });
  });
});
