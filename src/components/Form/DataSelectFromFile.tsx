import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  ReplyIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { toMemorySize } from "../../helper/consoleHelper";
import { metaDataNames, workbookSheetNames } from "../../helper/sheetHelper";
import {
  SyncDataFile,
  parseSettingsAndProgress,
  parseSheet,
} from "../../helper/transferHelper";
import { type RootState } from "../../slices";
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

      void Promise.all(
        files.reduce<Promise<{ fileName: string; file: string }>[]>(
          (acc, fileItem) => {
            if (fileItem === null) {
              return acc;
            }
            const f = fileItem
              .text()
              .then((text) => ({ fileName: fileItem.name, file: text }));
            return [...acc, f];
          },
          []
        )
      ).then((fileObj) => {
        const {
          settings,
          progress,
          errors: metaWarns,
        } = parseSettingsAndProgress(fileObj);

        metaWarns.forEach(({ cause: { key, msg } }) => {
          const errMsg = <span key={key}>{msg}</span>;
          addWarning((warn) => [...warn, errMsg]);
        });

        const s =
          settings === undefined
            ? []
            : [{ name: metaDataNames.settings.prettyName, value: settings }];
        const p =
          progress === undefined
            ? []
            : [{ name: metaDataNames.progress.prettyName, value: progress }];

        [...s, ...p].forEach(({ name, value }) => {
          const text = JSON.stringify(value);
          if (
            data.find(
              (to) => to.name === name && to.file === JSON.stringify(value)
            ) === undefined
          ) {
            // only append if missing
            updateHandler({
              name: name.toLowerCase(),
              fileName: `${name}.json`,
              origin: "FileSystem",
              file: text,
              size: `~${toMemorySize(text.length)}`,
            });
          }
        });

        void parseSheet(fileObj).then((sheetPromiseArr) => {
          sheetPromiseArr.forEach((r) => {
            if (r.status !== "fulfilled") {
              return;
            }

            if (r.value instanceof Error) {
              const { key, msg } = r.value.cause;

              const sheetWarns = <span key={key}>{msg}</span>;
              addWarning((warn) => [...warn, sheetWarns]);
              return;
            }

            const { sheet, file } = r.value;
            if (
              data.find(
                (to) =>
                  to.name === sheet.name && to.file === JSON.stringify(sheet)
              ) === undefined
            ) {
              updateHandler({
                name: sheet.name.toLowerCase(),
                fileName: `${sheet.name}.csv`,
                origin: "FileSystem",
                file,
                size: String(sheet.rows.len),
              });
            }
          });
        });
      });
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
                <span className="col px-1">{dataItem?.size ?? ""}</span>
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
