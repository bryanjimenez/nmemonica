import EventEmitter from "events";

import { Badge, Fab, TextField } from "@mui/material";
import { objectToCSV } from "@nmemonica/snservice/src/helper/csvHelper";
import { FilledSheetData } from "@nmemonica/snservice/src/helper/sheetHelper";
import Spreadsheet from "@nmemonica/x-spreadsheet";
import {
  DesktopDownloadIcon,
  LinkExternalIcon,
  // RssIcon,
  SearchIcon,
  ShareIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
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
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../../../pwa/helper/idbHelper";
import {
  addExtraRow,
  getActiveSheet,
  removeLastRowIfBlank,
  searchInSheet,
  touchScreenCheck,
} from "../../helper/sheetHelper";
import { AppDispatch, RootState } from "../../slices";
import "../../css/Sheet.css";
import { setLocalDataEdited } from "../../slices/globalSlice";
import { clearKanji } from "../../slices/kanjiSlice";
import { clearOpposites } from "../../slices/oppositeSlice";
import { clearParticleGame } from "../../slices/particleSlice";
import { clearPhrases } from "../../slices/phraseSlice";
import {
  getDatasets,
  saveSheetServiceWorker,
} from "../../slices/sheetSlice";
import { setSwVersions, setVersion } from "../../slices/versionSlice";
import { clearVocabulary } from "../../slices/vocabularySlice";

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
    len: 3000, //   100,
    height: 35, //  25,
  },
  col: {
    len: 10, //     26:Z
    width: 150,
    indexWidth: 60,
    minWidth: 60,
  },
} as const;

export default function Sheet() {
  const dispatch = useDispatch<AppDispatch>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wbRef = useRef<Spreadsheet | null>(null);

  const [resultBadge, setResultBadge] = useState(0);
  const prevResult = useRef<[number, number, string][]>([]);
  const resultIdx = useRef<number | null>(null);
  const searchValue = useRef<string | null>(null);

  const { cookies } = useSelector(({ global }: RootState) => global);

  const [uploadError, setUploadError] = useState<boolean>(false);

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

        // replace typed '\n' with newline inside cell
        grid.on("cell-edited-done", (text, ri, ci) => {
            grid.sheet.data.setSelectedCellText(
              // characters to replace with \n
              //    literal '\n'
              //    two or more japanese spaces
              //    two or more english spaces
              text.replace(/\\n|\u3000{2,}|[ ]{2,}/g, "\n"),
              "finished"
            );
        });

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
  }, [dispatch]);

  const onUploadErrorCB = useCallback((err: Error) => {
    setUploadError(true);

    setTimeout(() => {
      setUploadError(false);
    }, 2000);
  }, []);

  const saveSheetCB = useCallback(() => {
    // void saveSheetLocalService(wbRef.current, sheetService).catch(
    //   onUploadErrorCB
    // );
    const saveP = saveSheetServiceWorker(wbRef.current);

    const workbook = wbRef.current?.getData() as FilledSheetData[];
    const trimmed = workbook.map((w) => removeLastRowIfBlank(w));

    // store workbook in indexedDB
    // (keep ordering and notes)
    void openIDB().then((db) =>
      putIDBItem(
        { db, store: IDBStores.WORKBOOK },
        { key: "0", workbook: trimmed }
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
  }, [dispatch]);

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
              aria-disabled={!cookies}
              variant="extended"
              size="small"
              disabled={!cookies}
              onClick={saveSheetCB}
              className="m-0 z-index-unset"
              tabIndex={3}
              color={uploadError ? "error" : undefined}
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

        <div
          ref={containerRef}
          className={classNames({
            "sheet-container pt-2": true,
            "disabled-color": !cookies,
          })}
        />
      </div>
    </React.Fragment>
  );
}

export { SheetMeta };
