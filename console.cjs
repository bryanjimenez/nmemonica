const COLORS = Object.freeze({
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
});

// https://gist.github.com/abritinthebay/d80eb99b2726c83feb0d97eab95206c4
const black = (/** @type string */ msg) => COLORS.black + msg + COLORS.reset;
const red = (/** @type string */ msg) => COLORS.red + msg + COLORS.reset;
const green = (/** @type string */ msg) => COLORS.green + msg + COLORS.reset;
const yellow = (/** @type string */ msg) => COLORS.yellow + msg + COLORS.reset;
const blue = (/** @type string */ msg) => COLORS.blue + msg + COLORS.reset;
const magenta = (/** @type string */ msg) => COLORS.magenta + msg + COLORS.reset;
const cyan = (/** @type string */ msg) => COLORS.cyan + msg + COLORS.reset;
const white = (/** @type string */ msg) => COLORS.white + msg + COLORS.reset;


module.exports = {
  black, red, green, yellow, blue, magenta, cyan, white, COLORS
}