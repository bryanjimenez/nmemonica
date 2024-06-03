import { expect } from "chai";
import { encrypt, decrypt } from "../../../src/helper/cryptoHelper";

describe("cryptoHelper", function () {
  describe("aes-192-cbc", function () {
    it("encrypt decrypt", function () {
      const algorithm = "aes-192-cbc";
      const key = "kkNIbueD0VlqU6HZ0Zk4dY60pTypBhOQ";
      const plainText = "super secret";

      const actualEncrypted = encrypt(algorithm, key, plainText);
      expect(actualEncrypted).include.keys(["iv", "encrypted"]);
      const { iv, encrypted } = actualEncrypted;
      expect(typeof iv).to.eq("string");
      expect(typeof encrypted).to.eq("string");

      const actualDecrypted = decrypt(
        algorithm,
        key,
        actualEncrypted.iv,
        actualEncrypted.encrypted
      );
      expect(actualDecrypted).to.eq(plainText);
    });
  });
});
