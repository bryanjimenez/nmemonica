import type { MetaDataObj } from "nmemonica";

import type { ValuesOf } from "../typings/utils";

// enum
export const DebugLevel = Object.freeze({
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  DEBUG: 3,
});

export interface ConsoleMessage {
  msg: string;
  lvl: ValuesOf<typeof DebugLevel>;
  css?: string;
  /** Used to distinguish between UI and SW msg */
  origin?: "UI" | "SW" | "CACHE";
  time?: number;
}

/**
 * Trims a string keeping the begining and end.
 */
export function msgInnerTrim(term: string, len: number) {
  const split = Math.ceil(len / 2);
  const msg =
    term.length < len
      ? term
      : term.slice(0, split) + "..." + term.slice(-(len - split));

  return msg;
}

export function toMemorySize(value: number) {
  const units = ["b", "kb", "mb", "gb", "tb"];

  if (isNaN(value)) {
    throw new Error("Expected a numerical value");
  }
  if (!isFinite(value)) {
    throw new Error("Expected a finite value");
  }
  if (value < 0) {
    throw new Error("Expected a positive value");
  }

  const exp = value.toExponential();
  const [man, exponent] = exp.split("e+").map((str) => Number(str));
  const rem = exponent % 3;

  const unit = (exponent - rem) / 3;
  const val = Math.round(man * Math.pow(10, rem));
  const result = `${val}${units[unit]}`;

  return result;
}

/**
 * Whether the date is today
 * @param rawDateString Date.toJSON string
 */
export function wasToday(rawDateString?: string) {
  return rawDateString !== undefined && daysSince(rawDateString) === 0;
}

/**
 * Days since rawDateString
 * @param rawDateString Date.toJSON string
 */
export function daysSince(rawDateString: string) {
  const tzOffset = 1000 * 60 * new Date().getTimezoneOffset();

  const [then] = new Date(new Date(rawDateString).valueOf() - tzOffset)
    .toJSON()
    .split("T");
  const [now] = new Date(Date.now() - tzOffset).toJSON().split("T");

  const dateThen = Date.parse(then);
  const dateNow = Date.parse(now);

  return Math.floor((dateNow - dateThen) / (1000 * 60 * 60 * 24));
}

/**
 * Minutes since rawDateString
 * @param rawDateString Date.toJSON string
 */
export function minsSince(rawDateString: string) {
  const dateThen = Date.parse(rawDateString);
  const diffTime = Math.abs(Date.now() - dateThen);
  const diffMins = Math.ceil(diffTime / (1000 * 60));

  return diffMins;
}

/**
 * Seconds since rawDateString
 * @param rawDateString Date
 */
export function secsSince(rawDateString: number | string) {
  let dateThen;
  if (typeof rawDateString === "number") {
    dateThen = new Date(rawDateString).valueOf();
  } else {
    dateThen = Date.parse(rawDateString);
  }

  const diffTime = Math.abs(Date.now() - dateThen);
  const diffSecs = Math.ceil(diffTime / 1000);

  return diffSecs;
}

/**
 * Console friendly string representation of elapsed
 * @param tpElapsed elapsed in ms
 */
export function answerSeconds(tpElapsed: number) {
  const elapStr =
    (Math.round(tpElapsed) / 1000).toFixed(2) +
    "".replace("0.", ".").replace(".00", "").replace(/0$/, "");

  return elapStr;
}
/**
 * UI logger
 */
export function spaceRepLog<T extends { uid: string; english: string }>(
  logger: (message: string, level: ValuesOf<typeof DebugLevel>) => void,
  term: T,
  spaceRepMap: Record<string, MetaDataObj | undefined>
) {
  const lastDate = spaceRepMap[term.uid]?.lastView;
  if (lastDate !== undefined) {
    const msg = msgInnerTrim(term.english, 30);

    const diffDays = daysSince(lastDate);
    const dayStr = ` ${diffDays}d`;

    const views = spaceRepMap[term.uid]?.vC;
    const viewStr = ` ${views ?? 0}v`;
    const accuracy = spaceRepMap[term.uid]?.accuracyP;
    const accStr =
      accuracy !== undefined ? " " + accuracy.toFixed(0) + "%" : "";

    logger(
      "Space Rep [" + msg + "]" + dayStr + viewStr + accStr,
      DebugLevel.DEBUG
    );
  }
}

/**
 * Strips object of array properties,
 * and replaces with the length of the array properties
 * then stringifies the object
 * @example
 * before = {prop: [...]}
 * after = {propLen: before.prop.length}
 */
export function logify(
  object: Record<string, boolean | number | string | unknown[]>
) {
  const bare = Object.keys(object).reduce<
    Record<string, boolean | number | string>
  >((acc, k) => {
    const o = object[k];
    if (
      !Array.isArray(o) &&
      ["boolean", "number", "string"].includes(typeof o)
    ) {
      acc = { ...acc, [k]: o };
    }
    if (Array.isArray(o)) {
      acc = { ...acc, [k + "Len"]: o.length };
    }
    return acc;
  }, {});

  return JSON.stringify(bare).replaceAll(",", ", ");
}

/**
 * Takes one or two messages and checks if they can be squashed
 *
 * Sequential messages that are the same can be squashed
 * incrementing a counter on the final message
 * @param messages one or two messages to be squashed
 */
export function squashSeqMsgs(messages: ConsoleMessage[]) {
  let squashed: ConsoleMessage[] = [];

  if (messages.length < 2) {
    return messages as [ConsoleMessage];
  }

  const [last, incoming] = messages;

  const zero = last.msg === incoming.msg;
  const notZero =
    last.msg.endsWith("+") && last.msg.slice(0, -4) === incoming.msg;

  if (zero || notZero) {
    // squashable
    if (zero) {
      squashed = [{ ...incoming, msg: `${incoming.msg} ${1} +` }];
    } else {
      const c = Number(last.msg.slice(-3).slice(0, 1));
      squashed = [{ ...incoming, msg: `${incoming.msg} ${c + 1} +` }];
    }
  } else {
    // not squashable
    squashed = messages;
  }

  return squashed;
}
