import https from "https";
import { Blob } from "buffer";
import type { Request, Response, NextFunction } from "express";
import stream from "stream";

const allowedTL = ["en", "ja"];

/**
 * Fetch audio pronunciation
 */
export async function getAudioAsync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.set("Content-Type", "audio/mpeg");
  try {
    const { tl, q } = req.query;

    if (
      typeof tl !== "string" ||
      typeof q !== "string" ||
      tl.toString().length === 0 ||
      q.toString().length === 0 ||
      !allowedTL.includes(tl)
    ) {
      res.sendStatus(400);
      return;
    }

    // const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=友達"
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${q}`;

    // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
    // const audioRes = await fetch(url);
    const audioBlob: Blob = await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data: Blob[] = [];
          res.on("data", (chunk: Blob) => {
            data.push(chunk);
          });
          res.on("end", () => {
            resolve(new Blob(data, { type: "audio/mpeg" }));
          });
        })
        .on("error", (err) => {
          reject(err);
        });
    });

    // const audioBlob = await audioRes.blob();
    const audioBuff = await audioBlob.arrayBuffer();
    const raw = new Uint8Array(audioBuff);

    // Write to fs ?
    // const filename = path.normalize(__dirname + "/../audio/" + md5(q) + ".mp3");
    // const fileStream = fs.createWriteStream(filename, {
    //   flags: "w",
    // });

    // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93/
    const readStream = new stream.PassThrough();
    readStream.end(raw);

    // zip it? https://nodejs.org/api/stream.html#readablepipedestination-options
    // const zlib = require('node:zlib');
    // const z = zlib.createGzip();

    // readStream.pipe(fileStream);
    readStream.pipe(res);
  } catch (e) {
    console.log("getAudio");
    console.log(e);
    next(e);
    res.sendStatus(500);
  }
}
