import  ts from "typescript";
import fs from "node:fs"
import path from "node:path";
import glob from "glob";
import md5 from "md5";


const projectRoot = path.resolve();
const swFile = "sw.bundle.ts"
const outputDir = projectRoot + "/dist";


const filesToCache = glob
  .sync(`${outputDir}/*.{html,js,css,jpeg,png,ico,webmanifest}`, {
    nodir: true,
  })
  .reduce<string[]>((acc, p) => {
    const fileName = p.split("/").pop() || p;
    return fileName !== "sw.js" ? [...acc, fileName] : acc;
  }, []);


const cwd = path.dirname(import.meta.url).slice("file://".length)
const filePath = path.resolve(projectRoot+"/pwa/src/sw.bundle.ts");
const source=fs.readFileSync(filePath, {encoding:'utf-8'})
// const source = "let x: string  = 'string'";


// const result = ts.createSourceFile("test.ts",source,ts.ScriptTarget.Latest)
// let result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS }});

// console.log(result.outputText);
const bundle = fs.createWriteStream(path.resolve(projectRoot+"/pwa/dist/sw.bundle.ts"),{encoding:'utf-8'})

const swVersion = md5(source).slice(0, 8);
const main =
  filesToCache.find((f) => f.match(new RegExp(/main.([a-z0-9]+).js/))) ||
  "main.00000000.js";
const [, jsVersion] = main.split(".");
const initCacheVer = md5(filesToCache.toString()).slice(0, 8);


bundle.write("const cacheFiles = " + JSON.stringify(filesToCache) + ";\n")
bundle.write("const swVersion = " + JSON.stringify(swVersion) + ";\n")
bundle.write("const initCacheVer = " + JSON.stringify(initCacheVer) + ";\n\n")
bundle.write(source)