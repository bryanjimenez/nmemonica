import lineByLine from "n-readlines";
import { readFileSync } from "node:fs";
/**
 * LicenseCheckerWebpackPlugin.outputWriter implementation
 */

/**
 * @typedef {Object} DependencyBlock
 * @property {string} name
 * @property {string} version
 * @property {string} author
 * @property {string} repository
 * @property {string} licenseName
 * @property {string} licenseText
 *
 */
/*
interface DependencyBlock {
    name: string;
    version: string;
    author: string;
    repository: string;
    licenseName: string;
    licenseText: string;
}
*/
/**
 * Append additional licenses
 * @param {{dependencies: DependencyBlock[]}} lic
 */
export function appendLicense(lic /*:{dependencies:DependencyBlock[]}*/) {
  const reactSlickBlock = {
    name: "react-slick",
    version: "0.29.0",
    author: "2014 Kiran Abburi",
    repository: "https://github.com/akiran/react-slick",
    licenseName: "MIT",
    licenseText: fromComment("./src/helper/TouchSwipe.ts"),
  };

  const base64ToUint8ArrayFromServiceWorkerCookbook = {
    name: "serviceworker-cookbook",
    version: "0.1.0",
    author: "Harald Kirschner <npm@digitarald.com> (http://digitarald.de/)",
    repository: "https://github.com/mdn/serviceworker-cookbook",
    licenseName: "MIT",
    licenseText: fromComment("./src/helper/cryptoHelperTools.ts"),
  };

  const hts_voice_nitech_jp_atr503_m001_1_05_lic = readFileSync(
    "./res/models/hts_voice_nitech_jp_atr503_m001-1.05/COPYING",
    { encoding: "utf-8" }
  );
  const hts_voice_nitech_jp_atr503_m001_1_05 = {
    name: "hts_voice_nitech_jp_atr503_m001-1.05",
    version: "1.05",
    author: "HTS Working Group",
    repository: "http://open-jtalk.sourceforge.net/",
    licenseName: "CC-BY-3.0",
    licenseText: hts_voice_nitech_jp_atr503_m001_1_05_lic,
  };

  const tohoku_f01_lic = readFileSync("./res/models/tohoku-f01/COPYRIGHT.txt", {
    encoding: "utf-8",
  });
  const htsvoice_tohoku_f01 = {
    name: "htsvoice-tohoku-f01",
    version: "8e33060",
    author:
      "2015 Intelligent Communication Network (Ito-Nose) Laboratory, Tohoku University",
    repository: "https://github.com/icn-lab/htsvoice-tohoku-f01",
    licenseName: "CC-BY-4.0",
    licenseText: tohoku_f01_lic,
  };

  const appended = {
    dependencies: [
      ...lic.dependencies,
      reactSlickBlock,
      base64ToUint8ArrayFromServiceWorkerCookbook,
      hts_voice_nitech_jp_atr503_m001_1_05,
      htsvoice_tohoku_f01,
    ],
  };

  return licenseJsonToString(appended);
}

/**
 * Get individual license text from comment in a source file
 * License text is expected to be the header
 * @param {string} filePath
 */
function fromComment(/** @type string */ filePath /*:string*/) {
  const l = new lineByLine(filePath);
  let line2;
  let lineNumber = 0;

  let reactSlickCodeLicense = "";
  let header /*:null|boolean*/ = null;

  while ((line2 = l.next())) {
    const line = line2.toString("utf-8");
    lineNumber++;

    if (header === null && line.startsWith("/**")) {
      header = true;
    }

    if (header === true) {
      const space = line.startsWith(" * ") ? 3 : line === " *" ? 2 : 0;
      if (space > 0) {
        reactSlickCodeLicense += line.slice(space) + "\n";
      } else if (reactSlickCodeLicense.length > 0) {
        header = false;
        l.close();
      }
    } else if (header === null) {
      throw new Error("Expected Software License");
    }
  }

  return reactSlickCodeLicense;
}

/**
 * Creates finalized license text
 * @param {{dependencies:DependencyBlock[]}} license
 */
function licenseJsonToString(license /*:{dependencies:DependencyBlock[]}*/) {
  const header =
    "THIRD PARTY SOFTWARE NOTICES AND INFORMATION\n" +
    "Do Not Translate or Localize\n" +
    "\n";
  const s =
    "--------------------------------------------------------------------------------\n";

  const text = license.dependencies.reduce((acc, dep) => {
    const depLicenseChunk = `${s}${dep.name} v${dep.version} - ${dep.author}\n${
      dep.repository
    }\n${s}\n${dep.licenseText || dep.licenseName}\n`;

    return acc + depLicenseChunk;
  }, "");

  return header + text;
}
