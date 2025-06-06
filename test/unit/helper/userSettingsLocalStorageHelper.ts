import "jsdom-global/register"
import { expect } from "chai";
import sinon from "sinon";
import {
  getLocalStorageUserSettings,
  setLocalStorageUserSettings,
  localStoreUserSettingAttrUpdate,
} from "../../../src/helper/userSettingsLocalStorageHelper";

import * as theModule from "../../../src/helper/browserGlobal";

type DescribableFn = {
  data?: { usersettings: string };
  (): {
    localStorage: {
      setItem: (key: any, val: any) => void;
      getItem: (key: any) => any;
    };
  };
};
describe("localStorage", function () {
  let myStub;

  const lsMock: DescribableFn = function mockLS() {
    if (typeof mockLS.data === "undefined") {
      mockLS.data = { };
    }

    return {
      localStorage: {
        setItem: (key, val) => {
          mockLS.data[key] = val;
        },
        getItem: (key) => mockLS.data[key],
      },
    };
  };

  beforeEach(() => {
    myStub = sinon.stub(theModule, "getWindow").callsFake(lsMock);
  });

  afterEach(() => {
    myStub.restore();
    lsMock.data = undefined;
  });

  describe("setLocalStorageUserSettings", function () {
    it("setLocalStorageUserSettings", function () {
      const expected = { global: {darkMode: true, swipeThreshold: 1} };
      setLocalStorageUserSettings(expected);
      // setLocalStorageUserSettings does not return value
      const r = getLocalStorageUserSettings();
      expect(r).to.deep.eq(expected);
    });

    it("setLocalStorageUserSettings (unsupported)", function () {
      // Window API: localStorage no supported
      // myStub.restore()
      // myStub = sinon.stub(theModule, "getWindow").callsFake(()=>({}));

      // return setLocalStorageUserSettings(, 'someValue').catch((e) => {
      //   expect(e)
      //     .be.an("error")
      //     .with.property("message", "Cannot read properties of undefined (reading 'setItem')");
      // });
      this.skip();
    });
  });

  describe("getLocalStorageUserSettings", function () {
    it("valid data", function () {
      const expected = { global: {darkMode: true, swipeThreshold: 1} };


      // preload with expected value
      lsMock().localStorage.setItem("global",JSON.stringify(expected.global));

      const r = getLocalStorageUserSettings();
      expect(r).to.deep.eq(expected);
    });

    it("empty localStorage value", function () {
      const expected = {};

      const r = getLocalStorageUserSettings();
      expect(r).to.deep.eq(expected);
    });
  });

  describe("localStoreUserSettingAttrUpdate", function () {
    it("set", function () {
      const initialState = { a: { hint: true } };
      const time = new Date();
      const path = "/a/";
      const attr = "choices";
      const value = 8;
      const expected = { a: { choices: 8 } };

      const r = localStoreUserSettingAttrUpdate(
        initialState,
        path,
        attr,
        value
      );
      expect(r).to.deep.equal(expected.a.choices);
    });

    it("toggle", function () {
      const initialState = { a: { hint: true } };
      const time = new Date();
      const path = "/a/";
      const attr = "hint";
      const expected = { a: { hint: false } };

      const r = localStoreUserSettingAttrUpdate(initialState, path, attr);
      expect(r).to.deep.equal(expected.a.hint);
    });

    it("toggle multiple", function () {
      const initialState = { a: { hint: true }, b: { order: true } };
      const time = new Date();

      const expected1 = {
        a: { hint: false },
      };

      const expected2 = {
        a: { hint: false },
        b: { order: false },
      };

      const r1 = localStoreUserSettingAttrUpdate(initialState, "/a/", "hint");
      expect(r1).to.deep.equal(expected1.a.hint);

      const r2 = localStoreUserSettingAttrUpdate(initialState, "/b/", "order");
      expect(r2).to.deep.equal(expected2.b.order);
    });
  });
});
