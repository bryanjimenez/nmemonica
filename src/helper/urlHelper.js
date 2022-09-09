/**
 * @returns {String} a constructed url using the baseUrl and the params
 * @param {String} baseUrl
 * @param {*} params
 */
export function getParam(baseUrl, param) {
  const end = new RegExp("&" + param + "=.*$");
  const mid = new RegExp("&" + param + "=.*&");
  const start = new RegExp("\\?" + param + "=.*?&");

  let v;
  const s = start.exec(baseUrl);
  const m = mid.exec(baseUrl);
  const e = end.exec(baseUrl);
  if (s) {
    v = s[0];
  } else if (m) {
    v = m[0];
  } else if (e) {
    v = e[0];
  }

  if (v) {
    v = v.split("=")[1].replace("&", "");
  }

  return v;
}

/**
 * @returns {String} a constructed url using the baseUrl and the params
 * @param {String} baseUrl
 * @param {*} params
 */
export function addParam(baseUrl, params) {
  const addit = baseUrl.indexOf("?") === -1;

  let p = [];
  let i = 0;
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      p = [...p, (i === 0 && addit ? "?" : "&") + key + "=" + value];
    }
    i++;
  }

  return baseUrl + p.join("");
}

/**
 * @param {String} url
 * @param {String} newName new name for target param. Will be removed if exists in url.
 * @param {String} target param to be renamed
 * @returns {String} the url with query param target's name replaced by newName
 */
export function renameParam(url, target, newName) {
  const end = new RegExp("&" + newName + "=.*$");
  const mid = new RegExp("&" + newName + "=.*?&");
  const start = new RegExp("\\?" + newName + "=.*?&");

  let result = url;
  if (start.test(url)) {
    result = result.split(start).join("?");
  } else if (mid.test(url)) {
    result = result.split(mid).join("&");
  } else {
    result = result.split(end).join("");
  }

  return result
    .split("&" + target + "=")
    .join("&" + newName + "=")
    .split("?" + target + "=")
    .join("?" + newName + "=");
}

/**
 * @returns {String} url without the given param or value
 * @param {String} url
 * @param {String} param to be removed
 */
export function removeParam(url, param) {
  const end = new RegExp("&" + param + "=.*$");
  const mid = new RegExp("&" + param + "=.*?&");
  const start = new RegExp("\\?" + param + "=.*?&");

  let result;
  if (start.test(url)) {
    result = url.split(start).join("?");
  } else if (mid.test(url)) {
    result = url.split(mid).join("&");
  } else {
    result = url.split(end).join("");
  }

  return result;
}
