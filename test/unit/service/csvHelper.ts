import { expect } from "chai";
import { csvToObject_TEST, objectToCsv_TEST } from "../../../service/helper/csvHelper";

describe("csvHelper", function () {
  describe("csvToObject", function () {
    const exampleData = [
      `this,is,my`,
      `CSV,だいようぶ？,`,
      `,,`,
      `test,,test`
    ];

    it("correct row count", function () {
      return csvToObject_TEST(exampleData).then((sheet) => {
        expect(sheet.rows.len).to.equal(4);
      });
    });

    it("skips empty rows", function () {
      return csvToObject_TEST(exampleData).then((sheet) => {
        expect(sheet.rows[0]).to.deep.eq({
          cells: {
            "0": { text: "this" },
            "1": { text: "is" },
            "2": { text: "my" },
          },
        });
        expect(sheet.rows[1]).to.deep.eq({
          cells: { "0": { text: "CSV" }, "1": { text: "だいようぶ？" } },
        });

        expect(sheet.rows[2]).to.deep.eq({ cells: {} });
        expect(sheet.rows[3]).to.deep.eq({
          cells: { "0": { text: "test" }, "2": { text: "test" } },
        });
      });
    });

    it("cell w/ newline", function () {
      const multilineTest = [
        `"the multiline`,
        `test",,testing`
      ];
      return csvToObject_TEST(multilineTest).then((sheet) => {
        expect(sheet.rows[0]).to.deep.eq({
          cells: {
            "0": { text: "the multiline\ntest" },
            "2": { text: "testing" },
          },
        });
      });
    });

    it("row w/ multiple cell w/ newline", function () {
      const fileMock = [
        `"どうやってしるの`,
        `どうやって知るの",dou yatte shiru no,How will you know?,,,,"Exception:`,
        `知る used as if future tense`,
        `to know something not currently known",,,,,,`,
        `"にほんごがはなせるようになりたい`,
        `日本語が話せるようになりたい",nihongo ga hanaseru yō ni naritai,I want to be able to speak Japanese,,Desire,verb + yō ni naru,,,,,,,`,
      ];
      return csvToObject_TEST(fileMock).then((sheet) => {
        expect(sheet.rows[0]).to.deep.eq({
          cells: {
            "0": { text: "どうやってしるの\nどうやって知るの" },
            "1": { text: "dou yatte shiru no" },
            "2": { text: "How will you know?" },
            "6": {
              text: "Exception:\n知る used as if future tense\nto know something not currently known",
            },
          },
        });
      });
    });

    it("double quotes", function () {
      const fileMock = [
        `"アイツに「おそい」ってよばれた`,
        `アイツに「遅い」って呼ばれた",aitsu ni osoi tte yobareta,"That guy called me ""slow""",,Noun+Verb,,,"p:に`,
        `fragment`,
        `passive",,,,,`,
      ];
      const expected = {
        cells: {
          "0": {
            text: "アイツに「おそい」ってよばれた\nアイツに「遅い」って呼ばれた",
          },
          "1": { text: "aitsu ni osoi tte yobareta" },
          "2": { text: 'That guy called me "slow"' },
          "4": { text: "Noun+Verb" },
          "7": { text: "p:に\nfragment\npassive" },
        },
      };

      return csvToObject_TEST(fileMock).then((sheet) => {
        expect(sheet.rows[0]).to.deep.eq(expected);
      });
    });

    it("double quotes 2", function () {
      const fileMock = [
        `"アイツに「おそい」ってよばれた`,
        `アイツに「遅い」って呼ばれた",aitsu ni osoi tte yobareta,"That guy called me ""slow""",,Noun+Verb,,,"p:に`,
        `fragment`,
        `passive"`,
      ];
      const actual = csvToObject_TEST(fileMock);

      const expected = {
        cells: {
          "0": {
            text: "アイツに「おそい」ってよばれた\nアイツに「遅い」って呼ばれた",
          },
          "1": { text: "aitsu ni osoi tte yobareta" },
          "2": { text: 'That guy called me "slow"' },
          "4": { text: "Noun+Verb" },
          "7": { text: "p:に\nfragment\npassive" },
        },
      };

      return actual.then((sheet) => {
        expect(sheet.rows[0]).to.deep.eq(expected);
      });
    });

    it("delimiter inside string", function () {
      const fileMock = [`画,"brush-stroke, picture",,,,TV,,,,,,,,`];
      const expected = {
        cells: {
          "0": { text: "画" },
          "1": { text: "brush-stroke, picture" },
          "5": { text: "TV" },
        },
      };

      csvToObject_TEST(fileMock).then((actual) => {
        expect(actual).to.deep.equal(expected);
      });
    });
  });

  describe("objectToCsv", function () {
    it("quotations", function () {
      const obj = {
        name: "",
        rows: {
          "0": {
            cells: {
              "0": {
                text: "アイツに「おそい」ってよばれた\nアイツに「遅い」って呼ばれた",
              },
              "1": { text: "aitsu ni osoi tte yobareta" },
              "2": { text: 'That guy called me "slow"' },
              "4": { text: "Noun+Verb" },
              "7": { text: "p:に\nfragment\npassive" },
            },
          },
          len: 1,
        },
      };

      
      const expected = [
        `"アイツに「おそい」ってよばれた`,
        `アイツに「遅い」って呼ばれた",aitsu ni osoi tte yobareta,"That guy called me ""slow""",,Noun+Verb,,,"p:に`,
        `fragment`,
        `passive"`,
      ];

      const actual = objectToCsv_TEST(obj);

      expect(actual).to.deep.equal(expected);
    });
    it("to csv", function () {
      const obj = {
        name: "",
        rows: {
          "0": {
            cells: {
              "0": { text: "おつかれさまです\nお疲れ様です" },
              "1": { text: "o tsukare sama desu" },
              "2": {
                text: "I appreciate your efforts, thank you very much, good work",
              },
              "3": { text: "(Unfinished task) tired person" },
              "4": { text: "Social" },
            },
          },
          len: 1,
        },
      };

      const expected = [
        `"おつかれさまです`,
        `お疲れ様です",o tsukare sama desu,"I appreciate your efforts, thank you very much, good work",(Unfinished task) tired person,Social`,
      ];

      const actual = objectToCsv_TEST(obj);

      expect(actual).to.deep.equal(expected);
    });
  });
});
