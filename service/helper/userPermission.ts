import fs from "fs";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Request user permission for required files/access
 * @param useHTTPS
 * @param serviceIP LAN IP
 * @param localhost localhost or 127.0.0.1
 * @param JSON_DIR
 * @param CSV_DIR
 * @param httpPort
 * @param httpsPort
 */
export async function requestUserPermission(
  useHTTPS: boolean,
  serviceIP: string,
  localhost: string,
  JSON_DIR: string,
  CSV_DIR: string,
  httpPort: number,
  httpsPort: number
) {
  const rl = readline.createInterface({ input, output });
  const readGranted = await rl.question(
    `Grant READ access? "${JSON_DIR}" [y/n]\t`
  );
  const writeGranted = await rl.question(
    `Grant WRITE access? "${CSV_DIR}" [y/n]\t`
  );
  const netGranted = await rl.question(
    `Grant HTTP access? "${localhost}:${httpPort}" [y/n]\t`
  );

  if (useHTTPS) {
    const httpsGranted = await rl.question(
      `Grant HTTPS access? "${serviceIP}:${httpsPort}" [y/n]\t`
    );
    if (httpsGranted?.toLowerCase() !== "y") {
      throw new Error(`Denied HTTPS access "${serviceIP}:${httpsPort}"`);
    }
  }

  if (readGranted?.toLowerCase() !== "y") {
    throw new Error(`Denied READ access "${JSON_DIR}"`);
  }
  if (writeGranted?.toLowerCase() !== "y") {
    throw new Error(`Denied WRITE access "${CSV_DIR}"`);
  }
  if (netGranted?.toLowerCase() !== "y") {
    throw new Error(`Denied HTTP access "${localhost}:${httpPort}"`);
  }
  if (!fs.existsSync(CSV_DIR)) {
    const createIt = await rl.question(
      `Create directory? "${CSV_DIR}" [y/n]\t`
    );
    if (createIt?.toLowerCase() === "y") {
      fs.mkdirSync(CSV_DIR, { recursive: true });
    } else {
      throw new Error(`Missing required directory "${CSV_DIR}"`);
    }
  }
  if (!fs.existsSync(JSON_DIR)) {
    const createIt = await rl.question(
      `Create directory? "${JSON_DIR}" [y/n]\t`
    );
    if (createIt?.toLowerCase() === "y") {
      fs.mkdirSync(JSON_DIR, { recursive: true });
    } else {
      throw new Error(`Missing required directory "${JSON_DIR}"`);
    }
  }
}
