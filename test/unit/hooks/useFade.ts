import { renderHook } from "@testing-library/react";
import { expect } from "chai";
import "jsdom-global/register";
import { useFade } from "../../../src/hooks/useFade";

describe("useFade", function () {
  describe("useFade", function () {
    const timeout = 50;
    let result;

    it("initial", function (done) {
      ({ result } = renderHook(() => useFade(timeout)));
      const [fade] = result.current;

      expect(fade, "fade initial").to.eq(false);

      setTimeout(() => {
        done();
      }, timeout);
    });

    it("after " + timeout + "ms timeout", function () {
      const [fadeAfter] = result.current;
      expect(fadeAfter, "after timeout").to.eq(true);
    });

    // it("after toggle", function () {
    //   const [fade] = result.current;

    //   expect(fade, "fade initial").to.eq(true);
    //   act(()=>{
    //     const [,setFade] = result.current;
    //     setFade()
    //   })

    //   const [afterToggle] = result.current;
    //   expect(afterToggle, "after toggle").to.eq(false);
    // })
  }); // useFade
});
