import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Borrowed from MDN serviceworker cookbook
 * @link https://github.com/mdn/serviceworker-cookbook/blob/master/tools.js
 */
export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = Buffer.from(base64, "base64");
  let outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    const d = rawData.at(i);
    if (d !== undefined) {
      outputArray[i] = d;
    }
  }

  return outputArray;
}

export function generateAES192CBCKey() {
  return Buffer.from(randomBytes(24)).toString("base64");
}

export function generateAES256GCMKey() {
  return Buffer.from(randomBytes(32)).toString("base64");
}
export const AES256GCMStringKeyLength = 44;

/**
 * Encrypt
 * @param algorithm
 * @param password urlBase64 string
 * @param plainText
 */
export function encryptAES256GCM(
  algorithm: "aes-256-gcm",
  password: string,
  plainText: string
) {
  const key = urlBase64ToUint8Array(password);

  const iv = Buffer.from(randomBytes(12));
  const cipher = createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");

  return {
    encrypted,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

/**
 * Decrypt
 * @param algorithm
 * @param key urlBase64 string
 * @param iv urlBase64 string
 * @param encryptedText base64 string
 * @param authTag base64 string
 */
export function decryptAES256GCM(
  algorithm: "aes-256-gcm",
  key: string,
  iv: string,
  authTag: string,
  encryptedText: string
) {
  const keyUint8Arr = urlBase64ToUint8Array(key);
  const ivUint8Arr = urlBase64ToUint8Array(iv);
  const tagUint8Arr = urlBase64ToUint8Array(authTag);
  const decipher = createDecipheriv(algorithm, keyUint8Arr, ivUint8Arr);
  decipher.setAuthTag(tagUint8Arr);

  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Encrypt
 * @param algorithm
 * @param password urlBase64 string
 * @param plainText
 */
export function encryptAES192CBC(
  algorithm: "aes-192-cbc",
  password: string,
  plainText: string
) {
  const key = urlBase64ToUint8Array(password);
  // see: https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81
  const iv = Buffer.from(randomBytes(16));
  const cipher = createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  return { encrypted, iv: iv.toString("base64") };
}

/**
 * Decrypt
 * @param algorithm
 * @param key urlBase64 string
 * @param iv urlBase64 string
 * @param encryptedText hex string
 */
export function decryptAES192CBC(
  algorithm: "aes-192-cbc",
  key: string,
  iv: string,
  encryptedText: string
) {
  const keyUint8Arr = urlBase64ToUint8Array(key);
  const ivUint8Arr = urlBase64ToUint8Array(iv);
  const decipher = createDecipheriv(algorithm, keyUint8Arr, ivUint8Arr);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
