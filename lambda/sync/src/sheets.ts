import { google } from "googleapis";

/**
 * Returns a range as a 2D String Array of the specified sheet
 * @param {string} spreadsheetId
 * @param {string} range
 */
export function fetchGSheetsData(spreadsheetId: string, range: string) {
  const sheetDataPromise = google.auth
    .getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })
    .then((auth) => {
      const api = google.sheets({ version: "v4", auth });

      return new Promise<string[][]>((resolve, reject) => {
        api.spreadsheets.values.get(
          { spreadsheetId, range },
          (err, response) => {
            if (err) {
              reject(new Error("The API returned an error: " + err));
            } else if (!response || !Array.isArray(response.data.values)) {
              reject(new Error("The API returned no data"));
            } else {
              const rows = response.data.values;
              resolve(rows);
            }
          }
        );
      });
    });

  return sheetDataPromise;
}
