function writer(license) {
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

module.exports = writer;
