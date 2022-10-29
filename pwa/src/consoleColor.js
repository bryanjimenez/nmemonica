export const COLORS = Object.freeze({
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
export const black = (msg) => COLORS.black + msg + COLORS.reset;
export const red = (msg) => COLORS.red + msg + COLORS.reset;
export const green = (msg) => COLORS.green + msg + COLORS.reset;
export const yellow = (msg) => COLORS.yellow + msg + COLORS.reset;
export const blue = (msg) => COLORS.blue + msg + COLORS.reset;
export const magenta = (msg) => COLORS.magenta + msg + COLORS.reset;
export const cyan = (msg) => COLORS.cyan + msg + COLORS.reset;
export const white = (msg) => COLORS.white + msg + COLORS.reset;
