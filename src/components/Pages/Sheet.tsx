import React, { useEffect, useRef } from "react";
import Spreadsheet from "x-data-spreadsheet";
import "x-data-spreadsheet/dist/xspreadsheet.css";

import { workbookEndPoint } from "../../../environment.development";

import md5 from "md5";

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
    height: () => document.documentElement.clientHeight - 84,
    // width: () => document.documentElement.clientWidth,
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

function saveSheet(workbook: Spreadsheet | null) {
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

  void fetch(workbookEndPoint, {
    method: "PUT",
    body: container,
  });
}

export default function Sheet() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wbRef = useRef<Spreadsheet | null>(null);

  useEffect(() => {
    const gridEl = document.createElement("div");

    void fetch(workbookEndPoint, { method: "GET" }).then((res) =>
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

          grid.freeze(0, 1, 0).freeze(1, 1, 0).freeze(2, 1, 0).reRender();

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
  }, []);

  // if (false)
  //   return <NotReady addlStyle="main-panel" />;

  return (
    <React.Fragment>
      <div className="sheet main-panel pt-2">
        <div ref={containerRef} />

        <div className="d-flex flex-column pt-2 px-2">
          {/* <div>code: {getVerificationCode()}</div> */}
          <div onClick={() => saveSheet(wbRef.current)}>{"SAVE"}</div>
          {/** show last saved hash */}
          {/* <div id="updateBtn">{"UPDATE"}</div>
          <div id="scrollBtn">{"SCROLL"}</div> */}
        </div>
      </div>
    </React.Fragment>
  );
}

export { SheetMeta };

function getVerificationCode() {
  //https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues

  return md5(Date.now().toString()).slice(0, 6);
}
