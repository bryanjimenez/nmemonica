import * as fs from "fs";
import * as path from "path";
import {
  firebaseConfig,
  gCloudFn,
} from "../../environment.development";

const projectRoot = path.resolve();
const swPartialCode = projectRoot + "/index.html";
const swOutput = projectRoot + "/index.html";

const ContentSecurityPolicy = "<!--Content-Security-Policy-->";
const ContentSecurityPolicyTag =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'self' ` +
  firebaseConfig.databaseURL +
  `; media-src ` +
  gCloudFn +
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


fs.open(swPartialCode, "r", (err, fd_sw) => {
  if (err) {
    throw err;
  }

  fs.readFile(fd_sw, {}, (err, buff) => {
    if (err) {
      console.log("read failed");
      throw err;
    }

    var stream = fs.createWriteStream(swOutput, {
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
