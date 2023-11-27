import type { Request, Response, NextFunction } from "express";
import {
  type SheetData,
  sheets_sync_kanji,
  sheets_sync_phrases,
  sheets_sync_vocabulary,
  xtof,
} from "./helper/firebaseParse.js";
import { multipart } from "./helper/multipart.js";
import fs, { createWriteStream, createReadStream } from "node:fs";
import path from "node:path";
import { JSON_DIR } from "./index.js";

const allowedResources = ["cache", "phrases", "vocabulary", "kanji"];

/**
 * Get JSON vocabulary data
 */
export function getData(req: Request, res: Response) {
  const { data } = req.params;
  const resource = data?.toString().toLowerCase();

  if (resource && !allowedResources.includes(resource)) {
    res.sendStatus(400);
    return;
  }

  try {
    const readStream = createReadStream(
      path.normalize(`${JSON_DIR}/${resource}.json`)
    );
    readStream.pipe(res);
  } catch (_e) {
    res.sendStatus(400);
  }
}

/**
 * Update JSON (vocabulary) resource
 */
export async function putData(req: Request, res: Response, next: NextFunction) {
  const { sheetName, sheetData } = await multipart<SheetData[]>(req, next);

  const resource = sheetName.toLowerCase();

  if (!allowedResources.filter((r) => r !== "cache").includes(resource)) {
    res.sendStatus(400);
  }

  const d = xtof(sheetData, sheetName);
  let data: object = {};
  let hash = "";
  switch (sheetName) {
    case "Vocabulary": {
      const { vocabularyAfter, hash: h } = sheets_sync_vocabulary(d);
      data = vocabularyAfter;
      hash = h;
      break;
    }
    case "Phrases": {
      const { phrasesAfter, hash: h } = sheets_sync_phrases(d);
      data = phrasesAfter;
      hash = h;
      break;
    }
    case "Kanji": {
      const { kanjiList, hash: h } = sheets_sync_kanji(d);
      data = kanjiList;
      hash = h;
      break;
    }
  }

  //@ts-expect-error
  const fileP = updateData(data, resource);
  const hashP = updateLocalCache(resource, hash);

  Promise.all([fileP, hashP])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(400);
    });

  // https://firebase.google.com/docs/reference/rest/database/

  /*

  curl -X PUT -d '{ "first": "Jack", "last": "Sparrow" }' \
  'https://[PROJECT_ID].firebaseio.com/users/jack/name.json'
  https://nmemonica-9d977.firebaseio.com/lambda/cache.json
  https://nmemonica-9d977.firebaseio.com/lambda/phrases.json
  https://nmemonica-9d977.firebaseio.com/lambda/vocabulary.json

  */
}

/**
 * Write JSON formatted data to file
 * @param jsonData
 * @param resourceName
 */
function updateData(jsonData: Record<string, unknown>, resourceName: string) {
  const dataPath = path.normalize(`${JSON_DIR}/${resourceName}.json`);

  return new Promise<void>((resolve, reject) => {
    try {
      const writeStream = createWriteStream(dataPath);
      writeStream.end(JSON.stringify(jsonData, null, 2));
      resolve();
    } catch (_e) {
      console.log("resource update failed: " + resourceName);
      reject();
    }
  });
}

/**
 * Update cache file hashes
 * @param resource to update
 * @param hash value
 */
function updateLocalCache(resource: string, hash: string) {
  const cachePath = path.normalize(`${JSON_DIR}/cache.json`);

  return fs.promises
    .readFile(cachePath)
    .then((body) => JSON.parse(body.toString()))
    .then((value: Record<string, string>) => {
      value[resource] = hash;
      return value;
    })
    .then((json) => JSON.stringify(json, null, 2))
    .then((value) => fs.promises.writeFile(cachePath, value))
    .catch((error) => {
      if ("name" in error && error.name === "NotFound") {
        void fs.promises.writeFile(
          cachePath,
          JSON.stringify({ [resource]: hash }, null, 2)
        );
      } else {
        console.log(error);
        console.log("Some error happened writing cache: " + resource);
        throw new Error("Could not update cache.json");
      }
    });
}
