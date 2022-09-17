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
