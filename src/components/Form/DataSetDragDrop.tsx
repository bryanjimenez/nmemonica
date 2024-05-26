import { Alert, Button } from "@mui/material";
import { type FilledSheetData } from "@nmemonica/snservice";
import {
  AlertIcon,
  CheckCircleIcon,
  DownloadIcon,
  UploadIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import React, { ReactElement, useCallback, useRef, useState } from "react";

import DialogMsg from "./DialogMsg";
import { syncService } from "../../../environment.development";
import { readCsvToSheet } from "../../slices/sheetSlice";
import "../../css/DragDropSync.css";

interface DataSetDragDropProps {
  visible?: "sync" | "file";
  close: () => void;
  updateDataHandler: (data: FilledSheetData[]) => Promise<void>;
}

export function DataSetDragDrop(props: DataSetDragDropProps) {
  const { visible, close, updateDataHandler } = props;

  const [fileData, setFileData] = useState<
    { name: string; text: string; sheet: FilledSheetData }[]
  >([]);
  const [importStatus, setImportStatus] = useState<boolean>();
  const [warning, setWarning] = useState<ReactElement[]>([]);
  const [hoverName, setHoverName] = useState<string>();

  const [shareId, setShareId] = useState<string>();
  const socket = useRef<WebSocket>();

  const closeDragDropSync = useCallback(() => {
    close();
    setWarning([]);
    setHoverName(undefined);
    setFileData([]);
    setShareId(undefined);
    setImportStatus(undefined);
    socket.current?.close();
  }, [close]);

  const overElHandler = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setHoverName(e.currentTarget.id);
  }, []);

  const dragDropHandler = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    setHoverName(undefined);

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

    const fileName = e.currentTarget.getAttribute("data-file-name");
    const sheetName = e.currentTarget.getAttribute("data-pretty-name");
    if (fileName === null || sheetName === null) {
      throw new Error("Element should have a data-file-name property");
    }

    if (fileName.toLowerCase() !== f.name.toLowerCase()) {
      w = [
        ...w,
        <span
          key={`${f.name}-name`}
        >{`File (${f.name}) is not correctly named ${fileName}`}</span>,
      ];
    }
    if (f.type !== "text/csv") {
      w = [
        ...w,
        <span
          key={`${f.name}-type`}
        >{`${f.name} is not a proper csv file.`}</span>,
      ];
    }

    if (w.length === 0) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target === null) return;
        const { result } = e.target;
        if (result === null) return;

        // const text = result as string;

        const b = new Uint8Array(result as ArrayBuffer);
        const text = new TextDecoder("utf-8").decode(b);

        // const blob = new Blob([b.buffer], {
        //   type: "application/x-nmemonica-data",
        // });
        // console.log(blob.size);

        try {
          const obj = await readCsvToSheet(text, sheetName);
          setFileData((data) => [
            ...data,
            { name: obj.name, text, sheet: obj },
          ]);
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

      // reader.readAsText(f);
      reader.readAsArrayBuffer(f);
    } else {
      setWarning((warn) => [...warn, ...w]);
    }
  }, []);

  const importDatasetCB = useCallback(() => {
    setImportStatus(undefined);

    void Promise.all(fileData.map((d) => readCsvToSheet(d.text, d.name)))
      .then((dataObj) => updateDataHandler(dataObj))
      .then(() => {
        setImportStatus(true);
        if (visible === "file") {
          setTimeout(close, 1000);
        }
      })
      .catch(() => {
        setImportStatus(false);
      });
  }, [fileData, updateDataHandler]);

  const shareDatasetCB = useCallback(() => {
    const ws = new WebSocket(syncService);
    ws.binaryType = "arraybuffer";

    ws.addEventListener("error", () => {
      // TODO: display connection error icon
      // eslint-disable-next-line
      console.log("error connecting")
    });

    ws.addEventListener("open", () => {
      const payload = fileData.map((d) => ({
        name: d.name,
        text: d.text,
      }));

      const b = new TextEncoder().encode(JSON.stringify(payload));
      const blob = new Blob([b.buffer], {
        type: "application/x-nmemonica-data",
      });

      void blob.arrayBuffer().then((b) => ws.send(b));
    });

    ws.addEventListener("message", (msg: MessageEvent<Blob | string>) => {
      const { data: msgData } = msg;
      if (msgData instanceof Blob === true) {
        setWarning((w) => [
          ...w,
          <span key={`no-share-id`}>{`Expected a share ID`}</span>,
        ]);

        ws.close();
        return;
      }

      let uid: unknown;
      try {
        uid = JSON.parse(msgData).uid;

        // TODO: other ws.send use eventName
        if (typeof uid !== "string") {
          throw new Error("Expected a string ID");
        }
      } catch (_err) {
        setWarning((w) => [
          ...w,
          <span key={`bad-share-id`}>{`Failed to parse share ID`}</span>,
        ]);
        ws.close();
        return;
      }

      setShareId(uid);
      ws.close();
    });
  }, [fileData]);

  return (
    <DialogMsg
      open={visible !== undefined}
      onClose={closeDragDropSync}
      title="Drag & Drop files here:"
      ariaLabel="File drag drop area"
    >
      {warning.length > 0 && (
        <Alert severity={true ? "warning" : "success"} className="py-0 mb-1">
          <div className="p-0 d-flex flex-column">
            <ul className="mb-0">
              {warning.map((el) => (
                <li key={el.key}>{el}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      <div className="row row-cols-1 row-cols-sm-3 h-100 text-center m-0 mb-1">
        {[
          { name: "Phrases.csv" },
          { name: "Vocabulary.csv" },
          { name: "Kanji.csv" },
        ].map((el) => {
          const prettyName = el.name.slice(0, el.name.indexOf("."));
          const name = el.name.toLowerCase().slice(0, el.name.indexOf("."));
          const dataItem = fileData.find((d) => d.name.toLowerCase() === name);

          return (
            <div
              id={name}
              data-file-name={el.name}
              data-pretty-name={prettyName}
              key={name}
              // className="col d-flex flex-column border px-4"
              className={classNames({
                "col d-flex flex-column border px-4": true,
                "dash-border": hoverName === name,
              })}
              onDragOver={overElHandler}
              // onDrop={dragDropHandler}
              onDropCapture={dragDropHandler}
            >
              <span
                className={classNames({
                  "fs-6 opacity-25": true,
                  "opacity-50": hoverName === name,
                })}
              >
                {dataItem ? `Rows: ${dataItem.sheet.rows.len}` : "Drop"}
              </span>
              <span
                className={classNames({
                  "fs-4 opacity-25": true,
                  "opacity-50": hoverName === name,
                })}
              >
                {el.name}
              </span>
              {dataItem ? (
                <CheckCircleIcon
                  size="small"
                  className="col ps-1 pb-1 align-self-center correct-color"
                />
              ) : (
                <span
                  className={classNames({
                    "col fs-6 opacity-25": true,
                    "opacity-50": hoverName === name,
                  })}
                >
                  {"here"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="d-flex justify-content-between">
        <div>{shareId}</div>
        <div className="d-flex">
          {visible === "file" && (
            <Button
              aria-label="Import Datasets from disk"
              variant="outlined"
              size="small"
              disabled={fileData.length < 1 || importStatus === true}
              onClick={importDatasetCB}
            >
              {importStatus === undefined ? (
                <DownloadIcon size="small" className="pe-1" />
              ) : importStatus === true ? (
                <CheckCircleIcon size="small" className="pe-1" />
              ) : (
                <AlertIcon size="small" className="pe-1" />
              )}
              Import
            </Button>
          )}
          {visible === "sync" && (
            <Button
              aria-label="Share Datasets"
              variant="outlined"
              size="small"
              disabled={fileData.length < 1 || shareId !== undefined}
              onClick={shareDatasetCB}
            >
              {shareId !== undefined ? (
                <CheckCircleIcon size="small" className="pe-1" />
              ) : (
                <UploadIcon size="small" className="pe-1" />
              )}
              Share
            </Button>
          )}
        </div>
      </div>
    </DialogMsg>
  );
}
