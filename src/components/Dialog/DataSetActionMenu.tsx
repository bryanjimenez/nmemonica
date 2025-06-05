import { Button, Dialog, DialogContent } from "@mui/material";
import {
  ArrowDownLeftIcon,
  ArrowSwitchIcon,
  ArrowUpRightIcon,
  CloudIcon,
  DatabaseIcon,
  FileBinaryIcon,
  FileZipIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useCallback } from "react";

interface DataSetActionMenuProps {
  visible?: boolean;
  close: () => void;
  saveChanges: () => void;
  importFromFile: () => void;
  exportToFile: () => void;
  signaling: ()=> void;
}

export function DataSetActionMenu(props: DataSetActionMenuProps) {
  const {
    visible,
    close,
    saveChanges,
    importFromFile,
    exportToFile,
    signaling,
  } = props;

  const saveChangesCB = useCallback(() => {
    saveChanges();
    close();
  }, [close, saveChanges]);

  const importFromFileCB = useCallback(() => {
    importFromFile();
  }, [importFromFile]);

  const exportToFileCB = useCallback(() => {
    exportToFile();
    close();
  }, [close, exportToFile]);

  const signalingCB = useCallback(() => {
    signaling();
  }, [signaling]);

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
              name: "Export to file",
              handler: exportToFileCB,
              icon0: (p: Record<string, string>) => <FileZipIcon {...p} />,
              icon1: (p: Record<string, string>) => <ArrowUpRightIcon {...p} />,
            },
            {
              name: "Connection",
              handler: signalingCB,
              icon0: (p: Record<string, string>) => <ArrowSwitchIcon {...p} />,
              icon1: ()=>null,
              // icon1: (p: Record<string, string>) => <ArrowUpRightIcon {...p} />,
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
                className={classNames({
                  "py-0 mb-1": true,
                  "mb-3": el.name === "Save Changes",
                })}
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
