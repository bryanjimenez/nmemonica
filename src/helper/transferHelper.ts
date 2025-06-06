import {
  AppProgressState,
  AppSettingState,
  isValidAppSettingsState,
  isValidStudyProgress,
} from "../slices";
import { toMemorySize } from "./consoleHelper";
import {
  FileErrorCause,
  JSONErrorCause,
  buildMsgCSVError,
  validateCSVSheet,
  validateJSONSettings,
} from "./csvHelper";
import { sheetDataToJSON } from "./jsonHelper";
import {
  getWorkbookFromIndexDB,
  metaDataNames,
  workbookSheetNames,
  xObjectToCsvText,
} from "./sheetHelper";
import { FilledSheetData } from "./sheetHelperImport";
import { unusualApostrophe } from "./unicodeHelper";
import { getStudyProgress, getUserSettings } from "./userSettingsHelper";
import { properCase } from "../components/Games/KanjiGame";
import { readCsvToSheet_INTERNAL } from "../slices/sheetSlice";

export interface SyncDataFile {
  name: string;
  origin: "AppCache" | "FileSystem";
  fileName: string;
  file: string;
  size: string;
}

/**
 * Parse and construct sheet object
 * @param file whole csv text file
 * @param fileName name of sheet
 */
export function parseSheet<
  T extends { fileName: string; file: string },
  E extends Error & { cause: { key: string; msg: string } },
>(csvFiles: T[]) {
  const data = csvFiles.filter((file) =>
    file.fileName.toLowerCase().endsWith(".csv")
  );

  return Promise.allSettled(
    data.map((fileItem) =>
      new Promise<T>((resolve) => resolve(fileItem)).then(
        async ({ fileName, file }) => {
          try {
            const dot = fileName.indexOf(".");
            const name = fileName
              .slice(0, dot > -1 ? dot : undefined)
              .toLowerCase();

            const sheetName = properCase(name);
            if (!Object.keys(workbookSheetNames).includes(name)) {
              let key = `${fileName}-unknown`;
              let msg = `Incorrectly named file ${fileName}`;

              return new Error(msg, { cause: { key, msg } }) as E;
            }

            const sheet = await parseCsvToSheet(file, sheetName);
            return { sheet, file };
          } catch (exception) {
            // default message
            let key = `${fileName}-parse`;
            let msg = `Failed to parse (${fileName})`;

            if (exception instanceof Error && "cause" in exception) {
              ({ key, msg } = buildMsgCSVError(fileName, exception));
            }

            return new Error(msg, { cause: { key, msg } }) as E;
          }
        }
      )
    )
  );
}

/**
 * Settings and Progress files to object parser
 *
 * returns Error when text contains invalid characters or if json is malformed
 * @param jsonFiles list of settings and progress in json format
 */
export function parseSettingsAndProgress<
  T extends { fileName: string; file: string },
  E extends Error & { cause: { key: string; msg: string } },
>(
  jsonFiles: T[]
): {
  settings?: Partial<AppSettingState>;
  progress?: Partial<AppProgressState>;
  errors: E[];
} {
  const meta = jsonFiles.filter((file) =>
    file.fileName.toLowerCase().endsWith(".json")
  );

  return meta.reduce<{
    settings?: Partial<AppSettingState>;
    progress?: Partial<AppProgressState>;
    errors: E[];
  }>(
    (acc, m) => {
      const { fileName, file: text } = m;

      if (
        fileName.toLowerCase() === metaDataNames.settings.fileName.toLowerCase()
      ) {
        const settings = parseJSONToUserSettings(text);

        if (settings instanceof Error) {
          const { key, msg } = buildMsgCSVError(fileName, settings);
          acc.errors = [
            ...acc.errors,
            new Error(msg, { cause: { key, msg } }) as E,
          ];
          return acc;
        }

        acc.settings = settings;
      } else if (
        fileName.toLowerCase() === metaDataNames.progress.fileName.toLowerCase()
      ) {
        const progress = parseJSONToStudyProgress(text);

        if (progress instanceof Error) {
          const { key, msg } = buildMsgCSVError(fileName, progress);
          acc.errors = [
            ...acc.errors,
            new Error(msg, { cause: { key, msg } }) as E,
          ];
          return acc;
        }

        acc.progress = progress;
      } else {
        let key = `${fileName}-unknown`;
        let msg = `Incorrectly named file ${fileName}`;

        acc.errors = [
          ...acc.errors,
          new Error(msg, { cause: { key, msg } }) as E,
        ];
      }

      return acc;
    },
    { errors: [] }
  );
}

export function parseCsvToSheet(text: string, sheetName: string) {
  // replace unsual, but valid symbols with common ones
  text = text.replaceAll(unusualApostrophe, "'");

  const invalidInput = validateCSVSheet(text);

  if (invalidInput.size > 0) {
    return Promise.reject(
      new Error("CSV contains invalid characters", {
        cause: {
          code: FileErrorCause.InvalidCharacters,
          details: invalidInput,
          sheetName,
        },
      })
    );
  }

  // TODO: replace w/ external csv parser
  const objP = readCsvToSheet_INTERNAL(text, sheetName);

  return objP.then((sheet) => {
    sheetDataToJSON(sheet);
    // TODO: check csv column contains expected datatypes
    return sheet;
  });
}

export function parseJSONToUserSettings(jsonText: string) {
  try {
    const invalidInput = validateJSONSettings(jsonText);

    if (invalidInput.size > 0) {
      return new Error("Settings contains invalid characters", {
        cause: {
          code: FileErrorCause.InvalidCharacters,
          details: invalidInput,
        },
      });
    }

    const settingsObject = JSON.parse(jsonText) as Partial<AppSettingState>;
    if (!isValidAppSettingsState(settingsObject)) {
      return new Error(
        `Unrecognized settings in ${metaDataNames.settings.prettyName}`,
        {
          cause: {
            code: FileErrorCause.InvalidContents,
            details: metaDataNames.settings.prettyName,
          },
        }
      );
    }

    return settingsObject;
  } catch {
    return new Error(
      `Invalid JSON in ${metaDataNames.settings.prettyName}.json`,
      {
        cause: { code: JSONErrorCause.InvalidJSONStructure },
      }
    );
  }
}

export function parseJSONToStudyProgress(jsonText: string) {
  try {
    const invalidInput = validateJSONSettings(jsonText);

    if (invalidInput.size > 0) {
      return new Error("Progress contains invalid characters", {
        cause: {
          code: FileErrorCause.InvalidCharacters,
          details: invalidInput,
        },
      });
    }

    const studyProgressObject = JSON.parse(
      jsonText
    ) as Partial<AppProgressState>;
    if (!isValidStudyProgress(studyProgressObject)) {
      return new Error(
        `Unrecognized values in ${metaDataNames.progress.prettyName}`,
        {
          cause: {
            code: FileErrorCause.InvalidContents,
            details: metaDataNames.progress.prettyName,
          },
        }
      );
    }

    return studyProgressObject;
  } catch {
    return new Error(
      `Invalid JSON in ${metaDataNames.progress.prettyName},json`,
      {
        cause: { code: JSONErrorCause.InvalidJSONStructure },
      }
    );
  }
}

/**
 * Gathers datasets from file system or app memory
 */
export function dataTransferAggregator(
  fileData?: SyncDataFile[]
): Promise<SyncDataFile[]> {
  // get everything if left unspecified
  let req: SyncDataFile[] =
    fileData !== undefined
      ? fileData
      : Object.values({...workbookSheetNames, ...metaDataNames}).map(({ prettyName, fileName }) => ({
          name: prettyName,
          origin: "AppCache",
          file: "",
          size: "0",
          fileName,
        }));

  const fromFileSystem = req.filter(({ origin }) => origin === "FileSystem");

  const fromApp = req.filter(({ origin }) => origin === "AppCache");

  return new Promise<SyncDataFile[]>((transferResolve) => {
    if (fromApp.length === 0) {
      // if no requests from app cache
      transferResolve(fromFileSystem);
    } else {
      // some requests from app cache
      // also append requests from filesystem

      const workbookReq = fromApp.filter((req) =>
        Object.keys(workbookSheetNames).includes(req.name.toLowerCase())
      );
      const settingReq = fromApp.filter(
        (req) =>
          req.name.toLowerCase() ===
          metaDataNames.settings.prettyName.toLowerCase()
      );
      const progressReq = fromApp.filter(
        (req) =>
          req.name.toLowerCase() ===
          metaDataNames.progress.prettyName.toLowerCase()
      );

      const workbookText = new Promise<SyncDataFile[]>(
        (bookResolve, bookReject) => {
          if (workbookReq.length > 0) {
            getWorkbookFromIndexDB()
              .then(
                (workbook) =>
                  workbook.filter((sheet) =>
                    workbookReq
                      .map((d) => d.name.toLowerCase())
                      .includes(sheet.name.toLowerCase())
                  ) as FilledSheetData[]
              )
              .then((selectedSheets) => xObjectToCsvText(selectedSheets))
              .then((f) =>
                f.map(({ name, text, len }) => ({
                  name: name.toLowerCase(),
                  origin: "AppCache" as SyncDataFile["origin"],
                  fileName: `${name}.csv`,
                  file: text,
                  size: String(len),
                }))
              )
              .then(bookResolve)
              .catch(bookReject);
            return;
          }
          bookResolve([]);
        }
      );

      const settingText = new Promise<SyncDataFile[]>(
        (settingResolve, settingReject) => {
          if (settingReq.length > 0) {
            getUserSettings()
              .then((setting) => {
                if (Object.keys(setting).length === 0) {
                  return [];
                }
                const file = JSON.stringify(setting);
                return [
                  {
                    name: metaDataNames.settings.prettyName.toLowerCase(),
                    origin: "AppCache" as SyncDataFile["origin"],
                    fileName: metaDataNames.settings.fileName,
                    file,
                    size: `~${toMemorySize(file.length)}`,
                  },
                ];
              })
              .then(settingResolve)
              .catch(settingReject);
            return;
          }

          settingResolve([]);
        }
      );

      const progressText = new Promise<SyncDataFile[]>(
        (progResolve, progReject) => {
          if (progressReq.length > 0) {
            getStudyProgress()
              .then((progress) => {
                if (Object.keys(progress).length === 0) {
                  return [];
                }
                const file = JSON.stringify(progress);
                return [
                  {
                    name: metaDataNames.progress.prettyName.toLowerCase(),
                    origin: "AppCache" as SyncDataFile["origin"],
                    fileName: metaDataNames.progress.fileName,
                    file,
                    size: `~${toMemorySize(file.length)}`,
                  },
                ];
              })
              .then(progResolve)
              .catch(progReject);
            return;
          }

          progResolve([]);
        }
      );

      void Promise.allSettled<SyncDataFile[]>([
        workbookText,
        settingText,
        progressText,
      ])
        .then((result) =>
          result.reduce<SyncDataFile[]>((acc, res) => {
            if (res.status === "fulfilled") {
              return [...acc, ...res.value];
            }
            return acc;
          }, [])
        )
        .then((fromAppCache) => [
          ...fromAppCache,
          // append any filesystem requests (already include text)
          ...fromFileSystem,
        ])
        .then(transferResolve);
    }
  });
}
