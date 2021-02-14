import { expect } from "chai";
import sinon, { stub } from "sinon";
import {
  getLocalStorageSettings,
  setLocalStorage,
  localStoreAttrUpdate,
} from "../../../src/helper/localStorage";

import * as theModule from "../../../src/helper/browserGlobal";

describe("localStorage", function () {
  let myStub;
  const userSettingsKey = "doesntmatter";

  const lsMock = function mockLS() {
    if (typeof mockLS.data == "undefined") {
      mockLS.data = { userSettings: null };
    }

    return {
      setItem: (key, val) => {
        mockLS.data.userSettings = val;
      },
      getItem: (key) => mockLS.data.userSettings,
    };
  };

  beforeEach(() => {
    myStub = sinon.stub(theModule, "getWindowLocalStorage").callsFake(lsMock);
  });

  afterEach(() => {
    myStub.restore();
    lsMock.data = undefined;
  });

  describe("setLocalStorage", function () {
    it("setLocalStorage", function () {
      const expected = { a: 1, b: 2 };
      return setLocalStorage(userSettingsKey, expected).then((r) => {
        expect(r).to.deep.eq({ a: 1, b: 2 });
      });
    });
  });

  describe("getLocalStorageSettings", function () {
    it("valid data", function () {
      const expected = { a: 1, b: 2 };

      // preload with expected value
      lsMock().setItem(userSettingsKey, JSON.stringify(expected));

      return getLocalStorageSettings(userSettingsKey).then((r) => {
        expect(r).to.deep.eq(expected);
      });
    });

    it("empty localStorage value", function () {
      const expected = undefined;

      return getLocalStorageSettings(userSettingsKey).then((r) => {
        expect(r).to.deep.eq(expected);
      });
    });

    it("catch from reading invalid data", function () {
      return getLocalStorageSettings(userSettingsKey).catch((e) => {
        expect(e)
          .be.an("error")
          .with.property("message", "Unexpected token / in JSON at position 0");
      });
    });
  });

  describe("localStoreAttrUpdate", function () {
    it("set", function () {
      const getStateMock = () => ({ settings: { a: { hint: true } } });
      const time = new Date();
      const path = "/a/";
      const attr = "choices";
      const value = 8;
      const expected = { a: { choices: 8 }, lastModified: time };

      return localStoreAttrUpdate(time, getStateMock, path, attr, value).then(
        (r) => {
          expect(r).to.deep.equal(expected);
        }
      );
    });

    it("toggle", function () {
      const getStateMock = () => ({ settings: { a: { hint: true } } });
      const time = new Date();
      const path = "/a/";
      const attr = "hint";
      const expected = { a: { hint: false }, lastModified: time };

      return localStoreAttrUpdate(time, getStateMock, path, attr).then((r) => {
        expect(r).to.deep.equal(expected);
      });
    });

    it("toggle multiple", function () {
      const getStateMock = () => ({
        settings: { a: { hint: true }, b: { order: true } },
      });
      const time = new Date();

      const expected1 = {
        a: { hint: false },
        lastModified: time,
      };

      const expected2 = {
        a: { hint: false },
        b: { order: false },
        lastModified: time,
      };

      return localStoreAttrUpdate(time, getStateMock, "/a/", "hint").then(
        (r1) => {
          expect(r1).to.deep.equal(expected1);

          return localStoreAttrUpdate(time, getStateMock, "/b/", "order").then(
            (r2) => {
              expect(r2).to.deep.equal(expected2);
            }
          );
        }
      );
    });
  });
});
