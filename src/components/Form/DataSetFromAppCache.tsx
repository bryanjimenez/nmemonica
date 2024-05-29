import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";

import { TransferObject } from "./DataSetFromDragDrop";
import { metaDataNames, workbookSheetNames } from "../Pages/Sheet";

interface DataSetFromAppCacheProps {
  data: TransferObject[];
  updateDataHandler: (names: string) => void;
}

export function DataSetFromAppCache(props: DataSetFromAppCacheProps) {
  const { updateDataHandler, data } = props;

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
        {Object.values({ ...workbookSheetNames, ...metaDataNames }).map((el) => {
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
                    onClick={() => {
                      updateDataHandler(prettyName);
                    }}
                  >
                    {dataItem ? (
                      <XIcon />
                    ) : (
                      <DiamondIcon className="rotate-45 px-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
