import { renderHook } from "@testing-library/react";
import { expect } from "chai";
import EventEmitter from "events";
import "jsdom-global/register";
import sinon from "sinon";
import * as theModule from "../../../src/helper/browserGlobal";
import {
  buildAction,
  setStateFunction,
  useWindowSize,
} from "../../../src/hooks/helperHK.js";

describe("helperHK", function () {
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

  describe("buildAction", function () {
    it("without value", function () {
      const dispatch = sinon.fake();
      const action = sinon.fake();

      const eventHandler = buildAction(dispatch, action);

      eventHandler();

      expect(dispatch.callCount, "dispatch").to.eq(1);
      expect(action.callCount, "action").to.eq(1);
      expect(action.calledWith()).to.be.true;
    });
    it("value from parent", function () {
      const value = "parent value";
      const dispatch = sinon.fake();
      const action = sinon.fake();

      const eventHandler = buildAction(dispatch, action, value);

      eventHandler();

      expect(dispatch.callCount, "dispatch").to.eq(1);
      expect(action.callCount, "action").to.eq(1);
      expect(action.calledWith(value)).to.be.true;
    });
    it("value from eventHandler", function () {
      const value = "child value";
      const dispatch = sinon.fake();
      const action = sinon.fake();

      const eventHandler = buildAction(dispatch, action);

      eventHandler(value);

      expect(dispatch.callCount, "dispatch").to.eq(1);
      expect(action.callCount, "action").to.eq(1);
      expect(action.calledWith(value)).to.be.true;
    });
    it("value from reactObject (event)", function () {
      const value = { _reactName: "fake react object" };
      const dispatch = sinon.fake();
      const action = sinon.fake();

      const eventHandler = buildAction(dispatch, action);

      eventHandler(value);

      expect(dispatch.callCount, "dispatch").to.eq(1);
      expect(action.callCount, "action").to.eq(1);
      expect(action.calledWith()).to.be.true;
    });
  });
  describe("setStateFunction", function () {
    it("a value", function () {
      const stateValue = "a random value";
      const updateFunction = sinon.fake();

      const eventHandlder = setStateFunction(updateFunction, stateValue);
      const returnVal = eventHandlder();

      expect(returnVal, "handler is void").to.be.undefined;
      expect(updateFunction.callCount, "updateFunction").to.eq(1);
      expect(updateFunction.calledWith(stateValue), "updateFunction argument")
        .to.be.true;
    });
    it("a function", function () {
      const stateValue = () => "a random value";
      const updateFunction = sinon.fake();

      const eventHandlder = setStateFunction(updateFunction, stateValue);
      const returnVal = eventHandlder();

      expect(returnVal, "handler is void").to.be.undefined;
      expect(updateFunction.callCount, "updateFunction").to.eq(1);
      expect(updateFunction.calledWith(stateValue), "updateFunction argument")
        .to.be.true;
    });
    it("ignore event handler value", function () {
      const stateValue = () => "a random value";
      const eventHandlerVal = "fake event";
      const updateFunction = sinon.fake();

      const eventHandlder = setStateFunction(updateFunction, stateValue);
      const returnVal = eventHandlder();

      expect(returnVal, "handler is void").to.be.undefined;
      expect(updateFunction.callCount, "updateFunction").to.eq(1);
      expect(
        updateFunction.calledWith(eventHandlerVal),
        "eventHandler argument"
      ).to.be.false;
      expect(updateFunction.calledWith(stateValue), "updateFunction argument")
        .to.be.true;
    });
  });
});
