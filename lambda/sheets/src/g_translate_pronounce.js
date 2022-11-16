"use strict";
import { default as admin } from "firebase-admin";
import axios from "axios";
import {
  gTranslateEndPoint,
  pronounceAllowedOrigins,
} from "../../../environment.development";
import { defineString } from "firebase-functions/v2/params";

const DEV_ORIGIN = defineString("DEV_ORIGIN").value();

/**
 * Authorization required if the origin is development
 * @param {string} origin
 */
function requiredHeaders(origin) {
  let allowedHeaders = ["Content-Type"];
  if (origin === DEV_ORIGIN) {
    // development required headers
    allowedHeaders = [...allowedHeaders, "Authorization"];
  }

  return allowedHeaders.join(", ");
}

/**
 * Get bearer token
 * @param {*} headers
 */
function getIdToken(headers) {
  let idToken;
  if (headers.authorization && headers.authorization.startsWith("Bearer ")) {
    // Read the ID Token from the Authorization header.
    idToken = headers.authorization.split("Bearer ")[1];
  } else {
    throw new Error("Header did not contain expected authorization.", {
      cause: { code: "MissingAuth" },
    });
  }

  return idToken;
}

/**
 * Replacer function for JSON.stringify
 */
function replaceErrors(key, value) {
  if (value instanceof Error) {
    var error = {};

    Object.getOwnPropertyNames(value).forEach((propName) => {
      error[propName] = value[propName];
    });

    return error;
  }

  return value;
}

/**
 * @param {"DEFAULT"|"DEBUG"|"INFO"|"NOTICE"|"WARNING"|"ERROR"|"CRITICAL"|"ALERT"|"EMERGENCY"} severity
 * @param {*} message
 */
function log(message, severity) {
  if (message instanceof Error && !("toJSON" in message)) {
    const error = message;
    const jsonError = JSON.parse(JSON.stringify(error, replaceErrors));

    console.log(
      JSON.stringify({
        severity,
        message: jsonError,
      })
    );
  } else {
    console.log(
      JSON.stringify({
        severity,
        message,
      })
    );
  }
}

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
    const allowed = requiredHeaders(req.headers.origin);
    res.set("Access-Control-Allow-Headers", allowed);
    res.set("Access-Control-Max-Age", "3600");

    return res.sendStatus(204);
  } else if (req.method === "GET") {
    if (req.headers.origin === DEV_ORIGIN) {
      try {
        const idToken = getIdToken(req.headers);
        // log("Raw: " + idToken.slice(0, 4) + "..." + idToken.slice(-4), "DEBUG");
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);

        log("ID Token correctly decoded", "DEBUG");
      } catch (e) {
        const allowErr = [
          'Firebase ID token has incorrect "iss" (issuer) claim.',
          'Firebase ID token has incorrect "aud" (audience) claim.',
        ];
        const rejectErr = ["Decoding Firebase ID token failed."];

        if (allowErr.some((iE) => e.message.includes(iE))) {
          // allow these errors
        } else if (
          e.cause?.code === "MissingAuth" ||
          rejectErr.some((rE) => e.message.includes(rE))
        ) {
          log(e, "ALERT");
          return res.status(403).send("Unauthorized");
        } else {
          log(e, "EMERGENCY");
          return res.status(403).send("Unauthorized");
        }
      }
    }

    const { q, tl } = req.query;

    try {
      const googleTranslate = await axios.get(gTranslateEndPoint, {
        responseType: "arraybuffer",
        headers: { "content-type": "audio/mpeg" },
        params: { ie: "UTF-8", tl, client: "tw-ob", q },
      });

      if (googleTranslate.status === 200) {
        res.set("content-type", "audio/mpeg");
      }

      return res.status(googleTranslate.status).send(googleTranslate.data);
    } catch (e) {
      log(e, "CRITICAL");
      return res.status(500).json({ error: e.message });
    }
  }
  return res.sendStatus(400);
}
