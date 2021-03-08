"use strict";
import axios from "axios";
import {
  gTranslateEndPoint,
  pronounceAllowedOrigins,
} from "../../../environment.development";

export async function g_translate_pronounce(req, res) {
  const originIdx = pronounceAllowedOrigins.indexOf(req.headers.origin);
  const origin =
    originIdx === -1
      ? pronounceAllowedOrigins[0]
      : pronounceAllowedOrigins[originIdx];
  res.set("Access-Control-Allow-Origin", origin);

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");

    res.sendStatus(204);
  } else if (req.method === "GET") {
    const { q } = req.query;

    const googleTranslate = await axios.get(gTranslateEndPoint, {
      responseType: "arraybuffer",
      headers: { "content-type": "audio/mpeg" },
      params: { ie: "UTF-8", tl: "ja", client: "tw-ob", q },
    });

    if (googleTranslate.status === 200) {
      res.set("content-type", "audio/mpeg");
    }

    return res.status(googleTranslate.status).send(googleTranslate.data);
  }
}
