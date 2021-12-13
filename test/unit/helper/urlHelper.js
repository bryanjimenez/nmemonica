import { expect } from "chai";
import {
  removeParam,
  renameParam,
  addParam,
} from "../../../src/helper/urlHelper";

/* global describe it */

describe("urlHelper", function () {
  describe("addParam", function () {
    it("start url", function () {
      const expected =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const url = "https://www.example.com/path";

      const actual = addParam(url, {
        q: "theIndex",
        tl: "ja",
        other: "otherThing",
      });

      expect(actual).to.equal(expected);
    });
    it("mid url", function () {
      const expected =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const url = "https://www.example.com/path?q=theIndex";

      const actual = addParam(url, { tl: "ja", other: "otherThing" });

      expect(actual).to.equal(expected);
    });
    it("undefined param", function () {
      const expected =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const url = "https://www.example.com/path?q=theIndex";

      const actual = addParam(url, {
        tl: "ja",
        other: "otherThing",
        notShown: undefined,
      });

      expect(actual).to.equal(expected);
    });
  });
  describe("renameParam", function () {
    it("start url", function () {
      const expected =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const url =
        "https://www.example.com/path?q=japaneseword&index=theIndex&tl=ja&other=otherThing";

      const actual = renameParam(url, "index", "q");

      expect(actual).to.equal(expected);
    });
    it("mid url", function () {
      const expected =
        "https://www.example.com/path?tl=ja&q=theIndex&other=otherThing";
      const url =
        "https://www.example.com/path?tl=ja&q=japaneseword&index=theIndex&other=otherThing";

      const actual = renameParam(url, "index", "q");

      expect(actual).to.equal(expected);
    });
    it("end url", function () {
      const expected =
        "https://www.example.com/path?tl=ja&q=theIndex&other=otherThing";
      const url =
        "https://www.example.com/path?tl=ja&index=theIndex&other=otherThing&q=japaneseword";

      const actual = renameParam(url, "index", "q");

      expect(actual).to.equal(expected);
    });
  });
  describe("removeParam", function () {
    it("start url", function () {
      const expected =
        "https://www.example.com/path?tl=ja&q=theIndex&other=otherThing";
      const url =
        "https://www.example.com/path?remove=me&tl=ja&q=theIndex&other=otherThing";

      const actual = removeParam(url, "remove");

      expect(actual).to.equal(expected);
    });
    it("mid url", function () {
      const expected =
        "https://www.example.com/path?tl=ja&q=theIndex&other=otherThing";
      const url =
        "https://www.example.com/path?tl=ja&remove=me&q=theIndex&other=otherThing";

      const actual = removeParam(url, "remove");

      expect(actual).to.equal(expected);
    });
    it("end url", function () {
      const expected =
        "https://www.example.com/path?tl=ja&q=theIndex&other=otherThing";
      const url =
        "https://www.example.com/path?tl=ja&q=theIndex&other=otherThing&remove=me";

      const actual = removeParam(url, "remove");

      expect(actual).to.equal(expected);
    });
  });
});
