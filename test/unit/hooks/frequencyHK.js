// @ts-check
import { renderHook } from "@testing-library/react";
import { expect } from "chai";
import "jsdom-global/register";
import { useFrequency } from "../../../src/hooks/frequencyHK";

/* global describe it */

describe("frequencyHK.js", function () {
  /** @type {import("../../../src/typings/raw").SpaceRepetitionMap} */
  const rep = {
    123: {
      d: "2020-01-01T01:01:01.001Z",
      vC: 1,
      difficulty: 1,
      nextReview: 1,

      f: undefined,
      rein: false,
      pron: undefined,

      tpPc: 1,
      tpAcc: 0.1,
      tpCAvg: 1.0,
    },
    456: {
      d: "2020-02-02T02:02:02.002Z",
      vC: 2,
      difficulty: 2,
      nextReview: 2,

      f: undefined,
      rein: true,
      pron: undefined,

      tpPc: 2,
      tpAcc: 0.2,
      tpCAvg: 2.0,
    },
  };
  describe("useFrequency", function () {
    describe("initial", function () {
      it("excluded", function () {
        const termList = [{ uid: "123", english: "word" }];

        const { result /*, rerender*/ } = renderHook(() =>
          useFrequency(rep, termList)
        );

        const reinforcedUidList = result.current;
        expect(reinforcedUidList).to.be.a("array");
        expect(reinforcedUidList).to.be.empty;
      });

      it("included", function () {
        const termList = [
          { uid: "123", english: "word" },
          { uid: "456", english: "phrase" },
        ];

        const { result /*, rerender*/ } = renderHook(() =>
          useFrequency(rep, termList)
        );

        const reinforcedUidList = result.current;
        expect(reinforcedUidList).to.be.a("array");
        expect(reinforcedUidList).to.include("456");
      });
    });
    describe("after rep update", function () {
      it("included", function () {
        const termList = [{ uid: "789", english: "word" }];

        const { result, rerender } = renderHook(
          ({ repetition, filteredTerms }) =>
            useFrequency(repetition, filteredTerms),
          {
            initialProps: {
              repetition: {},
              filteredTerms: /** @type {{uid:string}[]}*/ ([]),
            },
          }
        );

        rerender({ repetition: rep, filteredTerms: termList });

        const reinforcedUidListBefore = result.current;
        expect(reinforcedUidListBefore).to.be.a("array");
        expect(reinforcedUidListBefore).to.be.empty;

        const repUpdate = {
          ...rep,
          789: {
            d: "2023-03-03T03:03:03.003Z",
            vC: 3,
            difficulty: 3,
            nextReview: 3,

            f: undefined,
            rein: true,
            pron: undefined,

            tpPc: 3,
            tpAcc: 0.3,
            tpCAvg: 3.0,
          },
        };

        rerender({ repetition: repUpdate, filteredTerms: termList });

        const reinforcedUidListAfter = result.current;
        expect(reinforcedUidListAfter).to.be.a("array");
        expect(reinforcedUidListAfter).to.include("789");
      });
    });
    //   describe("increment", function () {
    //     it("willReinforce: true  => increment: false", function () {
    //       const setSelectedIndex = Sinon.fake();
    //       const { result } = renderHook(() =>
    //         useReinforceLogic(true, reinforcedTerm, totalTerms, setSelectedIndex)
    //       );

    //       act(() => {
    //         const [, setter] = result.current;
    //         setter((v) => v + 1);
    //       });

    //       const [reinforceValue, setter] = result.current;
    //       expect(reinforceValue).to.deep.eq(reinforcedTerm);
    //       expect(setter).to.be.a("function");

    //       expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(0);
    //     });

    //     it("willReinforce: false => increment: true", function () {
    //       const setSelectedIndex = Sinon.fake();
    //       const { result } = renderHook(() =>
    //         useReinforceLogic(false, reinforcedTerm, totalTerms, setSelectedIndex)
    //       );

    //       act(() => {
    //         const [, setter] = result.current;
    //         setter((v) => v + 1);
    //       });

    //       const [reinforceValue, setter] = result.current;
    //       expect(reinforceValue).to.deep.eq(undefined);
    //       expect(setter).to.be.a("function");

    //       expect(setSelectedIndex.callCount, "count").to.eq(1);
    //       expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(1);
    //     });
    //   });
    //   describe("decrement", function () {
    //     it("willReinforce: true  => decrement: true", function () {
    //       const setSelectedIndex = Sinon.fake();
    //       const { result } = renderHook(() =>
    //         useReinforceLogic(true, reinforcedTerm, totalTerms, setSelectedIndex)
    //       );

    //       act(() => {
    //         const [, setter] = result.current;
    //         setter((v) => v - 1);
    //       });

    //       const [reinforceValue, setter] = result.current;
    //       expect(reinforceValue).to.deep.eq(undefined);
    //       expect(setter).to.be.a("function");

    //       expect(setSelectedIndex.callCount, "count").to.eq(1);
    //       expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(9);
    //     });
    //     it("willReinforce: false => decrement: true", function () {
    //       const setSelectedIndex = Sinon.fake();
    //       const { result } = renderHook(() =>
    //         useReinforceLogic(false, reinforcedTerm, totalTerms, setSelectedIndex)
    //       );

    //       act(() => {
    //         const [, setter] = result.current;
    //         setter((v) => v - 1);
    //       });

    //       const [reinforceValue, setter] = result.current;
    //       expect(reinforceValue).to.deep.eq(undefined);
    //       expect(setter).to.be.a("function");

    //       expect(setSelectedIndex.callCount, "count").to.eq(1);
    //       expect(setSelectedIndex.args[0][0], "setSelectedIndex").to.eq(9);
    //     });
    //   });
  });
});
