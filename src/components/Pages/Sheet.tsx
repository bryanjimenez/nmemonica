import { Button } from "@mui/material";
import Spreadsheet from "@nmemonica/x-spreadsheet";
import React, { useCallback, useEffect, useRef } from "react";
import "@nmemonica/x-spreadsheet/dist/xspreadsheet.css";
import { useSelector } from "react-redux";

import {
  dataServicePath,
  pushServiceSheetDataUpdatePath,
  sheetServicePath,
} from "../../../environment.development";
import { swMessageSetLocalServiceEndpoint } from "../../helper/serviceWorkerHelper";
import { AppDispatch, RootState } from "../../slices";
import { NotReady } from "../Form/NotReady";
import { useWindowSize } from "../../hooks/useWindowSize";
import { useDispatch } from "react-redux";
import { logger } from "../../slices/globalSlice";
import { DebugLevel } from "../../slices/settingHelper";

const SheetMeta = {
  location: "/sheet/",
  label: "Sheet",
};

const defaultOp = {
  mode: "edit", // edit | read
  // showToolbar: true,
  // showGrid: true,
  // showContextmenu: true,
  view: {
    height: () => (document.documentElement.clientHeight - 100),
    width: () => (document.documentElement.clientWidth - 30),
  },
  row: {
    len: 3000, //100,
    height: 35, //25,
  },
  col: {
    // len: 26,
    // width: 100,
    indexWidth: 60,
    minWidth: 60,
  },
};

function saveSheet(workbook: Spreadsheet | null, dataService: string) {
  if (!workbook) return;

  // TODO: fix SpreadSheet.getData type
  const datas = workbook.getData() as { name: string }[];

  const activeSheetName: string = workbook.bottombar.activeEl.el.innerHTML;
  const activeSheetData: unknown = datas.find(
    ({ name }: { name: string }) => name === activeSheetName
  );

  const container = new FormData();
  const data = new Blob([JSON.stringify([activeSheetData])], {
    type: "application/json",
  });

  container.append("sheetType", "xSheetObj");
  container.append("sheetName", activeSheetName);
  container.append("sheetData", data);

  void fetch(dataService + sheetServicePath, {
    method: "PUT",
    body: container,
  });
}

function getActiveSheet(workbook: Spreadsheet) {
  // TODO: fix SpreadSheet.getData type
  const datas = workbook.getData() as { name: string }[];

  const activeSheetName: string = workbook.bottombar.activeEl.el.innerHTML;
  const activeSheetData: unknown = datas.find(
    ({ name }: { name: string }) => name === activeSheetName
  );

  return { activeSheetName, activeSheetData };
}
/**
 * Send push to subscribed clients
 */
function pushSheet(workbook: Spreadsheet | null, dataService: string) {
  if (!workbook) return;

  const { activeSheetName, activeSheetData } = getActiveSheet(workbook);

  const container = new FormData();
  const data = new Blob([JSON.stringify([activeSheetData])], {
    type: "application/json",
  });

  container.append("sheetType", "xSheetObj");
  container.append("sheetName", activeSheetName);
  container.append("sheetData", data);

  void fetch(dataService + pushServiceSheetDataUpdatePath, {
    method: "POST",
    body: container,
  });
}

export default function Sheet() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wbRef = useRef<Spreadsheet | null>(null);

  const dataService = useSelector(
    ({ global }: RootState) => global.localServiceURL
  );

  useEffect(() => {

    const gridEl = document.createElement("div");

    void fetch(dataService + sheetServicePath, { method: "GET" }).then((res) =>
      res
        .json()
        .then(({ xSheetObj }: { xSheetObj: Record<string, unknown> }) => {
          const grid = new Spreadsheet(gridEl, defaultOp).loadData(xSheetObj);
          // console.log(grid);
          // console.log(grid.bottombar.activeEl.el.innerHTML);

          // grid.bottombar.items.forEach(({ el }: { el: HTMLElement }) => {
          //   el.addEventListener("click", function () {
          //     console.log(el.innerHTML);
          //   });
          // });

          try {
            grid.freeze(0, 1, 0).freeze(1, 1, 0).freeze(2, 1, 0).reRender();
          } catch (err) {
            // ignore freeze is not a function error for now
          }

          // TODO:
          // grid.setMaxCols(0, sheet1Cols);
          // grid.setMaxCols(1, sheet2Cols);
          // grid.setMaxCols(2, sheet3Cols);

          wbRef.current = grid;
        })
    );

    containerRef.current?.appendChild(gridEl);

    const c = containerRef.current;

    return () => {
      // cleanup
      if (c?.contains(gridEl)) {
        c?.removeChild(gridEl);
      }
    };
  }, [dataService]);

  const saveSheetCB = useCallback(() => {
    saveSheet(wbRef.current, dataService);
  }, [dataService]);

  const pushSheetCB = useCallback(() => {
    pushSheet(wbRef.current, dataService);
  }, [dataService]);

  if (dataService.length === 0) {
    return <NotReady addlStyle="sheet" text="Set sheet-service endpoint" />;
  }

  return (
    <React.Fragment>
      <div className="sheet main-panel pt-2">
        <div ref={containerRef} />

        <div className="d-flex flex-row pt-2 px-2 w-100">
          <div className="px-1">
            <Button
              variant="text"
              size="small"
              className="m-0"
              onClick={saveSheetCB}
            >
              Save
            </Button>
          </div>
          <div className="px-1">
            <Button
              variant="text"
              size="small"
              className="m-0"
              onClick={pushSheetCB}
            >
              Push
            </Button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export { SheetMeta };
