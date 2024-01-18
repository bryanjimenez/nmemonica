import { expect } from "chai";
import sinon from "sinon";
import {
  buildAction,
  setStateFunction,
} from "../../../src/helper/eventHandlerHelper";

describe("eventHandlerHelper", function () {
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
