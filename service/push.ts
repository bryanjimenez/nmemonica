import type { Request, Response, NextFunction } from "express";
import webPush, { WebPushError } from "web-push";
import fs from "fs";
import { dataPath, httpsPort, serviceIP, subscriptionFile } from "./index.js";
import { multipart } from "./helper/multipart.js";
import { SheetData } from "./helper/jsonHelper.js";
import { sheetDataToJSON, updateDataAndCache } from "./data.js";
import path from "path";
import "dotenv/config";

interface Subscription {
  endpoint: string;
  expirationTime: null;
  keys: {
    auth: string;
    p256dh: string;
  };
}

const projectRoot = path.resolve();
const PUSH_DIR = projectRoot + "/" + process.env.PATH_PUSHAPI;

function obtainKeys() {
  if (PUSH_DIR === undefined) {
    throw new Error("Missing Push API directory path");
  }

  const pushAPIDir = PUSH_DIR;
  const pubKeyPath = pushAPIDir + "/public.pem";
  const privKeyPath = pushAPIDir + "/private.pem";

  if (!fs.existsSync(pushAPIDir)) {
    fs.mkdirSync(pushAPIDir, { recursive: true });
  }

  if (!(fs.existsSync(pubKeyPath) && fs.existsSync(privKeyPath))) {
    const keys = webPush.generateVAPIDKeys();
    fs.writeFileSync(pubKeyPath, keys.publicKey, { flag: "w" });
    fs.writeFileSync(privKeyPath, keys.privateKey, { flag: "w" });
  }

  const publicKey = fs.readFileSync(pubKeyPath, { encoding: "utf-8" });
  const privateKey = fs.readFileSync(privKeyPath, { encoding: "utf-8" });

  return { publicKey, privateKey };
}

const { publicKey, privateKey } = obtainKeys();

// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
  //'mailto:myemail@gmail.com',
  `https://nmemonica.com"`,
  publicKey,
  privateKey
);

export function getPublicKey(req: Request, res: Response) {
  res.send(publicKey);
}

export function registerClient(req: Request, res: Response) {
  // get incoming subscription
  const subscription = req.body.subscription as Subscription;

  // TODO: rewrite async

  // get previously subscribed
  const subscriptionList = readSubscriptionFileAsMap(subscriptionFile);

  // add incoming (preventing duplicates)
  subscriptionList.set(subscription.endpoint, subscription);

  // save subscriptions
  writeSubscriptionFileFromMap(subscriptionFile, subscriptionList);

  // confirmation message
  const message = JSON.stringify({
    title: "Subscribed",
    tag: "new-subscription-received",
    body: { type: "push-confirmation", msg: "You have been subscribed" },
  });
  void webPush.sendNotification(subscription, message, { urgency: "high" });

  res.sendStatus(201);
}

function readSubscriptionFileAsMap(filePath: string) {
  let subscriptionList = new Map<string, Subscription>();
  if (fs.existsSync(filePath)) {
    const subscriptionTxt = fs.readFileSync(filePath, {
      encoding: "utf-8",
    });
    const arr = JSON.parse(subscriptionTxt) as Subscription[];
    if (!Array.isArray(arr)) {
      throw new Error("Subscription file was corrupt?");
    }
    subscriptionList = new Map(arr.map((el) => [el.endpoint, el]));
  }
  return subscriptionList;
}

function writeSubscriptionFileFromMap(
  filepath: string,
  subscriptions: Map<string, Subscription>
) {
  const stream = fs.createWriteStream(filepath, {
    flags: "w",
  });

  const array = Array.from(subscriptions).map(([, val]) => val);

  stream.end(JSON.stringify(array, null, 2));
}

export async function pushSheetDataAsync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sheetName, sheetData } = await multipart<SheetData>(req, next);
    const { data, hash } = sheetDataToJSON(sheetData);

    const resourceName = sheetData.name.toLowerCase();
    const updateP = updateDataAndCache(resourceName, data, hash);

    // service worker will only work on https
    const pathToResource = `https://${serviceIP}:${httpsPort}${dataPath}`;

    const message = JSON.stringify({
      title: "Data update",
      tag: "data-update-push",
      body: {
        type: "push-data-update",
        name: sheetName,
        hash,
        url: pathToResource,
      },
    });

    const subscriptions = readSubscriptionFileAsMap(subscriptionFile);
    let subscriptionList = Array.from(
      readSubscriptionFileAsMap(subscriptionFile)
    ).map(([, val]) => val);

    return updateP.then(() => {
      // updated sucessfully

      const messageP = subscriptionList.map((subscription) =>
        webPush
          .sendNotification(subscription, message, { urgency: "high" })
          .catch((err: WebPushError) => err)
      );

      return Promise.all(messageP).then((messageRes) => {
        let deleted = 0;
        messageRes.forEach((mRes) => {
          if (mRes instanceof WebPushError) {
            const { endpoint } = mRes;

            subscriptions.delete(endpoint);
            deleted++;
          }
        });

        console.log("Sent: " + (messageRes.length - deleted));
        console.log("Deleted: " + deleted + "\n");
        writeSubscriptionFileFromMap(subscriptionFile, subscriptions);

        res.sendStatus(200);
      });
    });
  } catch (e) {
    next(e);
  }
}
