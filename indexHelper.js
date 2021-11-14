import fs from "fs";
import path from "path";
import {
  firebaseConfig,
  gCloudFn,
} from "./environment.development";

const projectRoot = path.resolve();
const swPartialCode = projectRoot + "/index.html";
const swOutput = projectRoot + "/index.html";

const ContentSecurityPolicyTag = "<!--Content-Security-Policy-->";
const ContentSecurityPolicy =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'self' ` +
  firebaseConfig.databaseURL +
  `; media-src ` +
  gCloudFn +
  `; style-src 'self' 'unsafe-inline';" />`;

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
      .split(ContentSecurityPolicyTag)
      .join(ContentSecurityPolicy);

    const newBuff = Buffer.from(newCode, "utf-8");
    stream.write(newBuff);

    stream.end();
  });
});
