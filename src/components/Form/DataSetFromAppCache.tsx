import {
  DatabaseIcon,
  DiamondIcon,
  FileDirectoryIcon,
  XIcon,
} from "@primer/octicons-react";
import classNames from "classnames";

import { TransferFile } from "./DataSetFromDragDrop";

interface DataSetFromAppCacheProps {
  data: TransferFile[];
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
            <span className="col px-2">rows</span>
            <span className="col px-2">source</span>
          </div>
        </div>
        {[
          { name: "Phrases" },
          { name: "Vocabulary" },
          { name: "Kanji" },
          { name: "Settings" },
        ].map((el) => {
          const prettyName = el.name;
          const name = el.name.toLowerCase();

          const dataItem = data.find(
            (d) => d.name.toLowerCase() === prettyName.toLowerCase()
          );

          return (
            <div key={el.name} className="d-flex justify-content-between">
              <div className="me-5">
                <span
                  className={classNames({
                    "col fs-6": true,
                    "opacity-25": dataItem?.name.toLowerCase() !== name,
                  })}
                >
                  {el.name}
                </span>
              </div>
              <div>
                <div className="row">
                  <span className="col px-1">
                    {dataItem?.sheet ? dataItem.sheet.rows.len : ""}
                  </span>
                  <div className="col px-1">
                    {dataItem?.source === "app" && <DatabaseIcon />}
                    {dataItem?.source === "file" && <FileDirectoryIcon />}
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
