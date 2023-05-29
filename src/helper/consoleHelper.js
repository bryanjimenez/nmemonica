import { DebugLevel } from "../slices/settingHelper";

/**
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../typings/raw").RawPhrase} RawPhrase
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * Trims a string keeping the begining and end.
 * @param {string} term
 * @param {number} len
 */
export function msgInnerTrim(term, len) {
  const split = Math.ceil(len / 2);
  const msg =
    term.length < len
      ? term
      : term.slice(0, split) + "..." + term.slice(-(len - split));

  return msg;
}

/**
 * Days since rawDateString
 * @param {string} rawDateString Date.toJSON string
 */
export function daysSince(rawDateString) {
  const [date] = rawDateString.split("T");
  const dateThen = Date.parse(date);
  const diffTime = Math.abs(Date.now() - dateThen);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Minutes since rawDateString
 * @param {string} rawDateString Date.toJSON string
 */
export function minsSince(rawDateString) {
  const dateThen = Date.parse(rawDateString);
  const diffTime = Math.abs(Date.now() - dateThen);
  const diffMins = Math.ceil(diffTime / (1000 * 60));

  return diffMins;
}


/**
 * Console friendly string representation of elapsed
 * @param {number} tpElapsed elapsed in ms
 */
export function answerSeconds(tpElapsed) {
  const elapStr =
    (Math.round(tpElapsed) / 1000).toFixed(2) +
    "".replace("0.", ".").replace(".00", "").replace(/0$/, "");

  return elapStr;
}
/**
 * UI logger
 * @param {function} logger
 * @param {RawVocabulary|RawPhrase} term
 * @param {SpaceRepetitionMap} spaceRepMap
 * @param {{frequency:boolean}} options
 */
export function spaceRepLog(logger, term, spaceRepMap, options) {
  if (spaceRepMap[term.uid] && spaceRepMap[term.uid].d) {
    const msg = msgInnerTrim(term.english, 30);

    const freqStr = options?.frequency === true ? " F[w]" : "";

    const diffDays = daysSince(spaceRepMap[term.uid].d);
    const dayStr = " " + (diffDays - 1) + "d";

    const views = spaceRepMap[term.uid].vC;
    const viewStr = " " + views + "v";
    const accuracy = spaceRepMap[term.uid].tpAcc;
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
 * @param {function} logger
 * @param {RawVocabulary|RawPhrase} term
 * @param {SpaceRepetitionMap} spaceRepMap
 * @param {{frequency: boolean }} options
 */
export function timedPlayLog(logger, term, spaceRepMap, options) {
  if (spaceRepMap[term.uid] && spaceRepMap[term.uid].d) {
    const msg = msgInnerTrim(term.english, 30);

    const freqStr = options?.frequency === true ? " F[w]" : "";

    const diffDays = daysSince(spaceRepMap[term.uid].d);
    const dayStr = " " + (diffDays - 1) + "d";

    const views = spaceRepMap[term.uid].tpPc;
    const viewStr = views !== undefined ? " " + views + "v" : "";
    const accuracy = spaceRepMap[term.uid].tpAcc;
    const accStr =
      accuracy !== undefined ? " " + (accuracy * 100).toFixed(0) + "%" : "";
    const correctAvg = spaceRepMap[term.uid].tpCAvg;
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
 * @param {{[key: string]: any}} object
 */
export function logify(object) {
  const bare = Object.keys(object).reduce((acc, k) => {
    if (["boolean", "number", "string"].includes(typeof object[k])) {
      acc = { ...acc, [k]: object[k] };
    }
    if (Array.isArray(object[k])) {
      acc = { ...acc, [k + "Len"]: object[k].length };
    }
    return acc;
  }, {});

  return JSON.stringify(bare).replaceAll(",", ", ");
}
