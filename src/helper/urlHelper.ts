/**
 * @returns the param
 */
export function getParam(baseUrl:string, param:string) {
  const queryPart = baseUrl.includes("?") ? baseUrl.split("?")[1] : "";
  const search = new URLSearchParams(queryPart);

  const result = search.get(param);
  return result;
}

/**
 * @returns a constructed url using the baseUrl and the params
 */
export function addParam(baseUrl:string, params:Record<string,string>) {
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
 * @returns url without the given param or value
 * @param baseUrl
 * @param param to be removed
 */
export function removeParam(baseUrl:string, param:string) {
  const [basePart, queryPart] = baseUrl.includes("?")
    ? baseUrl.split("?")
    : [baseUrl, ""];
  const search = new URLSearchParams(queryPart);
  search.delete(param);

  return [basePart, search.toString()].join("?");
}
