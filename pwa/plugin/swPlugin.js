//@ts-check
import /* type */ {Compiler, Compilation} from "@rspack/core";
import md5 from "md5";

// https://webpack.js.org/contribute/writing-a-plugin/


/**
 * Inject asset names into service worker source  
 * (for caching)  
 * at build time
 * 
 * @param {Compiler} compiler
 */
export function serviceWorkerCacheHelperPlugin(compiler) {
  const pluginName = "ServiceWorkerCacheHelperPlugin";
  compiler.hooks.thisCompilation.tap(
    pluginName,
    (/** @type {Compilation} */ compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
        },
        async () => {
          const isSW = new RegExp(/sw.[a-z0-9]+.js/);
          const isMain = new RegExp(/main.[a-z0-9]+.js/);
          const assets = compilation.getAssets();
          const main = assets.find((a) => isMain.test(a.name));
          const sw = assets.find((a) => isSW.test(a.name));

          if(!main){
            throw new Error("Missing main.js")
          }
          if(!sw || !sw.source){
            throw new Error("Missing sw.js")
          }

          const source = sw.source.source().toString();

          const assetNames = assets.map((a) => a.name);
          // console.log("assets "+assetNames)
          const filesToCache = assetNames.filter((f) => {
            return (
              !isSW.test(f) &&
              !f.endsWith(".hot-update.js") &&
              (f.endsWith(".html") ||
                f.endsWith(".js") ||
                f.endsWith(".css") ||
                f.endsWith(".jpeg") ||
                f.endsWith(".png") ||
                f.endsWith(".ico") ||
                f.endsWith(".webmanifest"))
            );
          });

          const [_sw, swVersion, _swExt] = sw?.name.split(".");
          const [_main, mainVersion, _mainExt] = main?.name.split(".");
          const bundleVersion = md5(filesToCache.toString()).slice(0, 8);

          const mod = source
            .replace(
              "process.env.SW_CACHE_FILES",
              `${JSON.stringify(filesToCache)}`
            )
            .replace("process.env.SW_VERSION", `"${swVersion}"`)
            .replace("process.env.SW_MAIN_VERSION", `"${mainVersion}"`)
            .replace("process.env.SW_BUNDLE_VERSION", `"${bundleVersion}"`);

          if (
            !main?.name.endsWith(".hot-update.js") &&
            !sw?.name.endsWith(".hot-update.js")
          ) {
            compilation.emitAsset(
              "sw.js",
              new compiler.webpack.sources.RawSource(mod)
            );
          }
        }
      );
    }
  );
}
