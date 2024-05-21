import { Alert, Button } from "@mui/material";
import { type FilledSheetData } from "@nmemonica/snservice";
import {
  CheckCircleIcon,
  DownloadIcon,
  UploadIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import React, { ReactElement, useCallback, useState } from "react";

import DialogMsg from "./DialogMsg";
import { readCsvToSheet } from "../../slices/sheetSlice";

interface DragDropSyncProps {
  visible?: boolean;
  close: () => void;
}

export function DragDropSync(props: DragDropSyncProps) {
  const { visible, close } = props;

  const [data, setData] = useState<FilledSheetData[]>([]);
  const [warning, setWarning] = useState<ReactElement[]>([]);
  const [onHover, setOnHover] = useState<string | undefined>(undefined);

  const closeDragDropSync = useCallback(() => {
    close();
    setWarning([]);
    setOnHover(undefined);
    setData([]);
  }, [close]);

  const overElHandler = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setOnHover(e.currentTarget.id);
  }, []);

  const dragDropHandler = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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

    let name = e.currentTarget.id;

    if (name.toLowerCase() + ".csv" !== f.name.toLowerCase()) {
      w = [
        ...w,
        <span
          key={`${f.name}-name`}
        >{`File is not correctly named ${name} (${f.name} instead)`}</span>,
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

        const text = result as string;

        const sheetName = name;
        try {
          const obj = await readCsvToSheet(text, sheetName);
          setData((data) => [...data, obj]);
        } catch (_err) {
          w = [
            ...w,
            <span key={`${f.name}-parse`}>{`Failed to parse ${f.name})`}</span>,
          ];
          setWarning((warn) => [...warn, ...w]);
        }
      };

      reader.readAsText(f);
    } else {
      setWarning((warn) => [...warn, ...w]);
    }
  }, []);

  return (
    <DialogMsg
      open={visible === true}
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
          const name = el.name.toLowerCase().slice(0, el.name.indexOf("."));
          const dataItem = data.find((d) => d.name.toLowerCase() === name);

          return (
            <div
              id={name}
              key={name}
              className="col d-flex flex-column border px-4"
              onDragOver={overElHandler}
              // onDrop={dragDropHandler}
              onDropCapture={dragDropHandler}
            >
              <span
                className={classNames({
                  "fs-6 opacity-25": true,
                  "opacity-50": onHover === name,
                })}
              >
                {dataItem ? `Rows: ${dataItem.rows.len}` : "Drop"}
              </span>
              <span
                className={classNames({
                  "fs-4 opacity-25": true,
                  "opacity-50": onHover === name,
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
                    "opacity-50": onHover === name,
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
        <div>number</div>
        <div className="d-flex">
          <div className="me-2">
            <Button
              aria-label="Import Datasets from disk"
              variant="outlined"
              size="small"
              disabled={data.length < 1}
              onClick={() => {
                // TODO: import datasets
                console.log("Saving datasets");
                console.log(data);
              }}
            >
              {/* {backedUp ? (
            <CheckCircleIcon size="small" className="pe-1" />
          ) : ( */}
              <DownloadIcon size="small" className="pe-1" />
              {/* )} */}
              Import
            </Button>
          </div>
          <Button
            aria-label="Share Datasets"
            variant="outlined"
            size="small"
            disabled={data.length < 1}
            onClick={() => {
              // TODO: upload datasets to share
              console.log("Sharing datasets");
              console.log(data);
            }}
          >
            {/* {backedUp ? (
            <CheckCircleIcon size="small" className="pe-1" />
          ) : ( */}
            <UploadIcon size="small" className="pe-1" />
            {/* )} */}
            Share
          </Button>
        </div>
      </div>
    </DialogMsg>
  );
}
