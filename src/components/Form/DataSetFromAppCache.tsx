import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TransferObject } from "./DataSetFromDragDrop";
import {
  getWorkbookFromIndexDB,
  metaDataNames,
  workbookSheetNames,
} from "../../helper/sheetHelper";
import {
  getStudyProgress,
  getUserSettings,
} from "../../helper/userSettingsHelper";

interface DataSetFromAppCacheProps {
  data: TransferObject[];
  updateDataHandler: (names: string) => void;
}

export function DataSetFromAppCache(props: DataSetFromAppCacheProps) {
  const { updateDataHandler, data } = props;

  const [available, setAvailable] = useState<string[]>([]);

  useEffect(() => {
    void getUserSettings().then((settings) => {
      const name = metaDataNames.settings.prettyName.toLowerCase();
      if (settings instanceof Object && Object.keys(settings).length > 0) {
        setAvailable((prev) => [...prev.filter((p) => p !== name), name]);
      }
    });

    void getStudyProgress().then((progress) => {
      const name = metaDataNames.progress.prettyName.toLowerCase();
      if (progress instanceof Object && Object.keys(progress).length > 0) {
        setAvailable((prev) => [...prev.filter((p) => p !== name), name]);
      }
    });

    void getWorkbookFromIndexDB().then((workbook) => {
      if (workbook.length > 0) {
        setAvailable((prev) => [
          ...prev.filter(
            (p) => !workbook.map((w) => w.name.toLowerCase()).includes(p)
          ),
          ...workbook
            .filter((w) => w.rows?.len !== undefined && w.rows?.len > 1)
            .map((w) => w.name.toLowerCase()),
        ]);
      }
    });
  }, []);

  const addRemoveItemCB = useCallback(
    (name: string, prettyName: string) => () => {
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
                  {dataItem?.sheet ? dataItem.sheet.rows.len : ""}
                </span>
                <div className="col px-1">
                  {dataItem?.origin === "AppCache" && <DatabaseIcon />}
                  {dataItem?.origin === "FileSystem" && <FileDirectoryIcon />}
                </div>

                <div
                  className="col px-1 clickable"
                  onClick={addRemoveItemCB(name, prettyName)}
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
    [data, addRemoveItemCB, available]
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
