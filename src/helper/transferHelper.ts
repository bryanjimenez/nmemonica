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
 * @param text whole csv text file
 * @param sheetName name of sheet
 */
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

  const objP = readCsvToSheet_INTERNAL(text, sheetName);

  return objP.then((sheet) => {
    sheetDataToJSON(sheet);
    // TODO: check csv column contains expected datatypes
    return sheet;
  });
}

/**
 * Settings text to object parser
 * @param jsonText settings in json format
 * @throws when text contains invalid characters or if json is malformed
 */
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
    return new Error(`Malformed JSON ${metaDataNames.settings.prettyName}`, {
      cause: { code: JSONErrorCause.InvalidJSONStructure },
    });
  }
}

/**
 * Study Progress text to object parser
 * @param jsonText study progress in json format
 * @throws when text contains invalid characters or if json is malformed
 */
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
    return new Error(`Malformed JSON ${metaDataNames.progress.prettyName}`, {
      cause: { code: JSONErrorCause.InvalidJSONStructure },
    });
  }
}

/**
 * Gathers datasets from file system or app memory
 */
export function dataTransferAggregator<
  T extends { name: string; file?: string },
>(fileData?: T[]): Promise<SyncDataFile[]> {
  const makeFileName = (name: string) =>
    `${name}.${Object.keys(workbookSheetNames).includes(name.toLowerCase()) ? "csv" : "json"}`;

  const calculateFileSize = (name: string, file: string) => {
    // TODO: properly calculateFileSize
    const ext = Object.keys(workbookSheetNames).includes(name.toLowerCase())
      ? "csv"
      : "json";

    if (ext === "json") {
      return `~${toMemorySize(file.length)}`;
    } else {
      // convertcsvtoobj and get row len
      return "0";
    }
  };

  // get everything if left unspecified
  let req: SyncDataFile[] =
    fileData !== undefined
      ? fileData.map(({ name, file }) => ({
          name: name.toLowerCase(),
          origin: file === undefined ? "AppCache" : "FileSystem",
          file: file === undefined ? "" : file,
          size: file === undefined ? "0" : calculateFileSize(name, file),
          fileName: makeFileName(name),
        }))
      : [
          {
            name: workbookSheetNames.kanji.prettyName,
            origin: "AppCache",
            file: "",
            size: "0",
            fileName: workbookSheetNames.kanji.file,
          },
          {
            name: workbookSheetNames.vocabulary.prettyName,
            origin: "AppCache",
            file: "",
            size: "0",
            fileName: workbookSheetNames.vocabulary.file,
          },
          {
            name: workbookSheetNames.phrases.prettyName,
            origin: "AppCache",
            file: "",
            size: "0",
            fileName: workbookSheetNames.phrases.file,
          },
          {
            name: metaDataNames.settings.prettyName,
            origin: "AppCache",
            file: "",
            size: "0",
            fileName: metaDataNames.settings.file,
          },
          {
            name: metaDataNames.progress.prettyName,
            origin: "AppCache",
            file: "",
            size: "0",
            fileName: metaDataNames.progress.file,
          },
        ];

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
              .then((d) =>
                d.map(
                  ({ name, text }) =>
                    ({
                      name: name.toLowerCase(),
                      origin: "AppCache",
                      fileName: `${name}.csv`,
                      file: text,
                    }) as SyncDataFile
                )
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
              .then((setting) => [
                {
                  name: metaDataNames.settings.prettyName.toLowerCase(),
                  origin: "AppCache",
                  fileName: `${metaDataNames.settings.prettyName}.json`,
                  file: JSON.stringify(setting),
                } as SyncDataFile,
              ])
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
              .then((progress) => [
                {
                  name: metaDataNames.progress.prettyName.toLowerCase(),
                  origin: "AppCache",
                  fileName: `${metaDataNames.progress.prettyName}.json`,
                  file: JSON.stringify(progress),
                } as SyncDataFile,
              ])
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
