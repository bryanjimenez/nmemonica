import { Alert } from "@mui/material";
import { FilledSheetData } from "@nmemonica/snservice";
import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  ReplyIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import React, { ReactElement, useCallback, useState } from "react";

import { LocalStorageState } from "../../slices";
import { readCsvToSheet } from "../../slices/sheetSlice";
import { properCase } from "../Games/KanjiGame";
import { metaDataNames, workbookSheetNames } from "../Pages/Sheet";
import "../../css/DragDrop.css";

export interface TransferObject {
  name: string;
  origin: "AppCache" | "FileSystem";
  text: string;
  sheet?: FilledSheetData;
  setting?: Partial<LocalStorageState>;
}

interface DataSetFromDragDropProps {
  data: TransferObject[];
  updateDataHandler: (data: TransferObject) => void;
}

export function DataSetFromDragDrop(props: DataSetFromDragDropProps) {
  const { updateDataHandler, data } = props;

  const [warning, setWarning] = useState<ReactElement[]>([]);
  const [onHover, setOnHover] = useState<boolean>();

  const overElHandler = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setOnHover(true);
  }, []);

  const dragDropHandler = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      setOnHover(undefined);

      const dt = e.dataTransfer;
      const file = dt.files;

      const f = file.item(0);
      if (f === null) {
        return;
      }

      let w: ReactElement[] = [];
      if (file.length !== 1) {
        w = [
          ...w,
          <span
            key={`${f.name}-name`}
          >{`Expected one file (${file.length} instead)`}</span>,
        ];
      }

      const allowedFiles = Object.values({
        ...workbookSheetNames,
        ...metaDataNames,
      }).map((e) => e.file);
      const isSettings =
        f.name.toLowerCase() === metaDataNames.userSettings.file.toLowerCase();

      if (
        allowedFiles.find((ff) => ff.toLowerCase() === f.name.toLowerCase()) ===
        undefined
      ) {
        w = [
          ...w,
          <span
            key={`${f.name}-name`}
          >{`File (${f.name}) is not correctly named`}</span>,
        ];
      }
      if (!isSettings && f.type !== "text/csv") {
        w = [
          ...w,
          <span
            key={`${f.name}-type`}
          >{`${f.name} is not a proper csv file.`}</span>,
        ];
      }
      if (isSettings && f.type !== "application/json") {
        w = [
          ...w,
          <span
            key={`${f.name}-type`}
          >{`${f.name} is not a proper json file.`}</span>,
        ];
      }

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
            const sheetName = properCase(f.name.slice(0, f.name.indexOf(".")));
            const xObj = await readCsvToSheet(text, sheetName);
            // TODO: verify xObj (headers) prevent bad data sharing

            updateDataHandler({
              name: xObj.name,
              origin: "FileSystem",
              text,
              sheet: xObj,
            });
          } catch (_err) {
            w = [
              ...w,
              <span
                key={`${f.name}-parse`}
              >{`Failed to parse (${f.name})`}</span>,
            ];
            setWarning((warn) => [...warn, ...w]);
          }
        };

        reader.readAsText(f);
        // reader.readAsArrayBuffer(f);
      } else if (isSettings && w.length === 0) {
        void f
          .text()
          .then((text) => {
            const s = JSON.parse(text) as Partial<LocalStorageState>;
            // TODO: settings.json extra validations
            updateDataHandler({
              name: metaDataNames.userSettings.prettyName,
              origin: "FileSystem",
              text,
              setting: s,
            });
          })
          .catch((_err) => {
            w = [
              ...w,
              <span
                key={`${f.name}-parse`}
              >{`Failed to parse (${f.name})`}</span>,
            ];
            setWarning((warn) => [...warn, ...w]);
          });
      } else {
        setWarning((warn) => [...warn, ...w]);
      }
    },
    [updateDataHandler]
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

      <div className="text-center m-0 mb-1">
        <div
          className={classNames({
            "d-flex flex-column border rounded px-3": true,
            "dash-border": onHover,
          })}
          onDragOver={overElHandler}
          onDropCapture={dragDropHandler}
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
          <div className="d-flex justify-content-between fs-x-small opacity-25">
            <div>
              <span className="col">Name</span>
            </div>
            <div className="row">
              <span className="col px-2">Rows</span>
              <span className="col px-2">Source</span>
            </div>
          </div>
          {Object.values({ ...workbookSheetNames, ...metaDataNames }).map((el) => {
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
                      {dataItem?.origin === "FileSystem" && (
                        <FileDirectoryIcon />
                      )}
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
          })}
          {/* <span className="fs-6 opacity-25">Here</span> */}
        </div>
      </div>
    </>
  );
}
