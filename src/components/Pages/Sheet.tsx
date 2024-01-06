import EventEmitter from "events";

import { Badge, Fab, TextField } from "@mui/material";
import { objectToCSV } from "@nmemonica/snservice/src/helper/csvHelper";
import { sheetDataToJSON } from "@nmemonica/snservice/src/helper/jsonHelper";
import {
  FilledSheetData,
  getLastCellIdx,
  isFilledSheetData,
} from "@nmemonica/snservice/src/helper/sheetHelper";
import Spreadsheet, { type SheetData } from "@nmemonica/x-spreadsheet";
import {
  DesktopDownloadIcon,
  LinkExternalIcon,
  // RssIcon,
  SearchIcon,
  ShareIcon,
} from "@primer/octicons-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@nmemonica/x-spreadsheet/dist/xspreadsheet.css";
import { useDispatch, useSelector } from "react-redux";

import {
  dataServiceEndpoint,
  // pushServiceSheetDataUpdatePath,
  sheetServicePath,
} from "../../../environment.production";
import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../../../pwa/helper/idbHelper";
import { swMessageSaveDataJSON } from "../../helper/serviceWorkerHelper";
import { AppDispatch, RootState } from "../../slices";
import "../../css/Sheet.css";
import { setLocalDataEdited } from "../../slices/globalSlice";
import { clearKanji } from "../../slices/kanjiSlice";
import { clearOpposites } from "../../slices/oppositeSlice";
import { clearParticleGame } from "../../slices/particleSlice";
import { clearPhrases } from "../../slices/phraseSlice";
import { getDatasets } from "../../slices/sheetSlice";
import { setSwVersions, setVersion } from "../../slices/versionSlice";
import { clearVocabulary } from "../../slices/vocabularySlice";
import {
  ExternalSourceType,
  getExternalSourceType,
} from "../Form/ExtSourceInput";

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
    height: () => document.documentElement.clientHeight - 65,
    width: () => document.documentElement.clientWidth - 15,
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

function saveSheetServiceWorker(workbook: Spreadsheet | null, url: string) {
  if (!workbook) return Promise.reject(new Error("Missing workbook"));
  const { activeSheetData, activeSheetName } = getActiveSheet(workbook);
  if (!isFilledSheetData(activeSheetData)) {
    throw new Error("Missing data");
  }

  const d = removeLastRowIfBlank(activeSheetData);

  const { data, hash } = sheetDataToJSON(d);

  const resource = activeSheetData.name.toLowerCase();

  return swMessageSaveDataJSON(
    url + "/" + resource + ".json.v" + hash,
    data,
    hash
  ).then(() => ({
    name: activeSheetName,
    hash,
  }));
}

function saveSheetLocalService(
  workbook: Spreadsheet | null,
  serviceBaseUrl: string
) {
  if (!workbook) return Promise.reject(new Error("Missing workbook"));

  const { activeSheetData, activeSheetName } = getActiveSheet(workbook);

  const container = new FormData();
  const data = new Blob([JSON.stringify(activeSheetData)], {
    type: "application/json",
  });

  container.append("sheetType", "xSheetObj");
  container.append("sheetName", activeSheetName);
  container.append("sheetData", data);

  return fetch(serviceBaseUrl + sheetServicePath, {
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
  const sheets = workbook.getData() as SheetData[];

  const activeSheetName: string = workbook.bottombar.activeEl.el.innerHTML;
  const activeSheetData =
    sheets.find((sheet) => sheet.name === activeSheetName) ?? sheets[0];

  const data = removeLastRowIfBlank(activeSheetData);

  return { activeSheetName, activeSheetData: data };
}
/**
 * Send push to subscribed clients
 */
// function pushSheet(workbook: Spreadsheet | null, serviceBaseUrl: string) {
//   if (!workbook) return;

//   const { activeSheetName, activeSheetData } = getActiveSheet(workbook);

//   const container = new FormData();
//   const data = new Blob([JSON.stringify(activeSheetData)], {
//     type: "application/json",
//   });

//   container.append("sheetType", "xSheetObj");
//   container.append("sheetName", activeSheetName);
//   container.append("sheetData", data);

//   void fetch(serviceBaseUrl + pushServiceSheetDataUpdatePath, {
//     method: "POST",
//     body: container,;
//   });
// }

export function addExtraRow(xObj: SheetData[]) {
  const extraAdded = xObj.reduce<SheetData[]>((acc, o) => {
    let rows = o.rows;
    if (!rows) {
      return [...acc, { rows: { "0": { cells: {} } }, len: 1 }];
    }

    const last = getLastCellIdx(rows);

    const n = {
      ...o,
      rows: {
        ...rows,
        [String(last + 1)]: { cells: {} },
        // @ts-expect-error SheetData.rows.len
        len: rows.len + 1,
      },
    };

    return [...acc, n];
  }, []);

  return extraAdded;
}

export function removeLastRowIfBlank<T extends SheetData>(o: T) {
  const rows = o.rows;
  if (!o.rows || !rows) {
    return o;
  }

  const clone = { ...o, rows };

  const last = getLastCellIdx(o.rows);

  if (
    Object.values(o.rows[last].cells).every(
      (c) => c.text === undefined || c.text.length === 0 || c.text.trim() === ""
    )
  ) {
    delete clone.rows[last];
    // @ts-expect-error SheetData.rows.len
    clone.rows.len -= 1;
  }

  return clone;
}

function searchInSheet(sheet: SheetData, query: string) {
  if (!sheet.rows) {
    return [];
  }

  const result = Object.values(sheet.rows).reduce<[number, number, string][]>(
    (acc, row, x) => {
      if (typeof row !== "number" && "cells" in row) {
        const find = Object.keys(row.cells).find(
          (c) =>
            row.cells[Number(c)].text
              ?.toLowerCase()
              .includes(query.toLowerCase())
        );
        if (find === undefined) return acc;

        const text = row.cells[Number(find)].text;
        if (text === undefined) return acc;

        const y = Number(find);
        acc = [...acc, [x, y, text]];
      }

      return acc;
    },
    []
  );

  return result;
}

/**
 * Check if device has touch screen
 * [MDN mobile detection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent)
 * @returns
 */
function touchScreenCheck() {
  let hasTouchScreen = false;

  if (
    "maxTouchPoints" in navigator &&
    typeof navigator.maxTouchPoints === "number"
  ) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if (
    "msMaxTouchPoints" in navigator &&
    typeof navigator.msMaxTouchPoints === "number"
  ) {
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
    const mQ = matchMedia?.("(pointer:coarse)");
    if (mQ?.media === "(pointer:coarse)") {
      hasTouchScreen = Boolean(mQ.matches);
    } else if ("orientation" in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      const UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}

export default function Sheet() {
  const dispatch = useDispatch<AppDispatch>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wbRef = useRef<Spreadsheet | null>(null);

  const [resultBadge, setResultBadge] = useState(0);
  const prevResult = useRef<[number, number, string][]>([]);
  const resultIdx = useRef<number | null>(null);
  const searchValue = useRef<string | null>(null);

  const { localServiceURL } = useSelector(({ global }: RootState) => global);
  const externalSource = getExternalSourceType(localServiceURL);

  useEffect(() => {
    const gridEl = document.createElement("div");

    void openIDB()
      .then((db) => {
        // if indexedDB has stored workbook
        const stores = Array.from(db.objectStoreNames);

        const ErrorWorkbookMissing = new Error("Workbook not stored", {
          cause: { code: IDBErrorCause.NoResult },
        });
        if (!stores.includes("workbook")) {
          throw ErrorWorkbookMissing;
        }

        // use stored workbook
        return getIDBItem({ db, store: IDBStores.WORKBOOK }, "0").then(
          (res) => {
            if (!res.workbook || res.workbook.length === 0) {
              throw ErrorWorkbookMissing;
            }

            return res.workbook;
          }
        );
      })
      .catch((error) => {
        // if not fetch and build spreadsheet

        if (error?.cause?.code !== IDBErrorCause.NoResult) {
          // eslint-disable-next-line no-console
          console.log("Unknown error getting workbook from indexedDB");
          // eslint-disable-next-line no-console
          console.error(error);
        }

        return dispatch(getDatasets()).unwrap();
      })
      .then((obj) => {
        const data = addExtraRow(obj);

        const grid = new Spreadsheet(gridEl, defaultOp).loadData(data);

        // console.log(grid.bottombar.activeEl.el.innerHTML);

        grid.freeze(0, 1, 0).freeze(1, 1, 0).freeze(2, 1, 0).reRender();

        // TODO:
        // grid.setMaxCols(0, sheet1Cols);
        // grid.setMaxCols(1, sheet2Cols);
        // grid.setMaxCols(2, sheet3Cols);

        wbRef.current = grid;
      });

    containerRef.current?.appendChild(gridEl);

    const c = containerRef.current;

    return () => {
      // cleanup
      if (c?.contains(gridEl)) {
        c?.removeChild(gridEl);
      }
    };
  }, [dispatch, externalSource]);

  const saveSheetCB = useCallback(() => {
    let saveP;
    switch (externalSource) {
      case ExternalSourceType.Unset: {
        saveP = saveSheetServiceWorker(wbRef.current, dataServiceEndpoint);
        break;
      }
      case ExternalSourceType.GitHubUserContent:
        saveP = saveSheetServiceWorker(wbRef.current, dataServiceEndpoint);
        break;

      case ExternalSourceType.LocalService: {
        // backup to local service
        void saveSheetLocalService(wbRef.current, localServiceURL);
        // save in cache
        saveP = saveSheetServiceWorker(wbRef.current, dataServiceEndpoint);
        break;
      }
      default:
        throw new Error("Save Sheet unknown source");
    }

    // store workbook in indexedDB
    // (keep ordering and notes)
    void openIDB().then((db) =>
      putIDBItem(
        { db, store: IDBStores.WORKBOOK },
        { key: "0", workbook: wbRef.current?.getData() as FilledSheetData[] }
      )
    );

    void saveP.then(({ hash, name }) => {
      switch (name) {
        case "Kanji":
          dispatch(setVersion({ name: "kanji", hash }));
          dispatch(clearKanji());
          break;
        case "Vocabulary":
          dispatch(setVersion({ name: "vocabulary", hash }));
          dispatch(clearVocabulary());
          dispatch(clearOpposites());
          break;
        case "Phrases":
          dispatch(setVersion({ name: "phrases", hash }));
          dispatch(clearPhrases());
          dispatch(clearParticleGame());
          break;
        default:
          throw new Error("Incorrect sheet name: " + name);
      }

      // update service worker cache.json file with app state versions
      void dispatch(setSwVersions());
    });

    // local data edited, do not fetch use cached cache.json
    void dispatch(setLocalDataEdited(true));
  }, [dispatch, externalSource, localServiceURL]);

  const downloadSheetsCB = useCallback(() => {
    //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_files

    const xObj = wbRef.current?.getData() as FilledSheetData[];
    if (xObj) {
      const filesP = xObj.map((xObjSheet: FilledSheetData) => {
        const fileSim = new EventEmitter();

        const fileWriterSimulator = {
          write: (line: string) => {
            fileSim.emit("write", line);
          },
          end: () => {
            fileSim.emit("end");
          },
        };

        const csvP = new Promise<[string, string]>((resolve, _reject) => {
          let file = "";
          fileSim.on("write", (line) => {
            file += line;
          });

          fileSim.on("end", () => {
            resolve([xObjSheet.name, file]);
          });
        });

        objectToCSV(xObjSheet, fileWriterSimulator);

        return csvP;
      });

      void Promise.all(filesP).then((data1) => {
        data1.forEach(([name, data]) => {
          const file = new Blob([data], {
            type: "application/plaintext; charset=utf-8",
          });
          // const file = new Blob(['csv.file'],{type:"octet/stream"})
          // const f = new File([file], './file.csv', {type:"octet/stream"})

          const dlUrl = URL.createObjectURL(file);
          // window.location.assign(dlUrl)

          // URL.revokeObjectURL()
          // browser.downloads.download(URL.createObjectURL(file))
          const a = document.createElement("a");
          a.download = `${name}.csv`;
          a.href = dlUrl;
          // document.body.appendChild(a)
          a.click();

          setTimeout(() => {
            // document.body.removeChild(a)
            URL.revokeObjectURL(dlUrl);
          }, 0);
        });
      });
    }
  }, []);

  // const pushSheetCB = useCallback(() => {
  //   pushSheet(wbRef.current, localServiceURL);
  // }, [localServiceURL]);

  const doSearchCB = useCallback(() => {
    const search = searchValue.current;
    const workbook = wbRef.current;
    if (!search || !workbook) return;

    if (resultIdx.current === null) {
      const { activeSheetData } = getActiveSheet(workbook);
      if (!activeSheetData.rows) {
        return;
      }

      const result = searchInSheet(activeSheetData, search);

      prevResult.current = result;
      setResultBadge(result.length);
      if (result.length > 0) {
        setTimeout(() => {
          if (resultIdx.current !== null) {
            setResultBadge(resultIdx.current + 1);
          }
        }, 1500);
      }
    }

    const result = prevResult.current;
    if (result.length === 0) {
      // no results
      setResultBadge(-1);
      return;
    }
    if (resultIdx.current === null) {
      resultIdx.current = 0;
    } else {
      resultIdx.current = (resultIdx.current + 1) % result.length;
      setResultBadge(resultIdx.current + 1);
    }

    const [x] = result[resultIdx.current];
    const xOffset = defaultOp.row.height * (x - 2);
    workbook.sheet.verticalScrollbar.moveFn(xOffset);
  }, []);

  const probablyMobile = useMemo(() => {
    const smallScreen = window.innerWidth < 1000 || window.innerHeight < 1000;
    const touch = touchScreenCheck();

    return touch && smallScreen;
  }, []);

  /** On mobile give a show-context-menu btn */
  const temporaryMobileContextMenuCB = useCallback(() => {
    // https://developer.mozilla.org/en-US/docs/Web/Events/Creating_and_triggering_events
    // const e = new Event("contextmenu")
    // document.querySelector('.x-spreadsheet-table').dispatchEvent(e)

    const menu = document.querySelector(".x-spreadsheet-contextmenu");
    const items = menu?.children;
    if (items) {
      Array.from(items).forEach((element, i) => {
        // remove most menu items
        // leave insert + remove row/columns
        if (i < 6 || i > 10) {
          element.setAttribute("style", "display: none;");
        }
      });
    }

    const css = `display: block; right: ${1}px; bottom: ${1}px;`;
    menu?.setAttribute("style", css);
  }, []);

  return (
    <React.Fragment>
      <div className="sheet main-panel pt-2">
        <div className="d-flex flex-row pt-2 px-3 w-100">
          <div className="pt-1 pe-1">
            <Fab
              aria-label="Save Sheet"
              variant="extended"
              size="small"
              onClick={saveSheetCB}
              className="m-0 z-index-unset"
              tabIndex={3}
            >
              <ShareIcon size="small" />
            </Fab>
          </div>
          <div className="pt-1 pe-1">
            <Fab
              aria-label="Download Sheet"
              variant="extended"
              size="small"
              onClick={downloadSheetsCB}
              className="m-0 z-index-unset"
              tabIndex={4}
            >
              <DesktopDownloadIcon size="small" />
            </Fab>
          </div>
          {/* {externalSource === ExternalSourceType.LocalService &&
            !probablyMobile && (
              <div className="pt-1 pe-1">
                <Fab
                  aria-label="Push to subscribers"
                  variant="extended"
                  size="small"
                  onClick={pushSheetCB}
                  className="m-0 z-index-unset"
                  tabIndex={4}
                >
                  <RssIcon size="small" />
                </Fab>
              </div>
            )} */}
          <div className="d-flex">
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  doSearchCB();
                }}
              >
                <TextField
                  // error={userInputError}
                  size="small"
                  label="Search"
                  variant="outlined"
                  inputProps={{ tabIndex: 1 }}
                  onChange={(event) => {
                    const { value } = event.target;
                    resultIdx.current = null;
                    prevResult.current = [];
                    setResultBadge(0);

                    if (value && value.length > 0) {
                      searchValue.current = value;
                    }
                  }}
                />
              </form>
            </div>
            <div className="pt-1 ps-1">
              <Badge
                badgeContent={resultBadge < 0 ? "!" : resultBadge}
                color={resultBadge < 0 ? "error" : "success"}
              >
                <Fab
                  aria-label="Search sheet"
                  variant="extended"
                  size="small"
                  color="primary"
                  className="m-0 z-index-unset"
                  tabIndex={2}
                  onClick={doSearchCB}
                >
                  <SearchIcon size="small" />
                </Fab>
              </Badge>
            </div>
            {probablyMobile && (
              <div className="pt-1 ps-1">
                <Fab
                  aria-label="Show context menu"
                  variant="extended"
                  size="small"
                  className="m-0 z-index-unset"
                  tabIndex={2}
                  onClick={temporaryMobileContextMenuCB}
                >
                  <LinkExternalIcon size="small" className="rotate-180" />
                </Fab>
              </div>
            )}
          </div>
        </div>

        <div ref={containerRef} className="sheet-container pt-2" />
      </div>
    </React.Fragment>
  );
}

export { SheetMeta };
