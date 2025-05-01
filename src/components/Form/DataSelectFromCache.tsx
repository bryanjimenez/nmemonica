import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";

import { metaDataNames, workbookSheetNames } from "../../helper/sheetHelper";
import {
  type SyncDataFile,
  dataTransferAggregator,
  parseCsvToSheet,
} from "../../helper/transferHelper";
import { properCase } from "../Games/KanjiGame";

interface DataSelectFromCacheProps {
  data: SyncDataFile[];
  updateDataHandler: (names: string) => void;
}

export function DataSelectFromCache(props: DataSelectFromCacheProps) {
  const { updateDataHandler, data } = props;

  const [available, setAvailable] = useState<string[]>([]);
  const [rows, setRows] = useState<Partial<Record<string, number>>>({});

  useEffect(() => {
    void dataTransferAggregator().then((files) => {
      files.forEach((fileItem) => {
        const dot = fileItem.fileName.indexOf(".");
        const name = fileItem.fileName
          .slice(0, dot > -1 ? dot : undefined)
          .toLowerCase();
        const prettyName = properCase(name);

        // if user clears out the calc rows gets wiped (1st render calc)
        if (Object.keys(workbookSheetNames).includes(name)) {
          void parseCsvToSheet(fileItem.file, prettyName).then((sheet) => {
            setRows((prev) => ({ ...prev, [name]: sheet.rows.len }));
          });
        }

        setAvailable((prev) => [...prev.filter((p) => p !== name), name]);
      });
    });
  }, []);

  const addRemoveItemCB = useCallback(
    (prettyName: string) => () => {
      const name = prettyName.toLowerCase();
      if (
        (name !== metaDataNames.progress.prettyName.toLowerCase() &&
          name !== metaDataNames.settings.prettyName.toLowerCase()) ||
        available.includes(name)
      ) {
        updateDataHandler(prettyName);
      }
    },
    [updateDataHandler, available]
  );

  const items = useMemo(
    () =>
      Object.values({ ...workbookSheetNames, ...metaDataNames }).map((el) => {
        const { prettyName } = el;
        const name = prettyName.toLowerCase();

        const dataItem = data.find(
          (d) => d.name.toLowerCase() === prettyName.toLowerCase()
        );

        return (
          <div key={name} className="d-flex justify-content-between">
            <div className="me-5">
              <span
                className={classNames({
                  "col fs-6": true,
                  "opacity-25": dataItem?.name.toLowerCase() !== name,
                })}
              >
                {prettyName}
              </span>
            </div>
            <div>
              <div className="row">
                <span className="col px-1">
                  {dataItem?.origin === "AppCache" &&
                    rows[dataItem.name.toLowerCase()]}
                </span>
                <div className="col px-1">
                  {dataItem?.origin === "AppCache" && <DatabaseIcon />}
                  {dataItem?.origin === "FileSystem" && <FileDirectoryIcon />}
                </div>

                <div
                  className="col px-1 clickable"
                  onClick={addRemoveItemCB(prettyName)}
                >
                  {dataItem ? (
                    <XIcon />
                  ) : (
                    <DiamondIcon
                      className={classNames({
                        "rotate-45 px-0": true,
                        "disabled opacity-25": !available.includes(name),
                      })}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }),
    [data, available, rows, addRemoveItemCB]
  );

  return (
    <div className="text-center m-0 mb-1">
      <div
        className={classNames({
          "d-flex flex-column border rounded px-3": true,
        })}
      >
        <span className="fs-6">Select Dataset</span>
        <div className="d-flex justify-content-between fs-x-small">
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
  );
}
