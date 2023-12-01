//@ts-check
/**
 * This file is commonJS because rspack.config is also
 */
const os = require("os")
// import os from "os";
const fs = require("fs");
// import fs from "fs";
const path = require("path");
// import path from "path";
require("dotenv").config()
// import "dotenv/config";

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
const ip = hasSelfSignedCertificateAuthority
  ? Object.values(n)
      .flat()
      //@ts-expect-error
      .find(({ family, internal }) => family === "IPv4" && !internal)
  : { address: "localhost" };

/**
 * Self signed Certificate Authority is available
 */
// export const isSelfSignedCA = hasSelfSignedCertificateAuthority;
// export const lanIP = ip;

module.exports = {
  isSelfSignedCA: hasSelfSignedCertificateAuthority,
  lanIP: ip
}
