import { Alert } from "@mui/material";
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

import { metaDataNames, workbookSheetNames } from "../../helper/sheetHelper";
import { type FilledSheetData } from "../../helper/sheetHelperImport";
import { AppSettingState, RootState } from "../../slices";
import { readCsvToSheet } from "../../slices/sheetSlice";
import { properCase } from "../Games/KanjiGame";
import "../../css/DragDrop.css";

export interface TransferObject {
  name: string;
  origin: "AppCache" | "FileSystem";
  text: string;
  sheet?: FilledSheetData;
  setting?: Partial<AppSettingState>;
}

interface DataSetFromDragDropProps {
  data: TransferObject[];
  updateDataHandler: (data: TransferObject) => void;
}

export function DataSetFromDragDrop(props: DataSetFromDragDropProps) {
  const { updateDataHandler, data } = props;
  const { darkMode } = useSelector(({ global }: RootState) => global);

  const [warning, setWarning] = useState<ReactElement[]>([]);
  const [onHover, setOnHover] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const overElHandler = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    setOnHover(true);
    return false;
  }, []);

  const previewSelFiles = useCallback(
    (files: File[]) => {
      const allowedFiles = Object.values({
        ...workbookSheetNames,
        ...metaDataNames,
      }).map((e) => e.file);

      for (const fileItem of files) {
        if (fileItem === null) {
          continue;
        }

        const isSettings =
          fileItem.name.toLowerCase() ===
          metaDataNames.settings.file.toLowerCase();

        let w = initWarnings(fileItem, isSettings, allowedFiles);

        if (!isSettings && w.length === 0) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            if (e.target === null) return;
            const { result } = e.target;
            if (result === null) return;

            const text = result as string;

            // const b = new Uint8Array(result as ArrayBuffer);
            // const text = new TextDecoder("utf-8").decode(b);

            try {
              const dot = fileItem.name.indexOf(".");
              const sheetName = properCase(
                fileItem.name.slice(0, dot > -1 ? dot : undefined)
              );
              const xObj = await readCsvToSheet(text, sheetName);
              // TODO: verify xObj (headers) prevent bad data sharing
              // sheetDataToJSON()

              if (
                data.find(
                  (to) =>
                    to.name === xObj.name &&
                    JSON.stringify(to.sheet) === JSON.stringify(xObj)
                ) === undefined
              ) {
                updateDataHandler({
                  name: xObj.name,
                  origin: "FileSystem",
                  text,
                  sheet: xObj,
                });
              }
            } catch {
              w = [
                ...w,
                <span
                  key={`${fileItem.name}-parse`}
                >{`Failed to parse (${fileItem.name})`}</span>,
              ];
              setWarning((warn) => [...warn, ...w]);
            }
          };

          reader.readAsText(fileItem);
        } else if (isSettings && w.length === 0) {
          void fileItem
            .text()
            .then((text) => {
              const s = JSON.parse(text) as Partial<AppSettingState>;
              // TODO: settings.json verify is AppSettingState

              if (
                data.find(
                  (to) =>
                    to.name === metaDataNames.settings.prettyName &&
                    JSON.stringify(to.setting) === JSON.stringify(s)
                ) === undefined
              ) {
                updateDataHandler({
                  name: metaDataNames.settings.prettyName,
                  origin: "FileSystem",
                  text,
                  setting: s,
                });
              }
            })
            .catch(() => {
              w = [
                ...w,
                <span
                  key={`${fileItem.name}-parse`}
                >{`Failed to parse (${fileItem.name})`}</span>,
              ];
              setWarning((warn) => [...warn, ...w]);
            });
        } else {
          setWarning((warn) => [...warn, ...w]);
        }
      }
    },
    [data, updateDataHandler]
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
                  {dataItem?.sheet ? dataItem.sheet.rows.len : ""}
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
                    if (dataItem) {
                      updateDataHandler(dataItem);
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
    [data, updateDataHandler]
  );

  return (
    <>
      {warning.length > 0 && (
        <Alert severity="warning" className="py-0 mb-1">
          <div className="p-0 d-flex flex-column">
            <ul className="mb-0">
              {warning.map((el) => (
                <li key={el.key}>{el}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

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
          onClick={() => {
            fileInputRef.current?.click();
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

function initWarnings(
  fileItem: File,
  isSettings: boolean,
  allowedFiles: string[]
) {
  let w: ReactElement[] = [];

  if (
    allowedFiles.find(
      (ff) => ff.toLowerCase() === fileItem.name.toLowerCase()
    ) === undefined
  ) {
    w = [
      ...w,
      <span
        key={`${fileItem.name}-name`}
      >{`File (${fileItem.name}) is not correctly named`}</span>,
    ];
  }
  if (!isSettings && fileItem.type !== "text/csv") {
    w = [
      ...w,
      <span
        key={`${fileItem.name}-type`}
      >{`${fileItem.name} is not a proper csv file.`}</span>,
    ];
  }
  if (isSettings && fileItem.type !== "application/json") {
    w = [
      ...w,
      <span
        key={`${fileItem.name}-type`}
      >{`${fileItem.name} is not a proper json file.`}</span>,
    ];
  }

  return w;
}
