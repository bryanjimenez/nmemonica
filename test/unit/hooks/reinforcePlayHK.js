// @ts-check
import { act, renderHook } from "@testing-library/react";
import { expect } from "chai";
import "jsdom-global/register";
import Sinon from "sinon";
import { useReinforcePlay } from "../../../src/hooks/reinforcePlayHK";

/* global describe it */

describe("reinforcePlayHK.js", function () {
  describe("useReinforcePlay", function () {
    const reinforcedTerm = { uid: "6", english: "test" };
    const totalTerms = 10;
    describe("initial", function () {
      it("on first call return [undefined, function]", function () {
        const setSelectedIndex = Sinon.fake();

        const { result /*, rerender*/ } = renderHook(() =>
          useReinforcePlay(false, reinforcedTerm, totalTerms, () => {})
        );

        const [reinforceValue, setter] = result.current;
        expect(reinforceValue).to.be.undefined;
        expect(setter).to.be.a("function");

        expect(setSelectedIndex.callCount, "count").to.eq(0);
      });
    });
    describe("increment", function () {
      it("willReinforce: true  => increment: false", function () {
        const setSelectedIndex = Sinon.fake();
        const { result } = renderHook(() =>
          useReinforcePlay(true, reinforcedTerm, totalTerms, setSelectedIndex)
        );

        act(() => {
          const [, setter] = result.current;
          setter((v) => v + 1);
        });

        const [reinforceValue, setter] = result.current;
        expect(reinforceValue).to.deep.eq(reinforcedTerm);
        expect(setter).to.be.a("function");

        expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(0);
      });

      it("willReinforce: false => increment: true", function () {
        const setSelectedIndex = Sinon.fake();
        const { result } = renderHook(() =>
          useReinforcePlay(false, reinforcedTerm, totalTerms, setSelectedIndex)
        );

        act(() => {
          const [, setter] = result.current;
          setter((v) => v + 1);
        });

        const [reinforceValue, setter] = result.current;
        expect(reinforceValue).to.deep.eq(undefined);
        expect(setter).to.be.a("function");

        expect(setSelectedIndex.callCount, "count").to.eq(1);
        expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(1);
      });
    });
    describe("decrement", function () {
      it("willReinforce: true  => decrement: true", function () {
        const setSelectedIndex = Sinon.fake();
        const { result } = renderHook(() =>
          useReinforcePlay(true, reinforcedTerm, totalTerms, setSelectedIndex)
        );

        act(() => {
          const [, setter] = result.current;
          setter((v) => v - 1);
        });

        const [reinforceValue, setter] = result.current;
        expect(reinforceValue).to.deep.eq(undefined);
        expect(setter).to.be.a("function");

        expect(setSelectedIndex.callCount, "count").to.eq(1);
        expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(9);
      });
      it("willReinforce: false => decrement: true", function () {
        const setSelectedIndex = Sinon.fake();
        const { result } = renderHook(() =>
          useReinforcePlay(false, reinforcedTerm, totalTerms, setSelectedIndex)
        );

        act(() => {
          const [, setter] = result.current;
          setter((v) => v - 1);
        });

        const [reinforceValue, setter] = result.current;
        expect(reinforceValue).to.deep.eq(undefined);
        expect(setter).to.be.a("function");

        expect(setSelectedIndex.callCount, "count").to.eq(1);
        expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(9);
      });
    });
  });
});
