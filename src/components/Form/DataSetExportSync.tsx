import { Button, Dialog, DialogContent } from "@mui/material";
import { FilledSheetData } from "@nmemonica/snservice";
import {
  ArrowSwitchIcon,
  CheckCircleIcon,
  DatabaseIcon,
  FileDirectoryIcon,
  UploadIcon,
} from "@primer/octicons-react";
import { ReactElement, useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { DataSetFromAppCache } from "./DataSetFromAppCache";
import { DataSetFromDragDrop } from "./DataSetFromDragDrop";
import { syncService } from "../../../environment.development";
import { AppDispatch } from "../../slices";
import { getDatasets } from "../../slices/sheetSlice";
import { getWorkbookFromIndexDB, xObjectToCsvText } from "../Pages/Sheet";

interface DataSetExportSyncProps {
  visible?: boolean;
  close: () => void;
}

export function DataSetExportSync(props: DataSetExportSyncProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { visible, close } = props;

  const [warning, setWarning] = useState<ReactElement[]>([]);

  const [shareId, setShareId] = useState<string>();
  const [source, setSource] = useState<"file" | "app">("app");
  const [fileData, setFileData] = useState<
    {
      name: string;
      source: "app" | "file";
      text: string;
      sheet: FilledSheetData;
    }[]
  >([]);

  const shareDatasetCB = useCallback(
    (payload: { name: string; text: string }[]) => {
      const ws = new WebSocket(syncService);
      ws.binaryType = "arraybuffer";

      ws.addEventListener("error", () => {
        // TODO: display connection error icon
        // eslint-disable-next-line
      console.log("error connecting")
      });

      ws.addEventListener("open", () => {
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
          uid = (JSON.parse(msgData) as { uid: unknown }).uid;

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
    },
    []
  );

  const closeMixedCB = useCallback(() => {
    setFileData([]);
    setShareId(undefined);
    setWarning([]);
    close();
  }, [close]);

  const exportDataSetCB = useCallback(() => {
    const fromApp = fileData.filter((f) => f.source === "app");
    let transferData = Promise.resolve(
      fileData.map((f) => ({
        name: f.name,
        text: f.text,
      }))
    );
    if (fromApp.length > 0) {
      transferData = getWorkbookFromIndexDB(dispatch, getDatasets).then(
        (xObj) => {
          const included = xObj.filter((o) =>
            fromApp.find((a) => a.name.toLowerCase() === o.name.toLowerCase())
          ) as FilledSheetData[];

          return xObjectToCsvText(included).then((dBtoCsv) => [
            ...fileData.filter((f) => f.source === "file"),
            ...dBtoCsv,
          ]);
        }
      );
    }

    void transferData.then((d) => shareDatasetCB(d));
  }, [dispatch, fileData, shareDatasetCB]);

  return (
    <Dialog
      open={visible === true}
      onClose={closeMixedCB}
      aria-label="File drag drop area"
      fullWidth={true}
    >
      <DialogContent className="p-2 m-0">
        <div className="d-flex justify-content-end">
          {source === "file" && (
            <div
              className="clickable"
              onClick={() => {
                setSource("app");
              }}
            >
              <ArrowSwitchIcon className="px-0" /> <DatabaseIcon />
            </div>
          )}
          {source === "app" && (
            <div
              className="clickable"
              onClick={() => {
                setSource("file");
              }}
            >
              <FileDirectoryIcon /> <ArrowSwitchIcon className="px-0" />
            </div>
          )}
        </div>
        {source === "app" && (
          <DataSetFromAppCache
            data={fileData}
            updateDataHandler={(name) => {
              setFileData((prev) => {
                let newPrev: {
                  name: string;
                  source: string;
                  text: string;
                  sheet: FilledSheetData;
                }[] = [];
                // if is not in state add it
                if (prev.find((p) => p.name === name) === undefined) {
                  newPrev = [
                    ...prev,
                    { name, source: "app", text: "", sheet: null },
                  ];
                } else {
                  newPrev = prev.filter((p) => p.name !== name);
                }

                return newPrev;
              });
            }}
          />
        )}
        {source === "file" && (
          <DataSetFromDragDrop
            data={fileData}
            updateDataHandler={(item) => {
              setFileData((prev) => {
                if (
                  prev.find(
                    (p) => p.name.toLowerCase() === item.name.toLowerCase()
                  ) === undefined
                ) {
                  return [...prev, item];
                } else {
                  return prev.filter(
                    (p) => p.name.toLowerCase() !== item.name.toLowerCase()
                  );
                }
              });
            }}
          />
        )}

        <div className="d-flex justify-content-between">
          <div>{shareId}</div>
          <div className="d-flex">
            <Button
              aria-label="Share Datasets"
              variant="outlined"
              size="small"
              disabled={fileData.length < 1 || shareId !== undefined}
              onClick={exportDataSetCB}
              style={{ textTransform: "none" }}
            >
              {shareId !== undefined ? (
                <CheckCircleIcon size="small" className="pe-1" />
              ) : (
                <UploadIcon size="small" className="pe-1" />
              )}
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
