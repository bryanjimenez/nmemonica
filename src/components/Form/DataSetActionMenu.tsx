import { Button, Dialog, DialogContent } from "@mui/material";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CloudIcon,
  DatabaseIcon,
  FileBinaryIcon,
  FileZipIcon,
} from "@primer/octicons-react";
import { useCallback } from "react";

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
    <Dialog
      open={visible === true}
      onClose={close}
      aria-label={"DataSet action menu"}
    >
      <DialogContent>
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
              icon1: (p: Record<string, string>) => (
                <ArrowDownLeftIcon {...p} />
              ),
            },
            {
              name: "Import from Sync",
              handler: importFromSyncCB,
              icon0: (p: Record<string, string>) => <CloudIcon {...p} />,
              icon1: (p: Record<string, string>) => (
                <ArrowDownLeftIcon {...p} />
              ),
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
