import { expect } from "chai";
import {
  encryptAES192CBC,
  decryptAES192CBC,
  decryptAES256GCM,
  encryptAES256GCM,
} from "../../../src/helper/cryptoHelper";

describe("cryptoHelper", function () {
  describe("aes-192-cbc", function () {
    it("encrypt decrypt", function () {
      const algorithm = "aes-192-cbc";
      const key = "kkNIbueD0VlqU6HZ0Zk4dY60pTypBhOQ";
      const plainText = "super secret";

      const actualEncrypted = encryptAES192CBC(algorithm, key, plainText);
      expect(actualEncrypted).include.keys(["iv", "encrypted"]);
      const { iv, encrypted } = actualEncrypted;
      expect(typeof iv).to.eq("string");
      expect(typeof encrypted).to.eq("string");

      const actualDecrypted = decryptAES192CBC(
        algorithm,
        key,
        actualEncrypted.iv,
        actualEncrypted.encrypted
      );
      expect(actualDecrypted).to.eq(plainText);
    });
  });
  describe("aes-256-gcm", function () {
    it("encrypt decrypt", function () {
      const algorithm = "aes-256-gcm";
      // const key = Buffer.from(randomBytes(32)).toString("base64");
      const key = "dJGFClbJOmluFe7z/SAAv4o1fhDnSqOUUzIH0bjrMG8=";

      const plainText = "super secret";

      const actualEncrypted = encryptAES256GCM(algorithm, key, plainText);
      expect(actualEncrypted).include.keys(["iv", "encrypted", "tag"]);
      const { iv, encrypted } = actualEncrypted;
      expect(typeof iv).to.eq("string");
      expect(typeof encrypted).to.eq("string");

      const actualDecrypted = decryptAES256GCM(
        algorithm,
        key,
        actualEncrypted.iv,
        actualEncrypted.tag,
        actualEncrypted.encrypted
      );
      expect(actualDecrypted).to.eq(plainText);
    });
  });
});
