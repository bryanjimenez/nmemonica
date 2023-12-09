//@ts-check
/**
 * This file is commonJS because rspack.config is also
 */
const os = require("os");
// import os from "os";
const fs = require("fs");
// import fs from "fs";
const path = require("path");
// import path from "path";
require("dotenv").config();
// import "dotenv/config";

const blue = "\x1b[34m";
const yellow = "\x1b[33m";
const reset = "\x1b[0m";

const projectRoot = path.resolve();

let hasSelfSignedCertificateAuthority = false;
if (
  fs.existsSync(projectRoot + "/" + process.env.PATH_KEY) &&
  fs.existsSync(projectRoot + "/" + process.env.PATH_KEY)
) {
  hasSelfSignedCertificateAuthority = true;
}

// Get OS's external facing ip
const n = os.networkInterfaces();
const hostname = os.hostname();
const ip = hasSelfSignedCertificateAuthority
  ? Object.values(n)
      .flat()
      //@ts-expect-error
      .find(({ family, internal }) => family === "IPv4" && !internal)
  : { address: "localhost" };

let host = null;
let prettyHostname = null;
switch (true) {
  case hostname.length > 0:
    host = hostname;
    prettyHostname = hostname.endsWith(".local")
      ? hostname
      : hostname + ".local";
    break;
  case ip?.address && ip?.address?.length > 0:
    console.log(yellow + "Couldn't get host Name" + reset);

    host = ip?.address;
    break;

  default:
    throw new Error("Couldn't get host IP");
}

console.log("host: " + blue + host + reset);

const lan = { address: ip?.address, hostname: prettyHostname };
/**
 * Self signed Certificate Authority is available
 */
// export const isSelfSignedCA = hasSelfSignedCertificateAuthority;
// export const lanIP = ip;

module.exports = {
  isSelfSignedCA: hasSelfSignedCertificateAuthority,
  lan,
  hostname,
  host,
};
