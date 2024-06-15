import EventEmitter from "events";

import { Badge, Fab, TextField } from "@mui/material";
import { Spreadsheet } from "@nmemonica/x-spreadsheet";
import {
  GearIcon,
  LinkExternalIcon,
  // RssIcon,
  SearchIcon,
} from "@primer/octicons-react";
import { AsyncThunk } from "@reduxjs/toolkit";
import classNames from "classnames";
import { MetaDataObj } from "nmemonica";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@nmemonica/x-spreadsheet/dist/index.css";
import { useDispatch, useSelector } from "react-redux";

import {
  IDBErrorCause,
  IDBStores,
  getIDBItem,
  openIDB,
  putIDBItem,
} from "../../../pwa/helper/idbHelper";
import { localStorageKey } from "../../constants/paths";
import { objectToCSV } from "../../helper/csvHelper";
import { jtox, sheetDataToJSON } from "../../helper/jsonHelper";
import {
  getLocalStorageSettings,
  setLocalStorage,
} from "../../helper/localStorageHelper";
import {
  getActiveSheet,
  removeLastRowIfBlank,
  searchInSheet,
  sheetAddExtraRow,
  touchScreenCheck,
  updateEditedUID,
} from "../../helper/sheetHelper";
import {
  type FilledSheetData,
  isFilledSheetData,
} from "../../helper/sheetHelperImport";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { AppDispatch, LocalStorageState, RootState } from "../../slices";
import {
  localStorageSettingsInitialized,
  setLocalDataEdited,
} from "../../slices/globalSlice";
import {
  clearKanji,
  batchRepetitionUpdate as kanjiBatchMetaUpdate,
} from "../../slices/kanjiSlice";
import { clearOpposites } from "../../slices/oppositeSlice";
import { clearParticleGame } from "../../slices/particleSlice";
import {
  clearPhrases,
  batchRepetitionUpdate as phraseBatchMetaUpdate,
} from "../../slices/phraseSlice";
import { getDatasets, saveSheetServiceWorker } from "../../slices/sheetSlice";
import { setSwVersions, setVersion } from "../../slices/versionSlice";
import {
  clearVocabulary,
  batchRepetitionUpdate as vocabularyBatchMetaUpdate,
} from "../../slices/vocabularySlice";
import { DataSetActionMenu } from "../Form/DataSetActionMenu";
import { DataSetExportSync } from "../Form/DataSetExportSync";
import { DataSetImportFile } from "../Form/DataSetImportFile";
import { DataSetImportSync } from "../Form/DataSetImportSync";
import "../../css/Sheet.css";

const SheetMeta = {
  location: "/sheet/",
  label: "Sheet",
};

/**
 * Keep all naming and order
 */
export const workbookSheetNames = Object.freeze({
  phrases: { index: 0, file: "Phrases.csv", prettyName: "Phrases" },
  vocabulary: { index: 1, file: "Vocabulary.csv", prettyName: "Vocabulary" },
  kanji: { index: 2, file: "Kanji.csv", prettyName: "Kanji" },
});

export const metaDataNames = Object.freeze({
  settings: { file: "Settings.json", prettyName: "Settings" },
});

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

/**
 * Retrieves worksheet from:
 * indexedDB
 * cache
 * or creates placeholders
 *
 * @param dispatch
 * @param getDatasets fetch action (if no indexedDB)
 */
export function getWorkbookFromIndexDB(
  dispatch: AppDispatch,
  getDatasets: AsyncThunk<FilledSheetData[], void, object>
) {
  return openIDB()
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
      return getIDBItem({ db, store: IDBStores.WORKBOOK }, "0").then((res) => {
        if (!res.workbook || res.workbook.length === 0) {
          throw ErrorWorkbookMissing;
        }

        return res.workbook;
      });
    })
    .catch((error) => {
      // if not fetch and build spreadsheet
      if (error instanceof Error) {
        const errData = error.cause as { code: string };
        if (errData?.code !== IDBErrorCause.NoResult) {
          // eslint-disable-next-line no-console
          console.log("Unknown error getting workbook from indexedDB");
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }

      return dispatch(getDatasets()).unwrap();
    })
    .catch((err) => {
      const { message } = err as { message: unknown };
      if (typeof message === "string" && message === "Failed to fetch") {
        return [
          jtox(
            {
              /** no data just headers */
            },
            workbookSheetNames.phrases.prettyName
          ),
          jtox(
            {
              /** no data just headers */
            },
            workbookSheetNames.vocabulary.prettyName
          ),
          jtox(
            {
              /** no data just headers */
            },
            workbookSheetNames.kanji.prettyName
          ),
        ];
      }

      throw err;
    });
}

/**
 * Parse xObject into csv text
 */
export function xObjectToCsvText(xObj: FilledSheetData[]) {
  //https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Working_with_files

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

    const csvP = new Promise<{ name: string; text: string }>(
      (resolve, _reject) => {
        let file = "";
        fileSim.on("write", (line) => {
          file += line;
        });

        fileSim.on("end", () => {
          resolve({ name: xObjSheet.name, text: file });
        });
      }
    );

    objectToCSV(xObjSheet, fileWriterSimulator);

    return csvP;
  });

  return Promise.all(filesP);
}

export default function Sheet() {
  const dispatch = useDispatch<AppDispatch>();

  const { phraseList, repetition: pRep } = useConnectPhrase();
  const { vocabList, repetition: vRep } = useConnectVocabulary();
  const { kanjiList, repetition: kRep } = useConnectKanji();

  const pMeta = useRef(pRep);
  pMeta.current = pRep;

  const vMeta = useRef(vRep);
  vMeta.current = vRep;

  const kMeta = useRef(kRep);
  kMeta.current = kRep;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wbRef = useRef<Spreadsheet | null>(null);
  const [workbookImported, setWorkbookImported] = useState<number>();

  const [resultBadge, setResultBadge] = useState(0);
  const prevResult = useRef<[number, number, string][]>([]);
  const resultIdx = useRef<number | null>(null);
  const searchValue = useRef<string | null>(null);
  const resetSearchCB = useCallback(() => {
    prevResult.current = [];
    resultIdx.current = null;
    setResultBadge(0);
  }, []);

  const { cookies } = useSelector(({ global }: RootState) => global);

  const [uploadError, setUploadError] = useState<boolean>(false);

  useEffect(() => {
    const gridEl = document.createElement("div");

    void getWorkbookFromIndexDB(dispatch, getDatasets).then((sheetArr) => {
      const data = sheetArr.map((s) => sheetAddExtraRow(s));

      const grid = new Spreadsheet(gridEl, defaultOp).loadData(data);

      // console.log(grid.bottombar.activeEl.el.innerHTML);

      grid.freeze(0, 1, 0).freeze(1, 1, 0).freeze(2, 1, 0).reRender();

      // replace typed '\n' with newline inside cell
      grid.on("cell-edited-done", (text: string, _ri: number, _ci: number) => {
        grid.sheet.data.setSelectedCellText(
          // characters to replace with \n
          //    literal '\n'
          //    two or more japanese spaces
          //    two or more english spaces
          text.replace(/\\n|\u3000{2,}|[ ]{2,}/g, "\n"),
          "finished"
        );
      });

      // reset search when switching sheet
      grid.bottombar?.menuEl.on("click", resetSearchCB);

      // TODO: x-spreadsheet grid.setMaxCols()
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
  }, [dispatch, resetSearchCB, workbookImported]);

  const onUploadErrorCB = useCallback((_err: Error) => {
    setUploadError(true);

    setTimeout(() => {
      setUploadError(false);
    }, 2000);
  }, []);

  /**
   * Updates app state with incoming dataset
   * Updates metadata with incoming metadata
   * Updates SW cache.json with state versions
   * @param name name of DataSet
   * @param hash
   * @param metaUpdateUids Record containing updated uids
   */
  const updateStateAndCacheCB = useCallback(
    (
      name: string,
      hash: string,
      metaUpdatedUids?: Record<string, MetaDataObj | undefined>
    ) => {
      switch (name) {
        case workbookSheetNames.kanji.prettyName:
          dispatch(setVersion({ name: "kanji", hash }));
          dispatch(clearKanji());
          if (metaUpdatedUids) {
            dispatch(kanjiBatchMetaUpdate(metaUpdatedUids));
          }
          break;
        case workbookSheetNames.vocabulary.prettyName:
          dispatch(setVersion({ name: "vocabulary", hash }));
          dispatch(clearVocabulary());
          dispatch(clearOpposites());
          if (metaUpdatedUids) {
            dispatch(vocabularyBatchMetaUpdate(metaUpdatedUids));
          }
          break;
        case workbookSheetNames.phrases.prettyName:
          dispatch(setVersion({ name: "phrases", hash }));
          dispatch(clearPhrases());
          dispatch(clearParticleGame());
          if (metaUpdatedUids) {
            dispatch(phraseBatchMetaUpdate(metaUpdatedUids));
          }
          break;
        default:
          throw new Error("Incorrect sheet name: " + name);
      }

      // update service worker cache.json file with app state versions
      void dispatch(setSwVersions());
    },
    [dispatch]
  );

  const saveSheetHandlerCB = useCallback(() => {
    if (!wbRef.current) {
      throw new Error("No Workbook");
    }

    if (wbRef.current === null) {
      throw new Error("Expected workbook");
    }

    const { activeSheetName } = getActiveSheet(wbRef.current);
    const w = wbRef.current?.exportValues();
    const trimmed = w.map((w) => removeLastRowIfBlank(w));
    const sheet = trimmed.find((s) => s.name === activeSheetName);

    if (!sheet || !isFilledSheetData(sheet)) {
      throw new Error("No Worksheet");
    }

    // update metadata for existing, but edited records (uid)
    const name = sheet.name as keyof typeof selectedData;
    const selectedData = {
      Phrases: {
        meta: pMeta.current,
        list: phraseList,
        update: phraseBatchMetaUpdate,
      },
      Vocabulary: {
        meta: vMeta.current,
        list: vocabList,
        update: vocabularyBatchMetaUpdate,
      },
      Kanji: {
        meta: kMeta.current,
        list: kanjiList,
        update: kanjiBatchMetaUpdate,
      },
    };
    const { meta, list: oldList } = selectedData[name];
    const { data, hash } = sheetDataToJSON(sheet) as {
      hash: string;
      data: Record<string, { uid: string; english: string }>;
    };

    const newList: { uid: string; english: string }[] = Object.keys(data).map(
      (k) => ({ uid: k, english: data[k].english })
    );
    const { updatedMeta: metaUpdatedUids, changedUID } = updateEditedUID(
      meta,
      oldList,
      newList
    );
    // TODO: use changedUID to remove or update? audio assets

    const saveP = saveSheetServiceWorker(sheet.name, data, hash);

    // store workbook in indexedDB
    // (keep ordering and notes)
    void openIDB().then((db) =>
      putIDBItem(
        { db, store: IDBStores.WORKBOOK },
        { key: "0", workbook: trimmed }
      )
    );

    void saveP.then(({ hash, name }) =>
      updateStateAndCacheCB(name, hash, metaUpdatedUids)
    );

    // local data edited, do not fetch use cached cache.json
    void dispatch(setLocalDataEdited(true));
  }, [dispatch, updateStateAndCacheCB, phraseList, vocabList, kanjiList]);

  const downloadFileHandlerCB = useCallback(
    (files: { fileName: string; text: string }[]) => {
      files.forEach(({ fileName, text }) => {
        const file = new Blob([text], {
          type: "application/plaintext; charset=utf-8",
        });
        // const file = new Blob(['csv.file'],{type:"octet/stream"})
        // const f = new File([file], './file.csv', {type:"octet/stream"})

        const dlUrl = URL.createObjectURL(file);
        // window.location.assign(dlUrl)

        // URL.revokeObjectURL()
        // browser.downloads.download(URL.createObjectURL(file))
        const a = document.createElement("a");
        a.download = fileName;
        a.href = dlUrl;
        // document.body.appendChild(a)
        a.click();

        setTimeout(() => {
          // document.body.removeChild(a)
          URL.revokeObjectURL(dlUrl);
        }, 0);
      });

      return Promise.resolve();
    },
    []
  );

  const exportAppDataToFileHandlerCB = useCallback(() => {
    // TODO: should zip and include settings?

    // TODO: should be from indexedDB (what's saved) unless nothing avail
    const xObj = wbRef.current?.exportValues() as FilledSheetData[];

    // send AppCache UserSettings
    let appSettings: { fileName: string; name: string; text: string }[] = [];
    const ls = getLocalStorageSettings(localStorageKey);
    if (ls) {
      appSettings = [
        {
          fileName: metaDataNames.settings.file,
          name: metaDataNames.settings.prettyName,
          text: JSON.stringify(ls),
        },
      ];
    }

    void xObjectToCsvText(xObj).then((fileDataSet) =>
      downloadFileHandlerCB([
        ...fileDataSet.map((f) => ({ fileName: f.name + ".csv", ...f })),
        ...appSettings,
      ])
    );
  }, [downloadFileHandlerCB]);

  const doSearchCB = useCallback(() => {
    const search = searchValue.current;
    const workbook = wbRef.current;
    if (search === null || workbook === null || search.trim() === "") return;

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
    const xOffset = defaultOp.row.height * (x - 1);
    workbook.sheet.verticalScrollbar.move({ top: xOffset });
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

    // TODO: show context-menu hack
    const menu = document.querySelector(".x-spreadsheet-contextmenu");
    const items = menu?.children;
    /**
     * Context Menu Items to display
     */
    const contextMenuItmToShow = (index: number) => {
      const items: { [key: number]: string } = {
        0: "Copy",
        2: "Paste",
        6: "InsertRow",
        7: "InsertColumn",
        9: "DeleteRow",
        10: "DeleteColumn",
        22: "ScrollToLastRow",
      };

      return items[index] !== undefined;
    };

    if (items) {
      Array.from(items).forEach((element, i) => {
        if (!contextMenuItmToShow(i)) {
          element.setAttribute("style", "display: none;");
        }
      });
    }

    const hiddenCss = "display: none;";
    const hidden = menu?.getAttribute("style")?.includes(hiddenCss);

    const css = hidden
      ? `display: block; right: ${1}px; bottom: ${1}px;`
      : hiddenCss;
    menu?.setAttribute("style", css);
  }, []);

  const [dataAction, setDataAction] = useState<
    "menu" | "importSync" | "exportSync" | "importFile"
  >();
  const closeDataAction = useCallback(() => {
    setDataAction(undefined);
  }, []);
  const openDataActionMenuCB = useCallback(() => {
    setDataAction("menu");
  }, []);
  const openImportFileCB = useCallback(() => {
    setDataAction("importFile");
  }, []);
  const openImportSyncCB = useCallback(() => {
    setDataAction("importSync");
  }, []);
  const openExportSyncCB = useCallback(() => {
    setDataAction("exportSync");
  }, []);

  /**
   * Imports datasets and settings to app
   */
  const importDataHandlerCB = useCallback(
    (
      importWorkbook?: FilledSheetData[],
      importSettings?: Partial<LocalStorageState>
    ) => {
      let importCompleteP: Promise<unknown>[] = [];
      if (importSettings && Object.keys(importSettings).length > 0) {
        // write to device's local storage
        setLocalStorage(localStorageKey, importSettings);

        // initialize app setttings from local storage
        const settingsP = dispatch(localStorageSettingsInitialized());

        // eslint-disable-next-line
        importCompleteP = [...importCompleteP, settingsP];
      }

      if (importWorkbook && importWorkbook.length > 0) {
        const workbookP = getWorkbookFromIndexDB(dispatch, getDatasets).then(
          (dbWorkbook) => {
            const trimmed = Object.values(workbookSheetNames).map((w) => {
              const { prettyName: prettyName } = w;

              const fileSheet = importWorkbook.find(
                (d) => d.name.toLowerCase() === prettyName.toLowerCase()
              );
              if (fileSheet) {
                return removeLastRowIfBlank(fileSheet);
              }

              const dbSheet = dbWorkbook.find(
                (d) => d.name.toLowerCase() === prettyName.toLowerCase()
              );
              if (dbSheet) {
                return dbSheet;
              }

              // if it never existed add blank placeholder
              return jtox(
                {
                  /** no data just headers */
                },
                prettyName
              );
            });

            // store workbook in indexedDB
            // update cached json objects
            return Promise.all([
              openIDB().then((db) =>
                putIDBItem(
                  { db, store: IDBStores.WORKBOOK },
                  { key: "0", workbook: trimmed }
                )
              ),
              ...trimmed.map((sheet) => {
                const { data, hash } = sheetDataToJSON(
                  sheet as FilledSheetData
                );
                return saveSheetServiceWorker(sheet.name, data, hash).then(() =>
                  updateStateAndCacheCB(sheet.name, hash)
                );
              }),
            ]).then(() => {
              // reload workbook (update useEffect)
              setWorkbookImported(Date.now());

              // local data edited, do not fetch use cached cache.json
              void dispatch(setLocalDataEdited(true));
              return;
            });
          }
        );

        // eslint-disable-next-line
        importCompleteP = [...importCompleteP, workbookP];
      }

      return Promise.all(importCompleteP).then(() => Promise.resolve());
    },
    [dispatch, updateStateAndCacheCB]
  );

  return (
    <>
      <div className="sheet main-panel pt-2">
        <DataSetActionMenu
          visible={dataAction === "menu"}
          close={closeDataAction}
          saveChanges={saveSheetHandlerCB}
          importFromFile={openImportFileCB}
          importFromSync={openImportSyncCB}
          exportToFile={exportAppDataToFileHandlerCB}
          exportToSync={openExportSyncCB}
        />
        <DataSetImportFile
          visible={dataAction === "importFile"}
          close={closeDataAction}
          updateDataHandler={importDataHandlerCB}
        />
        <DataSetExportSync
          visible={dataAction === "exportSync"}
          close={closeDataAction}
        />
        <DataSetImportSync
          visible={dataAction === "importSync"}
          close={closeDataAction}
          downloadFileHandler={downloadFileHandlerCB}
          updateDataHandler={importDataHandlerCB}
        />

        <div className="d-flex flex-row justify-content-end pt-2 px-3 w-100">
          <div className="pt-1 pe-1">
            <Fab
              aria-label="DataSet Actions"
              aria-disabled={!cookies}
              variant="extended"
              size="small"
              disabled={!cookies}
              onClick={openDataActionMenuCB}
              className="m-0 z-index-unset"
              tabIndex={3}
            >
              <GearIcon size="small" />
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
                    resetSearchCB();
                    searchValue.current = value;
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
    </>
  );
}

export { SheetMeta };
