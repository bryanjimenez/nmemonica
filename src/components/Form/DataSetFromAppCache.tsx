import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TransferObject } from "./DataSetFromDragDrop";
import { metaDataNames, workbookSheetNames } from "../../helper/sheetHelper";
import { getUserSettings } from "../../helper/userSettingsHelper";

interface DataSetFromAppCacheProps {
  data: TransferObject[];
  updateDataHandler: (names: string) => void;
}

export function DataSetFromAppCache(props: DataSetFromAppCacheProps) {
  const { updateDataHandler, data } = props;

  const [hasSettings, setSettings] = useState(false);

  useEffect(() => {
    void getUserSettings().then((ls) => {
      setSettings(ls instanceof Object);
    });
  }, []);

  const addRemoveItemCB = useCallback(
    (name: string, prettyName: string) => () => {
      if (
        name !== metaDataNames.settings.prettyName.toLowerCase() ||
        hasSettings
      ) {
        updateDataHandler(prettyName);
      }
    },
    [updateDataHandler, hasSettings]
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
                        "disabled opacity-25":
                          name ===
                            metaDataNames.settings.prettyName.toLowerCase() &&
                          !hasSettings,
                      })}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }),
    [data, hasSettings, addRemoveItemCB]
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
