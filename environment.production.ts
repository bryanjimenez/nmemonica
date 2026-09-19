//@ts-check

// ------------------------------------------------------------
// Constants not found here (prod) will be searched for in dev.
// ------------------------------------------------------------

const uiHost = "https://bryanjimenez.github.io"
export const uiPath = "/nmemonica";
// TODO: put this in an ENV_VAR use it also in package.json
export const uiEndpoint = uiHost + uiPath;
