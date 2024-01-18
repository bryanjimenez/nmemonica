import fs from "fs";
import path from "path";
import {
  firebaseConfig,
  gCloudFn,
} from "../../environment.development.js";

/**
 * Add HTTP Security tags to index.html
 * <!--Content-Security-Policy-->   https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * <!--Strict-Transport-Security--> https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
 * <!--X-Content-Type-Options-->    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
 * <!--X-Frame-Options-->           https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
 * X XSS Protection   [Not Added]   https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
 * <!--PreConnect-->                https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect
 */

const projectRoot = path.resolve();
const indexDevelopment = projectRoot + "/index.html";
const indexProduction = projectRoot + "/index.production.html";

const ContentSecurityPolicy = "<!--Content-Security-Policy-->";
const ContentSecurityPolicyTag =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'self' ` +
  firebaseConfig.databaseURL +
  `; script-src 'self'` +
  `; media-src ` +
  gCloudFn +
  `; connect-src 'self' `+
  firebaseConfig.databaseURL+" "+ gCloudFn +
  `; style-src 'self' 'unsafe-inline';" />`;

// FIXME: remove unsafe-inline ^^^

const StrictTransportSecurity = "<!--Strict-Transport-Security-->";
const StrictTransportSecurityTag = `<meta http-equiv="Strict-Transport-Security" content="max-age=63072000; includeSubDomains; preload" />`;

const XContentTypeOptions = "<!--X-Content-Type-Options-->";
const XContentTypeOptionsTag = `<meta http-equiv="X-Content-Type-Options" content="nosniff" />`;

const XFrameOptions = "<!--X-Frame-Options-->";
const XFrameOptionsTag = `<meta http-equiv="X-Frame-Options" content="DENY" />`;

const PreConnect = "<!--PreConnect-->";
const PreConnectTag =`<link rel="preconnect" href="`+firebaseConfig.databaseURL+`">`


fs.open(indexDevelopment, "r", (err, fd_sw) => {
  if (err) {
    throw err;
  }

  fs.readFile(fd_sw, {}, (err, buff) => {
    if (err) {
      console.log("read failed");
      throw err;
    }

    const stream = fs.createWriteStream(indexProduction, {
      flags: "w",
    });

    const code = buff.toString();

    const newCode = code
      .split(ContentSecurityPolicy)
      .join(ContentSecurityPolicyTag)
      .split(StrictTransportSecurity)
      .join(StrictTransportSecurityTag)
      .split(XContentTypeOptions)
      .join(XContentTypeOptionsTag)
      .split(XFrameOptions)
      .join(XFrameOptionsTag)
      .split(PreConnect)
      .join(PreConnectTag);


    const newBuff = Buffer.from(newCode, "utf-8");
    stream.write(newBuff);

    stream.end();
  });
});
