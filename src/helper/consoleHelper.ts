import { type ConsoleMessage } from "../components/Form/Console";
import { DebugLevel } from "../slices/settingHelper";
import type {
  MetaDataObj,
  RawPhrase,
  RawVocabulary,
  ValuesOf,
} from "../typings/raw";

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

/**
 * Days since rawDateString
 * @param rawDateString Date.toJSON string
 */
export function daysSince(rawDateString: string) {
  const [date] = rawDateString.split("T");
  const dateThen = Date.parse(date);
  const diffTime = Math.abs(Date.now() - dateThen);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
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
  spaceRepMap: Record<string, MetaDataObj | undefined>,
  options: { frequency: boolean }
) {
  const lastDate = spaceRepMap[term.uid]?.d;
  if (lastDate) {
    const msg = msgInnerTrim(term.english, 30);

    const freqStr = options?.frequency ? " F[w]" : "";

    const diffDays = daysSince(lastDate);
    const dayStr = ` ${diffDays - 1}d`;

    const views = spaceRepMap[term.uid]?.vC;
    const viewStr = ` ${views ?? 0}v`;
    const accuracy = spaceRepMap[term.uid]?.tpAcc;
    const accStr =
      accuracy !== undefined ? " " + (accuracy * 100).toFixed(0) + "%" : "";

    logger(
      "Space Rep [" + msg + "]" + freqStr + dayStr + viewStr + accStr,
      DebugLevel.DEBUG
    );
  }
}

/**
 * UI logger, display timed play play count
 * instead of regular view count
 */
export function timedPlayLog(
  logger: (message: string, level: ValuesOf<typeof DebugLevel>) => void,
  term: RawVocabulary | RawPhrase,
  spaceRepMap: Record<string, MetaDataObj | undefined>,
  options: { frequency: boolean }
) {
  const lastDate = spaceRepMap[term.uid]?.d;
  if (lastDate) {
    const msg = msgInnerTrim(term.english, 30);

    const freqStr = options?.frequency ? " F[w]" : "";

    const diffDays = daysSince(lastDate);
    const dayStr = ` ${diffDays - 1}d`;

    const views = spaceRepMap[term.uid]?.tpPc;
    const viewStr = views !== undefined ? ` ${views}v` : "";
    const accuracy = spaceRepMap[term.uid]?.tpAcc;
    const accStr =
      accuracy !== undefined ? " " + (accuracy * 100).toFixed(0) + "%" : "";
    const correctAvg = spaceRepMap[term.uid]?.tpCAvg;
    const corAvgStr =
      correctAvg !== undefined ? " " + answerSeconds(correctAvg) + "s" : "";

    logger(
      "Timed Play [" +
        msg +
        "]" +
        freqStr +
        dayStr +
        viewStr +
        accStr +
        corAvgStr,
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
