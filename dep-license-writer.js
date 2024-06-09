import lineByLine from "n-readlines";
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

  const appended = { dependencies: [...lic.dependencies, reactSlickBlock] };

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
