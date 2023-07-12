import { expect } from "chai";

import { createChoices } from "../../../src/components/Games/KanjiGrid";

describe("KanjiGrid", function () {
  describe("createChoices", function () {
    describe("terminates", function () {
      it("not enough choices", function () {
        const choiceN = 4;

        const expected = { english: "Place", kanji: "所", tags: ["Jōyō_1"], uid: "1def10bd27b54e5f2b56b37c418ae363", };
        const exclude = { english: "Location, Place", kanji: "場", tags: ["Jōyō_1", "Traffic"], uid: "5d6e07abd357c9cb894e535708f61f1f", };
        const places = [
          expected,
          exclude,
          // {"english":"Outside","grp":"Musical Drill","kanji":"外","tags":["Musical Drill","Places & Direction","JLPN5","Jōyō_1"], "uid":"0e0e0111aa0ea198bec62d0b155f7db0",},
          // {"english":"South","grp":"Radical","kanji":"南","tags":["Radical","Level_36","Places & Direction","JLPN5","Jōyō_4","Maps"], "uid":"48029ea20853308ea6bcd411d4ec2ef3",},
          { english: "Right", kanji: "右", tags: [ "Musical Drill", "Places & Direction", "JLPN5", "Radical", "Level_19", "Jōyō_4", ], uid: "4d9c32c23df5d234e629c922c58d8e12", },
          { english: "Country", kanji: "国", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "62f8ae5410fdbd852d35c4fdc6e5e363", },
        ];

        // const answer = {"english":"Run","grp":"Musical Drill","kanji":"走","tags":["Musical Drill","Radical","Level_5","Jōyō_5"], "uid": "0154e79e142c1c73e0859db1b7ce523d",};
        const answer = expected;
        const kanjiList = places;
        const actual = createChoices(choiceN, answer, kanjiList);

        expect(actual, "include answer")
          .to.be.length(choiceN - 1)
          .and.deep.include.members([answer]);
        expect(actual, "exclude alternate answer").and.not.deep.include.members(
          [exclude]
        );
      });
    });
    describe("exclude choices", function () {
      it("no duplicate answer choices", function () {
        const choiceN = 4;
        const compareOn = "english";

        const expected = { english: "Place", kanji: "所", tags: ["Jōyō_1"], uid: "1def10bd27b54e5f2b56b37c418ae363", };
        const exclude = { english: "Location, Place", kanji: "場", tags: ["Jōyō_1", "Traffic"], uid: "5d6e07abd357c9cb894e535708f61f1f", };
        const places = [
          expected,
          exclude,
          // {"english":"Outside","grp":"Musical Drill","kanji":"外","tags":["Musical Drill","Places & Direction","JLPN5","Jōyō_1"], "uid":"0e0e0111aa0ea198bec62d0b155f7db0",},
          { english: "South", kanji: "南", tags: [ "Radical", "Level_36", "Places & Direction", "JLPN5", "Jōyō_4", "Maps", ], uid: "48029ea20853308ea6bcd411d4ec2ef3", },
          { english: "Right", kanji: "右", tags: [ "Musical Drill", "Places & Direction", "JLPN5", "Radical", "Level_19", "Jōyō_4", ], uid: "4d9c32c23df5d234e629c922c58d8e12", },
          { english: "Country", kanji: "国", tags: ["Musical Drill", "Places & Direction", "JLPN5", "Jōyō_1"], uid: "62f8ae5410fdbd852d35c4fdc6e5e363", },
        ];

        // const answer = {"english":"Run","grp":"Musical Drill","kanji":"走","tags":["Musical Drill","Radical","Level_5","Jōyō_5"], "uid": "0154e79e142c1c73e0859db1b7ce523d",};
        const answer = expected;
        const kanjiList = places;
        const actual = createChoices(choiceN, answer, kanjiList);

        expect(actual, "include answer")
          .to.be.length(choiceN)
          .and.deep.include.members([answer]);
        expect(actual, "exclude alternate answer").and.not.deep.include.members(
          [exclude]
        );
      });
    });
  });
});
