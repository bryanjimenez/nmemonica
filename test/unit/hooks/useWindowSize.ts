import { renderHook } from "@testing-library/react";
import { expect } from "chai";
import EventEmitter from "events";
import "jsdom-global/register";
import sinon from "sinon";
import * as theModule from "../../../src/helper/browserGlobal";
import { useWindowSize } from "../../../src/hooks/useWindowSize";

describe("useWindowSize", function () {
  describe("useWindowSize", function () {
    class MyMockWindow /*pretends to extends EventTarget*/ {
      constructor({ width, height }) {
        // super();
        this._width = width;
        this._height = height;
        this._eventEmitter = new EventEmitter();
      }

      get innerWidth() {
        return this._width;
      }
      get innerHeight() {
        return this._height;
      }

      addEventListener(type: string, callback: Function): void {
        if (type === "resize") {
          this._eventEmitter.on("resize", ({ width, height }) => {
            this._width = width;
            this._height = height;
            callback();
          });
        }
      }

      removeEventListener(/*type: string, callback: Function*/): void {
        // do nothing
      }

      /**
       * Simulate a window event
       */
      triggerA(type: string, value) {
        if (type === "resize") {
          this._eventEmitter.emit("resize", value);
        }
      }
    }

    it("gets window dimensions", function () {
      const w = new MyMockWindow({ width: 568, height: 320 });
      const fakeGetWindowDims = () => {
        return w;
      };

      const myStub = sinon
        .stub(theModule, "getWindow")
        .callsFake(fakeGetWindowDims);

      const { result, rerender } = renderHook(() => useWindowSize());

      expect(result.current, "initial render").to.deep.eq({
        width: 568,
        height: 320,
      });

      // simulate a window resize
      w.triggerA("resize", { width: 1368, height: 912 });
      rerender();

      expect(result.current, "after re-render").to.deep.eq({
        width: 1368,
        height: 912,
      });
      myStub.restore();
    });
  }); // useWindowSize
});
