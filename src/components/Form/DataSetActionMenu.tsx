import { Button } from "@mui/material";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CloudIcon,
  DatabaseIcon,
  FileBinaryIcon,
  FileZipIcon,
} from "@primer/octicons-react";
import { useCallback } from "react";

import DialogMsg from "./DialogMsg";

interface DataSetActionMenuProps {
  visible?: boolean;
  close: () => void;
  saveChanges: () => void;
  importFromFile: () => void;
  importFromSync: () => void;
  exportToFile: () => void;
  exportToSync: () => void;
}

export function DataSetActionMenu(props: DataSetActionMenuProps) {
  const {
    visible,
    close,
    saveChanges,
    importFromFile,
    importFromSync,
    exportToFile,
    exportToSync,
  } = props;

  const saveChangesCB = useCallback(() => {
    saveChanges();
    close();
  }, [close, saveChanges]);

  const importFromFileCB = useCallback(() => {
    importFromFile();
    close();
  }, [close, importFromFile]);

  const importFromSyncCB = useCallback(() => {
    importFromSync();
    close();
  }, [close, importFromSync]);

  const exportToFileCB = useCallback(() => {
    exportToFile();
    close();
  }, [close, exportToFile]);

  const exportToSyncCB = useCallback(() => {
    exportToSync();
    close();
  }, [close, exportToSync]);

  return (
    <DialogMsg title="" onClose={close} open={visible === true}>
      <div className="d-flex flex-column">
        {[
          {
            name: "Save Changes",
            handler: saveChangesCB,
            icon0: (p: Record<string, string>) => <DatabaseIcon {...p} />,
            icon1: (p: Record<string, string>) => <ArrowUpRightIcon {...p} />,
          },
          {
            name: "Import from file",
            handler: importFromFileCB,
            icon0: (p: Record<string, string>) => <FileBinaryIcon {...p} />,
            icon1: (p: Record<string, string>) => <ArrowDownLeftIcon {...p} />,
          },
          {
            name: "Import from Sync",
            handler: importFromSyncCB,
            icon0: (p: Record<string, string>) => <CloudIcon {...p} />,
            icon1: (p: Record<string, string>) => <ArrowDownLeftIcon {...p} />,
          },
          {
            name: "Export to file",
            handler: exportToFileCB,
            icon0: (p: Record<string, string>) => <FileZipIcon {...p} />,
            icon1: (p: Record<string, string>) => <ArrowUpRightIcon {...p} />,
          },
          {
            name: "Export to Sync",
            handler: exportToSyncCB,
            icon0: (p: Record<string, string>) => <CloudIcon {...p} />,
            icon1: (p: Record<string, string>) => <ArrowUpRightIcon {...p} />,
          },
        ].map((el) => {
          const primaryIcoProps = {
            size: "medium",
            className: "ms-4 ps-2",
          };
          const secondaryIcoProps = {
            size: "small",
            className: "me-3 pe-1 mt-1 position-absolute top-0 end-0",
          };

          return (
            <Button
              key={el.name}
              aria-label={el.name}
              variant="outlined"
              size="small"
              onClick={el.handler}
              style={{ textTransform: "none" }}
              className="py-0 mb-1"
            >
              <div className="d-flex w-100 justify-content-between">
                <span className="mt-2">{el.name}</span>
                <div className="position-relative">
                  {el.icon0(primaryIcoProps)}
                  {el.icon1(secondaryIcoProps)}
                </div>
              </div>
            </Button>
          );
        })}
        {/* 
        <div className="d-flex justify-content-between w-100 mt-1 border border-primary-sublte rounded">
          <Button
            aria-label="Import from Sync"
            variant="text"
            size="small"
            onClick={importFromSyncCB}
            style={{ textTransform: "none" }}
          >
            Import from Sync
          </Button>
          <div className="position-relative p-2">
            <CloudIcon
              size="medium"
              className="p-1 pt-1 pb-1 position-absolute top-0 end-0"
            />
            <ArrowDownIcon
              size="small"
              className="me-1 pe-1 mt-2 position-absolute top-0 end-0"
            />
          </div>
        </div> */}
      </div>
    </DialogMsg>
  );
}
