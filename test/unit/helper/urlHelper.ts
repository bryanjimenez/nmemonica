import { expect } from "chai";
import {
  removeParam,
  addParam,
  getParam,
} from "../../../src/helper/urlHelper";

/* global describe it */

describe("urlHelper", function () {
  describe("getParam", function () {
    it("start url", function () {
      const url =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const expected = "theIndex";

      const actual = getParam(url, "q");

      expect(actual).to.equal(expected);
    });
    it("start url one param", function () {
      const url = "https://www.example.com/path?q=theIndex";
      const expected = "theIndex";

      const actual = getParam(url, "q");

      expect(actual).to.equal(expected);
    });
    it("mid url", function () {
      const url =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const expected = "ja";

      const actual = getParam(url, "tl");

      expect(actual).to.equal(expected);
    });
    it("end url", function () {
      const url =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const expected = "otherThing";

      const actual = getParam(url, "other");

      expect(actual).to.equal(expected);
    });
    it("undefined param", function () {
      const url =
        "https://www.example.com/path?q=theIndex&tl=ja&other=otherThing";
      const expected = null;

      const actual = getParam(url, "missing");

      expect(actual).to.equal(expected);
    });
  });
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
