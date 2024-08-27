import * as fs from "node:fs";
import ts from "typescript";

// https://webpack.js.org/contribute/writing-a-plugin/

/**
 * Inject asset names into index.html
 * Inject meta tags
 *
 * @param {import('@rspack/core').Compiler} compiler
 */
export async function indexTagHelperPlugin(compiler) {
  const pluginName = "IndexTagHelperPlugin";
  compiler.hooks.thisCompilation.tap(
    pluginName,
    (/** @type {import('@rspack/core').Compilation} */ compilation) => {
      const RawSource = compiler.webpack.sources.RawSource;

      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
        },
        async () => {
          const isMain = new RegExp(/main.[a-z0-9]+.js/);
          const isMainCss = new RegExp(/main.[a-z0-9]+.css/);
          const assets = compilation.getAssets();

          const main = assets.find((a) => isMain.test(a.name));
          const mainCss = assets.find((a) => isMainCss.test(a.name));

          if (!main) {
            throw new Error("Missing main.js");
          }
          if (!mainCss) {
            throw new Error("Missing main.css");
          }

          const isProduction = process.env.NODE_ENV === "production";
          const envFileName = isProduction
            ? "./environment.production.ts"
            : "./environment.development.ts";
          const envFile = fs.readFileSync(envFileName, "utf8");

          const { outputText: envSource } = ts.transpileModule(envFile, {
            compilerOptions: { module: ts.ModuleKind.ESNext },
          });

          const dataUri = "data:text/javascript;charset=utf-8,";
          const { dataService, audioService } = await import(
            dataUri + encodeURIComponent(envSource)
          );

          const ContentSecurityPolicy = "<!--Content-Security-Policy-->";
          const ContentSecurityPolicyTag =
            `<meta http-equiv="Content-Security-Policy" content="default-src 'self' ` +
            dataService +
            `; script-src 'self'` +
            `; media-src ` +
            audioService +
            `; connect-src 'self' ` +
            dataService +
            " " +
            audioService +
            `; style-src 'self' 'unsafe-inline';" />`;

          // FIXME: remove unsafe-inline ^^^

          const StrictTransportSecurity = "<!--Strict-Transport-Security-->";
          const StrictTransportSecurityTag = `<meta http-equiv="Strict-Transport-Security" content="max-age=63072000; includeSubDomains; preload" />`;

          const XContentTypeOptions = "<!--X-Content-Type-Options-->";
          const XContentTypeOptionsTag = `<meta http-equiv="X-Content-Type-Options" content="nosniff" />`;

          const XFrameOptions = "<!--X-Frame-Options-->";
          const XFrameOptionsTag = `<meta http-equiv="X-Frame-Options" content="DENY" />`;

          const PreConnect = "<!--PreConnect-->";
          const PreConnectTag =
            `<link rel="preconnect" href="` + dataService + `">`;

          const dependencies = `
    <link href="${mainCss.name}" rel="stylesheet" />
    <script src="${main.name}" defer></script>
    <script src="sw.js" defer></script></head>`;

          const source = fs.readFileSync("./index.html", { encoding: "utf-8" });
          const srcIndexHtml = source
            .split(ContentSecurityPolicy)
            .join(ContentSecurityPolicyTag)
            .split(StrictTransportSecurity)
            .join(StrictTransportSecurityTag)
            .split(XContentTypeOptions)
            .join(XContentTypeOptionsTag)
            .split(XFrameOptions)
            .join(XFrameOptionsTag)
            .split(PreConnect)
            .join(PreConnectTag)
            .split("</head>")
            .join(dependencies);

          compilation.emitAsset("index.html", new RawSource(srcIndexHtml));
        }
      );
    }
  );
}
