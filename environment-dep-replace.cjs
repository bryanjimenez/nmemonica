//@ts-check
// https://rspack.org/api/loader-api.html
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

  // console.log("context: "+JSON.stringify(this.context))
  // console.log("options: "+JSON.stringify(this.getOptions()))
  // console.log("mode: "+JSON.stringify(this.mode))
  // console.log("path: "+JSON.stringify(this.resourcePath));
  // console.log("reso: "+JSON.stringify(this.resource));

  const hasDevDep = /[\/\.\w]+?(?=\.development)/g;
  const match = [...content.matchAll(hasDevDep)];

  // console.log(JSON.stringify(match))
  if (match.length > 0) {
    console.log(`\npath: ${JSON.stringify(this.resourcePath)}`);
    const prodContent = match.reduce((acc, m) => {
      const [matchText] = m;
      const dep = `${matchText}.development`;
      console.log(`dep: ${dep}`);

      return acc.replace(dep, `${matchText}.production`);
    }, content);

    // console.log(`\n\n${c.slice(0,700)}`);
    return prodContent;
  }

  return content;
};
