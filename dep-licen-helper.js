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

const licenceLinks = {
  MIT: "https://mit-license.org/",
  "BSD-3-Clause": "https://opensource.org/license/bsd-3-clause",
  "Apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  ISC: "https://www.isc.org/licenses/",
  Unlicense: "https://unlicense.org/",
  "UBUNTU-FONT-1.0": "https://canonical.com/legal/font-licence",

  // dual
  "(CC-BY-4.0 AND MIT)":
    "https://creativecommons.org/licenses/by/4.0/\nhttps://mit-license.org/",
  "(MIT AND BSD-3-Clause)":
    "https://mit-license.org/\nhttps://opensource.org/license/bsd-3-clause",
  "Apache-2.0 OR MIT":
    "https://www.apache.org/licenses/LICENSE-2.0\nhttps://mit-license.org/",

  // special
  "BSD-like": "", // not mentioned is required

  "": "LICENSE: MISSING!!!",
};

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

  const ubuntuMono = {
    name: "ubuntu-mono",
    version: "17/KFOjCneDtsqEr0keqCMhbCc6CsQ",
    author: "Dalton Maag",
    repository:
      "https://fonts.gstatic.com/s/ubuntumono/v17/KFOjCneDtsqEr0keqCMhbCc6CsQ.woff2",
    licenseName: "UBUNTU-FONT-1.0",
  };

  const voiceJaLicenseBundle = readFileSync(
    "./node_modules/@nmemonica/voice-ja/ThirdPartyNotice.json",
    { encoding: "utf8" },
  );
  const voiceEnLicenseBundle = readFileSync(
    "./node_modules/@nmemonica/voice-en/ThirdPartyNotice.json",
    { encoding: "utf8" },
  );

  const {
    duplicates: subProjectDuplicates,
    dependencies: subprojectDependencies,
  } = transformRustDepToNodeDep([
    ...JSON.parse(voiceEnLicenseBundle),
    ...JSON.parse(voiceJaLicenseBundle),
  ]);

  const projectLicenses = {
    dependencies: [
      ...lic.dependencies,
      reactSlickBlock,
      ubuntuMono,
      ...subprojectDependencies,
    ],
  };

  console.log("Project Dependencies:");
  displayTable(projectLicenses);

  if (subProjectDuplicates.length > 0) {
    const msg = "Duplicate dependencies found:";
    console.log(`\x1b[1m\x1b[97m\x1b[101m${msg}\x1b[0m`);
    displayTable({ dependencies: subProjectDuplicates });
  }

  return licenseJsonToString(projectLicenses);
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
    "================================================================================\n";
  const text = license.dependencies.reduce((acc, dep) => {
    const { name, version, author, repository, licenseName, licenseText } = dep;
    const licenceLink = licenceLinks[licenseName];

    if (licenceLink === undefined) {
      throw new Error(`Required link for ${name} ${licenseName}`);
    }

    const depLicenseChunk = `${s}- ${name} v${version} - ${author}\n- ${
      repository
    }\n${s}\n${licenseText ?? licenseName}\n${licenceLink}\n\n`;

    return acc + depLicenseChunk;
  }, "");

  return header + text;
}

/**
 * Displays license info
 * @param {{dependencies:DependencyBlock[]}} license
 */
function displayTable({ dependencies }) {
  console.table(
    dependencies
      // .sort((a, b) => a.name.charCodeAt(0) - b.name.charCodeAt(0))
      .sort((a, b) =>
        a.licenseName.length && b.licenseName.length > 0
          ? a.licenseName.charCodeAt(0) - b.licenseName.charCodeAt(0)
          : -1,
      )
      .map((l) => ({
        name: l.name,
        version: l.version,
        license:
          l.licenseName && l.licenseName.length > 0
            ? l.licenseName
            : "-------MISSING-------",
        author:
          l.author && l.author.length > 25
            ? l.author?.slice(0, 25) + "..."
            : l.author,
      })),
  );
}

/**
 * Transform incoming dep object
 * @param {DependencyBlock[]} arr
 */
function transformRustDepToNodeDep(arr) {
  let duplicates = [];

  const dependenciesl = Array.from(
    arr
      .reduce((acc, entry) => {
        const depEntry = {
          ...entry,
          author: entry.authors,
          licenseName: entry.license,
        };

        if (acc.has(entry.name)) {
          duplicates = [...duplicates, depEntry];
          return acc;
        }

        acc.set(entry.name, depEntry);

        return acc;
      }, new Map())
      .values(),
  );

  return { duplicates, dependencies: dependenciesl };
}
