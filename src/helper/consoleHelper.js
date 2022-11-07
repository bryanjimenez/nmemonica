/**
 * UI logger
 * @param {function} logger
 * @param {*} term
 * @param {*} spaceRepObj
 */
export function spaceRepLog(logger, term, spaceRepObj) {
  if (spaceRepObj[term.uid]) {
    logger("space rep [" + term.english + "] " + spaceRepObj[term.uid].d, 3);
  } else {
    logger("space rep [] " + term.english, 3);
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
