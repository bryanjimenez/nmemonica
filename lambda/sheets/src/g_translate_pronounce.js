"use strict";
import axios from "axios";
import { verify } from "crypto";
import { defineString } from "firebase-functions/params";
import {
  gTranslateEndPoint,
  pronounceAllowedOrigins,
} from "../../../environment.development";

const DEV_ORIGIN = defineString("DEV_ORIGIN");
const DEV_PUB_A = defineString("DEV_PUB_A");
const DEV_PUB_K = defineString("DEV_PUB_K");
const DEV_PUB_B = defineString("DEV_PUB_B");
const DEV_ENV = defineString("DEV_ENV").equals("true");

/**
 * Authorization required if the origin is development
 * @param {string} origin
 */
function requiredHeaders(origin) {
  let allowedHeaders = ["Content-Type"];
  if (origin === DEV_ORIGIN.value()) {
    // development required headers
    allowedHeaders = [...allowedHeaders, "Authorization"];
  }

  return allowedHeaders.join(", ");
}

function validateAuthenticationSignature(headers, message) {
  if (
    !headers ||
    !headers.authorization ||
    !headers.authorization.startsWith("Bearer ")
  )
    throw new Error("Header did not contain expected authorization.", {
      cause: { code: "MissingAuth" },
    });

  // Read the ID Token from the Authorization header.
  const sigString = headers.authorization.split("Bearer ")[1];

  const key = {
    public:
      DEV_PUB_A.value() +
      "\n" +
      DEV_PUB_K.value() +
      "\n" +
      DEV_PUB_B.value() +
      "\n",
  };

  const signature = Buffer.from(sigString, "hex");
  const verified = verify(null, Buffer.from(message), key.public, signature);

  if (!verified) {
    throw new Error("Unauthenticated.", {
      cause: { code: "UnverifiedAuth" },
    });
  }
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
  const isDevelopment = DEV_ENV.value();
  const devOrigin = DEV_ORIGIN.value();
  const devReferer = devOrigin + "/";

  const origin =
    [...pronounceAllowedOrigins, devOrigin].find(
      (o) => o === req.headers.origin
    ) || pronounceAllowedOrigins[0];

  // must be set before req.method check
  res.set("Access-Control-Allow-Origin", origin);

  const prodReferer = pronounceAllowedOrigins
    .map((o) => o + "/")
    .includes(req.headers.referer);

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    const allowed = requiredHeaders(req.headers.origin);
    res.set("Access-Control-Allow-Headers", allowed);
    res.set("Access-Control-Max-Age", "3600");

    return res.sendStatus(204);
  } else if (req.method === "GET") {
    if (isDevelopment) {
      log("Development", "NOTICE");
    } else if (prodReferer) {
      // allowed referer
    } else if (req.headers.referer === devReferer) {
      // dev referer

      try {
        const { q, tl } = req.query;
        const message = JSON.stringify({ q, tl });
        validateAuthenticationSignature(req.headers, message);
      } catch (e) {
        if (e.cause?.code === "UnverifiedAuth") {
          log(e, "EMERGENCY");
        }

        return res.status(403).send("Unauthorized");
      }
    } else {
      // unknown origin/referer
      // failed Access-Control-Allow-Origin
      log(
        {
          message: "Unknown origin",
          origin: req.headers.origin,
          referer: req.header.referer,
        },
        "ALERT"
      );
      return res.sendStatus(401);
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
