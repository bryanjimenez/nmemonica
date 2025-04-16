import "jsdom-global/register";
import { expect } from "chai";
import {
  readCsvToSheet,
  readJsonSettings,
} from "../../../src/slices/sheetSlice";
import { unusualApostrophe } from "../../../src/helper/unicodeHelper";

describe("sheetSlice", function () {
  describe("readCsvToSheet", function () {
    describe("throws", function () {
      it("invalid character", async function () {
        const text = `Kanji,English,Pronounced,Tags
        四,Four,シ、よつ、よ、よん,"{""tags"":[""JLPTN5"",""Number"","" Jōyō_1_1""], ""stroke"":5}"
        六,Six,\u200bロク、むつ、む,"{""tags"":[""JLPTN5"",""Number"","" Jōyō_1_3""], ""stroke"":4}"`;
        try {
          const actual = await readCsvToSheet(text, "Kanji");
          expect(false, "invalid character throws").to.be.true;
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
          expect(err.message).to.eq("CSV contains invalid characters");
        }
      });
      it.skip("invalid headers");
      it.skip("missing required headers");
      it.skip("exceeds maximum cols");
      it.skip("unexpected column types");
    });
    describe("parses", function () {
      it("valid csv", async function () {
        const text = `Kanji,English,Pronounced,Tags
      四,Four,シ、よつ、よ、よん,"{""tags"":[""JLPTN5"",""Number"","" Jōyō_1_1""], ""stroke"":5}"
      六,Six,ロク、むつ、む,"{""tags"":[""JLPTN5"",""Number"","" Jōyō_1_3""], ""stroke"":4}"`;
        const actual = await readCsvToSheet(text, "Kanji");

        expect(actual).to.have.keys(["name", "rows", "autofilter"]);
      });
      it("replaces unusual apostrophe", async function () {
        const text = `Kanji,English,Pronounced,Tags
      四,Four,シ、よつ、よ、よん,"{""tags"":[""JLPTN5"",""Number"","" Jōyō_1_1""], ""stroke"":5}"
      六,Six${unusualApostrophe},ロク、むつ、む,"{""tags"":[""JLPTN5"",""Number"","" Jōyō_1_3""], ""stroke"":4}"`;
        const actual = await readCsvToSheet(text, "Kanji");

        expect(actual).to.have.keys(["name", "rows", "autofilter"]);

        expect(text).to.contain(unusualApostrophe);
        expect(actual.rows[2].cells[1].text).to.contain("'");
      });
    });
  });

  describe("readJsonSettings", function () {
    describe("throws", function () {
      it("invalid character", function () {
        const actual = readJsonSettings(
          '{"global":{"debug":3,"touchSwipe":"\u200b"}}'
        ) as Error; // zerp-width-space

        expect(actual).to.be.instanceOf(Error);
        expect(actual.message).to.eq("Settings contains invalid characters");
      });

      it("unrecognized root setting", function () {
        const actual = readJsonSettings(
          '{"local":{"debug":3,"touchSwipe":true}}'
        ) as Error; // local isn't a valid field

        expect(actual).to.be.instanceOf(Error);
        expect(actual.message).to.eq("Unrecognized Settings");
      });

      it.skip("unrecognized child setting");

      it("malformed JSON", function () {
        const actual = readJsonSettings(
          '{"global":{"debug":3,"touchSwipe":true *}}'
        ) as Error;

        expect(actual).to.be.instanceOf(Error);
        expect(actual.message).to.eq("Malformed JSON");
      });
    });
    describe("parses", function () {
      it("valid settings", function () {
        const expected = { global: { debug: 3, touchSwipe: true } };
        const actual = readJsonSettings(
          '{"global":{"debug":3,"touchSwipe":true }}'
        );

        expect(actual).to.deep.eq(expected);
      });
    });
  });
});
