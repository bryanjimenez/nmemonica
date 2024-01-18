import axios from "axios";
import { verify } from "crypto";
import type * as express from "express";
import { defineString } from "firebase-functions/params";
import {
  authenticationHeader,
  gTranslateEndPoint,
  pronounceAllowedOrigins,
} from "./constants";

const DEV_ORIGIN = defineString("DEV_ORIGIN");
const DEV_PUB_A = defineString("DEV_PUB_A");
const DEV_PUB_K = defineString("DEV_PUB_K");
const DEV_PUB_B = defineString("DEV_PUB_B");

/**
 * Authorization required if the origin is development
 */
function requiredHeaders(origin?: string) {
  let allowedHeaders = ["Content-Type"];
  if (origin === DEV_ORIGIN.value()) {
    // development required headers
    allowedHeaders = [...allowedHeaders, authenticationHeader];
  }

  return allowedHeaders.join(", ");
}

/**
 * Validate message is signed using provided key
 */
function validateAuthenticationSignature(
  signatureBase64: string,
  message: string
) {
  const key = {
    public:
      DEV_PUB_A.value() +
      "\n" +
      DEV_PUB_K.value() +
      "\n" +
      DEV_PUB_B.value() +
      "\n",
  };

  const signature = Buffer.from(signatureBase64, "base64");
  const verified = verify(null, Buffer.from(message), key.public, signature);
  if (!verified) {
    // @ts-expect-error Error.cause
    throw new Error("Unauthenticated.", {
      cause: { code: "UnverifiedAuth" },
    });
  }
}

/**
 * Replacer function for JSON.stringify
 */
function replaceErrors(key: string, value: unknown) {
  if (value instanceof Error) {
    const error: Record<string, Error[keyof Error]> = {};

    const keys = Object.getOwnPropertyNames(value) as (keyof Error)[];
    keys.forEach((propName) => {
      error[propName] = value[propName];
    });

    return error;
  }

  return value;
}

type severity =
  | "ALERT"
  | "CRITICAL"
  | "DEBUG"
  | "DEFAULT"
  | "EMERGENCY"
  | "ERROR"
  | "INFO"
  | "NOTICE"
  | "WARNING";

function log(message: unknown, severity: severity) {
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

export async function g_translate_pronounce(
  req: express.Request,
  res: express.Response
) {
  const devOrigin = DEV_ORIGIN.value();
  const devReferer = devOrigin + "/";

  const origin =
    [...pronounceAllowedOrigins, devOrigin].find(
      (o) => o === req.headers.origin
    ) ?? pronounceAllowedOrigins[0];

  // must be set before req.method check
  res.set("Access-Control-Allow-Origin", origin);

  const prodReferer =
    req.headers.referer &&
    pronounceAllowedOrigins.map((o) => o + "/").includes(req.headers.referer);

  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    const allowed = requiredHeaders(req.headers.origin);
    res.set("Access-Control-Allow-Headers", allowed);
    res.set("Access-Control-Max-Age", "3600");

    res.sendStatus(204);
    return;
  } else if (req.method === "GET") {
    if (prodReferer) {
      // allowed referer
    } else if (req.headers.referer === devReferer) {
      // dev referer

      try {
        const { q, tl } = req.query;
        const message = JSON.stringify({ q, tl });
        const signature = req.header(authenticationHeader);
        if (!signature) {
          // @ts-expect-error Error.cause
          throw new Error("Header did not contain expected authorization.", {
            cause: { code: "MissingAuth" },
          });
        }

        validateAuthenticationSignature(signature, message);
      } catch (e) {
        if (e instanceof Error) {
          // @ts-expect-error Error.cause
          const cause = e.cause?.code;

          if (cause === "UnverifiedAuth" || cause === "MissingAuth") {
            log(e, "EMERGENCY");
          }
        }

        res.status(403).send("Unauthorized");
        return;
      }
    } else {
      // unknown origin/referer
      // failed Access-Control-Allow-Origin
      log(
        {
          message: "Unknown origin",
          origin: req.headers.origin,
          referer: req.headers.referer,
        },
        "ALERT"
      );
      res.sendStatus(401);
      return;
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

      res.status(googleTranslate.status).send(googleTranslate.data);
      return;
    } catch (e) {
      let msg = e;
      if (e instanceof Error) {
        log(e, "CRITICAL");
        msg = { error: e.message };
      }
      res.status(500).json(msg);
      return;
    }
  }
  res.sendStatus(400);
  return;
}
