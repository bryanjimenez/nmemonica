import "jsdom-global/register";
import { expect } from "chai";
import { render, screen } from "@testing-library/react";

import {
  choiceToHtml,
  oneFromList,
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
});
