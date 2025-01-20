//@ts-check
// https://rspack.org/api/loader-api.html

const { readFileSync } = require("node:fs");
const path = require("node:path");

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";

/**
 * When in PRODUCTION
 * Replace all source imports from .development to .production
 * @param {string} content file contents
 */
module.exports = function productionDependencyReplacement(content, map, meta) {
  if (
    this.resourcePath.includes("node_modules") ||
    this.mode !== "production"
  ) {
    return content;
  }

  const envDependencies = getRequestQueryDetail(content);

  if (envDependencies.length > 0) {
    const thisResourcePath = this.resourcePath
      .replaceAll('"', "")
      .replaceAll("'", "");
    console.log(`\npath: ${JSON.stringify(thisResourcePath)}`);

    const prodContent = envDependencies.reduce((acc, d) => {
      const dev = d.path;
      const prod = dev.replace(".development", ".production");
      // FIXME: assuming .ts file
      const ext = ".ts";

      const a = path.dirname(thisResourcePath);
      const prodAbsPath = path.normalize(a + path.sep + prod) + ext;
      const prodFile = readFileSync(prodAbsPath, "utf-8");

      if (d.name.every((devDep) => prodFile.includes(devDep))) {
        // prod file contains all dev names
        console.log(`  ${green}${d.name}${reset} from ${green}${dev}${reset}`);

        return acc.replace(dev, prod);
      } else {
        // warn and keep development dependency
        console.log(
          `  ${red}${d.name}${reset} missing in ${red}${prod}${reset}`
        );
        return acc;
      }
    }, content);

    return prodContent;
  }

  return content;
};

/**
 * @returs A list of resources imported from .development files
 * @param {string} content
 */
function getRequestQueryDetail(content) {
  const pathReg = /[\/\.\w]+?(?=\.development)/g;
  const nameReg = /import (.*) from .*[\/\.\w]+?(?=\.development)/g;
  const paths = content.match(pathReg);

  if (paths === null) {
    return [];
  }

  const names = [...content.matchAll(nameReg)].map((r) => r[1]);
  const resources = names.map((r) =>
    r.replaceAll("{", "").replaceAll("}", "").replaceAll(" ", "").split(",")
  );

  const result = paths.map((q, i) => ({
    name: resources[i],
    path: `${q}.development`,
  }));

  return result;
}
