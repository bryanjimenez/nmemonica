/**
 * @returns {string|null} the param
 * @param {string} baseUrl
 * @param {string} param
 */
export function getParam(baseUrl, param) {
  const queryPart = baseUrl.includes("?") ? baseUrl.split("?")[1] : "";
  const search = new URLSearchParams(queryPart);

  const result = search.get(param);
  return result;
}

/**
 * @returns {string} a constructed url using the baseUrl and the params
 * @param {string} baseUrl
 * @param {*} params
 */
export function addParam(baseUrl, params) {
  const [basePart, queryPart] = baseUrl.includes("?")
    ? baseUrl.split("?")
    : [baseUrl, ""];
  const search = new URLSearchParams(queryPart);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.append(key, value);
    }
  }

  return [basePart, search.toString()].join("?");
}

/**
 * @returns {string} url without the given param or value
 * @param {string} baseUrl
 * @param {string} param to be removed
 */
export function removeParam(baseUrl, param) {
  const [basePart, queryPart] = baseUrl.includes("?")
    ? baseUrl.split("?")
    : [baseUrl, ""];
  const search = new URLSearchParams(queryPart);
  search.delete(param);

  return [basePart, search.toString()].join("?");
}
