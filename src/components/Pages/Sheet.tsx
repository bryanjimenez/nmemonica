import { Badge, Fab, TextField } from "@mui/material";
import Spreadsheet from "@nmemonica/x-spreadsheet";
import {
  FileSymlinkFileIcon,
  RssIcon,
  SearchIcon,
} from "@primer/octicons-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "@nmemonica/x-spreadsheet/dist/xspreadsheet.css";
import { useDispatch, useSelector } from "react-redux";

import {
  pushServiceSheetDataUpdatePath,
  sheetServicePath,
} from "../../../environment.development";
import { AppDispatch, RootState } from "../../slices";
import "../../css/Sheet.css";
import { clearKanji } from "../../slices/kanjiSlice";
import { clearPhrases } from "../../slices/phraseSlice";
import { setVersion } from "../../slices/versionSlice";
import { clearVocabulary } from "../../slices/vocabularySlice";
import { NotReady } from "../Form/NotReady";

// TODO: import this?
// service/helper/firebaseParse.ts
export interface SheetData {
  name: string;
  rows: { len: number } & Record<
    number,
    {
      cells: Record<string, { text?: string; merge?: [number, number] | null }>;
    }
  >;
}

const SheetMeta = {
  location: "/sheet/",
  label: "Sheet",
};

const defaultOp = {
  mode: "edit", // edit | read
  // showToolbar: true,
  // showGrid: true,
  // showContextmenu: true,
  autoFocus: false,
  view: {
    height: () => document.documentElement.clientHeight - 100,
    width: () => document.documentElement.clientWidth - 30,
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
  if (!workbook) return Promise.reject(new Error("Missing workbook"));

  // TODO: fix SpreadSheet.getData type
  const datas = workbook.getData() as { name: string }[];

  const activeSheetName: string = workbook.bottombar.activeEl.el.innerHTML;
  const activeSheetData: unknown = datas.find(
    ({ name }: { name: string }) => name === activeSheetName
  );

  const container = new FormData();
  const data = new Blob([JSON.stringify(activeSheetData)], {
    type: "application/json",
  });

  container.append("sheetType", "xSheetObj");
  container.append("sheetName", activeSheetName);
  container.append("sheetData", data);

  return fetch(dataService + sheetServicePath, {
    method: "PUT",
    body: container,
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Faild to save sheet");
    }
    return res
      .json()
      .then(({ hash }: { hash: string }) => ({ hash, name: activeSheetName }));
  });
}

function getActiveSheet(workbook: Spreadsheet) {
  // TODO: fix SpreadSheet.getData type
  const datas = workbook.getData() as SheetData[];

  const activeSheetName: string = workbook.bottombar.activeEl.el.innerHTML;
  const activeSheetData =
    datas.find(({ name }: { name: string }) => name === activeSheetName) ??
    datas[0];

  return { activeSheetName, activeSheetData };
}
/**
 * Send push to subscribed clients
 */
function pushSheet(workbook: Spreadsheet | null, dataService: string) {
  if (!workbook) return;

  const { activeSheetName, activeSheetData } = getActiveSheet(workbook);

  const container = new FormData();
  const data = new Blob([JSON.stringify(activeSheetData)], {
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
  const dispatch = useDispatch<AppDispatch>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wbRef = useRef<Spreadsheet | null>(null);

  const [searchResults, setSearchResult] = useState(0);
  const prevResult = useRef<[number, number, string][]>([]);
  const resultIdx = useRef<number | null>(null);
  const searchValue = useRef<string | null>(null);

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
  }, [dataService]);

  const saveSheetCB = useCallback(() => {
    void saveSheet(wbRef.current, dataService)?.then(({ hash, name }) => {
      setTimeout(() => {
        // wait for fs writes

        switch (name) {
          case "Kanji":
            dispatch(setVersion({ name: "kanji", hash }));
            dispatch(clearKanji());
            break;
          case "Vocabulary":
            dispatch(setVersion({ name: "vocabulary", hash }));
            dispatch(clearVocabulary());
            break;
          case "Phrases":
            dispatch(setVersion({ name: "phrases", hash }));
            dispatch(clearPhrases());
            break;
          default:
            throw new Error("Incorrect sheet name");
        }
      }, 1000);
    });
  }, [dispatch, dataService]);

  const pushSheetCB = useCallback(() => {
    pushSheet(wbRef.current, dataService);
  }, [dataService]);

  const doSearchCB = useCallback(() => {
    const search = searchValue.current;
    const workbook = wbRef.current;
    if (!search || !workbook) return;

    if (resultIdx.current === null) {
      const { activeSheetData } = getActiveSheet(workbook);

      const result = Object.values(activeSheetData.rows).reduce<
        [number, number, string][]
      >((acc, row, x) => {
        if (typeof row !== "number" && "cells" in row) {
          const find = Object.keys(row.cells).find(
            (c) =>
              row.cells[c].text?.toLowerCase().includes(search.toLowerCase())
          );
          if (find === undefined) return acc;

          const text = row.cells[find].text;
          if (text === undefined) return acc;

          const y = Number(find);
          acc = [...acc, [x, y, text]];
        }

        return acc;
      }, []);

      prevResult.current = result;
      setSearchResult(result.length);
    }

    const result = prevResult.current;
    if (resultIdx.current === null) {
      resultIdx.current = 0;
    } else {
      resultIdx.current = (resultIdx.current + 1) % result.length;
    }

    // console.log(result[resultIdx.current]);
    const [x] = result[resultIdx.current];
    const xOffset = defaultOp.row.height * (x - 2);
    workbook.sheet.verticalScrollbar.moveFn(xOffset);
  }, []);

  if (dataService.length === 0) {
    return <NotReady addlStyle="sheet" text="Set sheet-service endpoint" />;
  }

  return (
    <React.Fragment>
      <div className="sheet main-panel pt-2">
        <div className="d-flex flex-row pt-2 px-2 w-100">
          <div className="px-1">
            <Fab
              variant="extended"
              size="small"
              onClick={saveSheetCB}
              className="m-0 z-index-unset"
            >
              <FileSymlinkFileIcon size="small" />
            </Fab>
          </div>
          <div className="px-1">
            <Fab
              variant="extended"
              size="small"
              onClick={pushSheetCB}
              className="m-0 z-index-unset"
            >
              <RssIcon size="small" />
            </Fab>
          </div>
          <div className="d-flex">
            <div>
              <TextField
                // error={userInputError}
                size="small"
                label="Search"
                variant="outlined"
                // defaultValue={localServiceURL}
                onKeyUp={(event) => {
                  if (event.code === "Enter") {
                    doSearchCB();
                  }
                }}
                onChange={(event) => {
                  const { value } = event.target;
                  resultIdx.current = null;
                  prevResult.current = [];

                  setSearchResult(0);

                  if (value && value.length > 0) {
                    searchValue.current = value;
                  }
                }}
              />
            </div>
            <div className="ps-1 pt-1">
              <Badge badgeContent={searchResults} color="success">
                <Fab
                  variant="extended"
                  size="small"
                  color="primary"
                  className="m-0 z-index-unset"
                  onClick={doSearchCB}
                >
                  <SearchIcon size="small" />
                </Fab>
              </Badge>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="pt-2" />
      </div>
    </React.Fragment>
  );
}

export { SheetMeta };
