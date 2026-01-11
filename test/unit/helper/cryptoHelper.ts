import { expect } from "chai";
import {
  encryptAES192CBC,
  decryptAES192CBC,
  decryptAES256GCM,
  encryptAES256GCM,
} from "../../../src/helper/cryptoHelper";
import { KeyObject, subtle } from "crypto";

describe("cryptoHelper", function () {
  describe("aes-192-cbc", function () {
    it("encrypt decrypt", async function () {
      const algorithm = "aes-192-cbc";
      const key = await subtle.generateKey(
        {
          name: "AES-CBC",
          length: 192,
        },
        true,
        ["encrypt", "decrypt"]
      );
      const password = KeyObject.from(key).export().toString("base64");
      const plainText = "super secret";

      const actualEncrypted = encryptAES192CBC(algorithm, password, plainText);
      expect(actualEncrypted).include.keys(["iv", "encrypted"]);
      const { iv, encrypted } = actualEncrypted;
      expect(typeof iv).to.eq("string");
      expect(typeof encrypted).to.eq("string");

      const actualDecrypted = decryptAES192CBC(
        algorithm,
        password,
        actualEncrypted.iv,
        actualEncrypted.encrypted
      );
      expect(actualDecrypted).to.eq(plainText);
    });
  });
  describe("aes-256-gcm", function () {
    it("encrypt decrypt", async function () {
      const algorithm = "aes-256-gcm";
      const key = await subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );
      const password = KeyObject.from(key).export().toString("base64");
      const plainText = "super secret";

      const actualEncrypted = encryptAES256GCM(algorithm, password, plainText);
      expect(actualEncrypted).include.keys(["iv", "encrypted", "tag"]);
      const { iv, encrypted } = actualEncrypted;
      expect(typeof iv).to.eq("string");
      expect(typeof encrypted).to.eq("string");

      const actualDecrypted = decryptAES256GCM(
        algorithm,
        password,
        actualEncrypted.iv,
        actualEncrypted.tag,
        actualEncrypted.encrypted
      );
      expect(actualDecrypted).to.eq(plainText);
    });
  });
});
