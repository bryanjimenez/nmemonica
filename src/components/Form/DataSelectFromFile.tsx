import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  ReplyIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import React, {
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";

import { FileErrorCause, buildMsgCSVError } from "../../helper/csvHelper";
import { metaDataNames, workbookSheetNames } from "../../helper/sheetHelper";
import {
  SyncDataFile,
  parseCsvToSheet,
  parseJSONToStudyProgress,
  parseJSONToUserSettings,
} from "../../helper/transferHelper";
import {
  type AppProgressState,
  type AppSettingState,
  type RootState,
} from "../../slices";
import { properCase } from "../Games/KanjiGame";
import "../../css/DragDrop.css";

interface DataSelectFromFileProps {
  data: SyncDataFile[];
  addWarning: React.Dispatch<React.SetStateAction<React.JSX.Element[]>>;
  updateDataHandler: React.Dispatch<React.SetStateAction<SyncDataFile[]>>;
}

export function DataSelectFromFile(props: DataSelectFromFileProps) {
  const { updateDataHandler, data, addWarning } = props;
  const { darkMode } = useSelector(({ global }: RootState) => global);

  const [onHover, setOnHover] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const overElHandler = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    setOnHover(true);
    return false;
  }, []);

  const removeHandler = useCallback(
    (item: SyncDataFile) => {
      updateDataHandler((prev) => {
        if (
          prev.find((p) => p.name.toLowerCase() === item.name.toLowerCase()) ===
          undefined
        ) {
          // add it
          return [...prev, item];
        } else {
          // remove it
          return prev.filter(
            (p) => p.name.toLowerCase() !== item.name.toLowerCase()
          );
        }
      });
    },
    [updateDataHandler]
  );

  const updateHandler = useCallback(
    (item: SyncDataFile) => {
      updateDataHandler((prev) => {
        if (
          prev.find((p) => p.name.toLowerCase() === item.name.toLowerCase()) ===
          undefined
        ) {
          // add it
          return [...prev, item];
        } else {
          // update it
          return [
            ...prev.filter(
              (p) => p.name.toLowerCase() !== item.name.toLowerCase()
            ),
            item,
          ];
        }
      });
    },
    [updateDataHandler]
  );

  const previewSelFiles = useCallback(
    (files: File[]) => {
      addWarning([]);

      const allowedFiles = Object.values({
        ...workbookSheetNames,
        ...metaDataNames,
      }).map((e) => e.file);

      for (const fileItem of files) {
        if (fileItem === null) {
          continue;
        }

        let w = initWarnings(fileItem, allowedFiles);

        if (w.length === 0) {
          void fileItem.text().then(async (text) => {
            if (fileItem.name.toLowerCase().endsWith(".csv")) {
              try {
                const dot = fileItem.name.indexOf(".");
                const sheetName = properCase(
                  fileItem.name.slice(0, dot > -1 ? dot : undefined)
                );
                const sheet = await parseCsvToSheet(text, sheetName);

                if (
                  data.find(
                    (to) =>
                      to.name === sheet.name &&
                      to.file === JSON.stringify(sheet)
                  ) === undefined
                ) {
                  updateHandler({
                    name: sheet.name.toLowerCase(),
                    fileName: `${sheet.name}.csv`,
                    origin: "FileSystem",
                    file: text,
                  });
                }
              } catch (exception) {
                // default message
                let key = `${fileItem.name}-parse`;
                let msg = `Failed to parse (${fileItem.name})`;

                if (exception instanceof Error && "cause" in exception) {
                  ({ key, msg } = buildMsgCSVError(fileItem.name, exception));
                }

                const errMsg = <span key={key}>{msg}</span>;

                addWarning((warn) => [...warn, ...w, errMsg]);
              }
            } else if (fileItem.name.toLowerCase().endsWith(".json")) {
              let name: string | undefined;
              let parsed:
                | Partial<AppSettingState>
                | Partial<AppProgressState>
                | Error;

              if (
                fileItem.name.toLowerCase() ===
                metaDataNames.settings.file.toLowerCase()
              ) {
                name = metaDataNames.settings.prettyName;
                parsed = parseJSONToUserSettings(text);
              } else if (
                fileItem.name.toLowerCase() ===
                metaDataNames.progress.file.toLowerCase()
              ) {
                name = metaDataNames.progress.prettyName;
                parsed = parseJSONToStudyProgress(text);
              } else {
                name = fileItem.name;
                parsed = new Error(`Unknown file ${fileItem.name}`, {
                  cause: {
                    code: FileErrorCause.UnexpectedFile,
                    details: fileItem.name,
                  },
                });
              }

              if (parsed instanceof Error) {
                const { key, msg } = buildMsgCSVError(fileItem.name, parsed);
                w = [...w, <span key={key}>{msg}</span>];
                addWarning((warn) => [...warn, ...w]);
                return;
              }

              if (
                data.find(
                  (to) => to.name === name && to.file === JSON.stringify(parsed)
                ) === undefined
              ) {
                // only append if missing
                updateHandler({
                  name: name.toLowerCase(),
                  fileName: `${name}.json`,
                  origin: "FileSystem",
                  file: text,
                });
              }
            }
          });
        } else {
          addWarning((warn) => [...warn, ...w]);
        }
      } // loop
    },
    [data, updateHandler, addWarning]
  );

  const dragDropHandler = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      setOnHover(false);

      const {
        dataTransfer: { items },
      } = e;

      const files = Array.from(items).reduce<File[]>((acc, f) => {
        const file = f.getAsFile();
        return file ? [...acc, file] : acc;
      }, []);

      previewSelFiles(files);
    },
    [previewSelFiles]
  );

  const items = useMemo(
    () =>
      Object.values({ ...workbookSheetNames, ...metaDataNames }).map((el) => {
        const { prettyName, file } = el;
        const name = prettyName.toLowerCase();
        const dataItem = data.find((d) => d.name.toLowerCase() === name);

        return (
          <div key={name} className="d-flex justify-content-between">
            <div className="me-5">
              <span
                className={classNames({
                  "col fs-6": true,
                  "opacity-25": dataItem?.name.toLowerCase() !== name,
                })}
              >
                {file}
              </span>
            </div>
            <div>
              <div className="row">
                <span className="col px-1">
                  {/* {dataItem?.sheet ? dataItem.sheet.rows.len : ""} */}
                </span>
                <div className="col px-1">
                  {dataItem?.origin === "AppCache" && <DatabaseIcon />}
                  {dataItem?.origin === "FileSystem" && <FileDirectoryIcon />}
                </div>
                <div
                  className={classNames({
                    "col px-1 clickable": true,
                    "opacity-25": !dataItem,
                  })}
                  onClick={() => {
                    if (dataItem !== undefined) {
                      removeHandler(dataItem);
                    }
                  }}
                >
                  {dataItem ? (
                    <XIcon />
                  ) : (
                    <DiamondIcon className="rotate-45 px-0 opacity-0" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }),
    [data, removeHandler]
  );

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".csv,.json"
        className="d-none"
        onChange={(ev) => previewSelFiles(Array.from(ev.target.files ?? []))}
      />

      <div className="text-center m-0 mb-1">
        <div
          className={classNames({
            "drag-area": true,
            "d-flex flex-column border rounded px-3": true,
            clickable: true,
            "dark-mode": darkMode,
            "dash-border": onHover,
          })}
          onDragOver={overElHandler}
          onDrop={dragDropHandler}
          onClick={(ev) => {
            const { parentElement } = ev.target as HTMLInputElement;

            if (
              parentElement !== null &&
              // "className" in parentElement &&
              typeof parentElement.className === "string" &&
              parentElement?.className.includes("drag-area")
            ) {
              fileInputRef.current?.click();
            }
          }}
        >
          <div>
            <span
              className={classNames({ "fs-6": true, "opacity-25": !onHover })}
            >
              Drag and Drop
            </span>
            <div
              className={classNames({
                "pe-2": true,
                "d-inline-block": true,
                "opacity-25": !onHover,
              })}
              style={{ transform: "rotate(90deg) scaleX(-1)" }}
            >
              <ReplyIcon />
            </div>
          </div>
          <div
            className={classNames({
              "d-flex justify-content-between fs-x-small": true,
              "opacity-25": data.length === 0,
            })}
          >
            <div>
              <span className="col">Name</span>
            </div>
            <div className="row">
              <span className="col px-2">Rows</span>
              <span className="col px-2">Source</span>
            </div>
          </div>
          {items}
        </div>
      </div>
    </>
  );
}

function initWarnings(fileItem: File, allowedFiles: string[]) {
  let w: ReactElement[] = [];

  if (
    allowedFiles.find(
      (allowed) => allowed.toLowerCase() === fileItem.name.toLowerCase()
    ) === undefined
  ) {
    w = [
      ...w,
      <span
        key={`${fileItem.name}-name`}
      >{`File (${fileItem.name}) is not correctly named`}</span>,
    ];
  }
  if (
    fileItem.name.toLowerCase().endsWith(".csv") &&
    fileItem.type !== "text/csv"
  ) {
    w = [
      ...w,
      <span
        key={`${fileItem.name}-type`}
      >{`${fileItem.name} is not a proper csv file.`}</span>,
    ];
  }
  if (
    fileItem.name.toLowerCase().endsWith(".json") &&
    fileItem.type !== "application/json"
  ) {
    w = [
      ...w,
      <span
        key={`${fileItem.name}-type`}
      >{`${fileItem.name} is not a proper json file.`}</span>,
    ];
  }

  return w;
}
