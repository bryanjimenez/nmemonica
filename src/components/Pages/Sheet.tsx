import { Badge, Fab, TextField } from "@mui/material";
import {
  type CellStyle,
  type SheetData,
  Spreadsheet,
} from "@nmemonica/x-spreadsheet";
import {
  BlockedIcon,
  GearIcon,
  LinkExternalIcon,
  // RssIcon,
  SearchIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@nmemonica/x-spreadsheet/dist/index.css";
import { useDispatch, useSelector } from "react-redux";

import { IDBStores, openIDB, putIDBItem } from "../../../pwa/helper/idbHelper";
import { WebRTCProvider } from "../../context/webRTC";
import { validateCSVSheet } from "../../helper/csvHelper";
import { furiganaParse } from "../../helper/JapaneseText";
import { prettyHeaders, sheetDataToJSON } from "../../helper/jsonHelper";
import {
  getActiveSheet,
  getWorkbookFromIndexDB,
  removeLastRowIfBlank,
  searchInSheet,
  sheetAddExtraRow,
  touchScreenCheck,
  updateEditedUID,
  updateStateAfterWorkbookEdit,
  validateInSheet,
  workbookSheetNames,
} from "../../helper/sheetHelper";
import {
  type FilledSheetData,
  isFilledSheetData,
} from "../../helper/sheetHelperImport";
import {
  SyncDataFile,
  dataTransferAggregator,
} from "../../helper/transferHelper";
import {
  setStudyProgress,
  setUserSetting,
} from "../../helper/userSettingsHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import {
  AppDispatch,
  AppProgressState,
  AppSettingState,
  RootState,
} from "../../slices";
import { appSettingsInitialized } from "../../slices/globalSlice";
import { DataSetActionMenu } from "../Dialog/DataSetActionMenu";
import { DataSetExport } from "../Dialog/DataSetExport";
import { DataSetImport } from "../Dialog/DataSetImport";
import { DataSetImportFile } from "../Dialog/DataSetImportFile";
import { WRTCSignalingQR } from "../Dialog/WRTCSignalingQR";
import { DataSetSharingActions } from "../Form/DataSetSharingActions";
import "../../css/Sheet.css";

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

enum cellStyleNames {
  warn = "warn",
}

const cellStyles: Record<cellStyleNames, CellStyle> = {
  warn: {
    bgcolor: "#fa9696",
    border: {
      top: ["dashed", "#FF0000"],
      bottom: ["dashed", "#FF0000"],
      left: ["dashed", "#FF0000"],
      right: ["dashed", "#FF0000"],
    },
  },
};

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
  const prevResult = useRef<{ ri: number; ci: number; text: string }[]>([]);
  const resultIdx = useRef<number | null>(null);
  const warningIdx = useRef<number>(undefined);
  const searchValue = useRef<string | null>(null);
  const resetSearchCB = useCallback(() => {
    prevResult.current = [];
    resultIdx.current = null;
    setResultBadge(0);
  }, []);

  const [hasError, setHasError] = useState<
    { ri: number; ci: number; name: string }[]
  >([]);
  const selectedCell = useRef<{ ri: number; ci: number }>({ ri: 0, ci: 0 });

  const { cookies } = useSelector(({ global }: RootState) => global);

  useEffect(() => {
    const gridEl = document.createElement("div");

    void getWorkbookFromIndexDB().then((sheetArr) => {
      // Preserve display sheet ordering
      const data = [
        workbookSheetNames.phrases.prettyName,
        workbookSheetNames.vocabulary.prettyName,
        workbookSheetNames.kanji.prettyName,
      ].reduce<SheetData[]>((acc, name) => {
        const s = sheetArr.find(
          (s) => s.name.toLowerCase() === name.toLowerCase()
        );
        if (s !== undefined) {
          //@ts-expect-error nmemonica/x-spreadsheet todo
          s.styles = cellStyles;
          acc = [...acc, sheetAddExtraRow(s)];
        }
        return acc;
      }, []);

      const grid = new Spreadsheet(gridEl, defaultOp).loadData(data);

      // console.log(grid.bottombar.activeEl.el.innerHTML);

      grid.freeze(0, 1, 0).freeze(1, 1, 0).freeze(2, 1, 0).reRender();

      // replace typed '\n' with newline inside cell
      grid.on("cell-edited-done", (text, ri, ci) => {
        let errorStyle: cellStyleNames | undefined = undefined;
        const cell = grid.sheet.data.getCell(ri, ci);

        // characters to replace with \n
        //    literal '\n'
        //    two or more japanese spaces
        //    two or more english spaces
        const replacedText = text.replace(/\\n|\u3000{2,}|[ ]{2,}/g, "\n");
        grid.sheet.data.setSelectedCellText(replacedText, "finished");

        const { activeSheetName } = getActiveSheet(grid);

        // FIXME: can't access row directly...
        const header = grid.sheet.data.rows._[0].cells[ci].text;
        if (header === undefined) {
          return;
        }

        errorStyle =
          errorStyle ??
          validateFuriganaParse(
            activeSheetName,
            header,
            replacedText,
            cellStyleNames.warn
          );

        const thisError =
          errorStyle !== undefined
            ? [{ ri, ci, name: activeSheetName }]
            : [
                /** no error found */
              ];
        setHasError((prev) => [
          ...prev.filter(
            (e) => !(e.ri === ri && e.ci === ci && e.name === activeSheetName)
          ),
          ...thisError,
        ]);

        //@ts-expect-error nmemonica/x-spreadsheet todo
        cell.style = errorStyle;
      });

      // store the coordinates
      grid.on("cell-selected", (_cell, ri, ci) => {
        selectedCell.current = { ri, ci };
      });

      // validate input
      grid.on("change", (sheet: SheetData) => {
        let errorStyle: cellStyleNames | undefined = undefined;
        const { ri, ci } = selectedCell.current;

        let cell = undefined;
        if (
          sheet.rows !== undefined &&
          sheet.rows[ri] !== undefined &&
          sheet.rows[ri].cells[ci] !== undefined
        ) {
          cell = sheet.rows[ri].cells[ci];
        }

        if (cell !== undefined) {
          // some cell input change event
          // validate cell

          const { text } = cell;
          if (text !== undefined) {
            const invalid = validateCSVSheet(text);

            if (invalid.size > 0) {
              errorStyle = cellStyleNames.warn;
            }
          }

          const thisError =
            errorStyle !== undefined
              ? [{ ri, ci, name: sheet.name }]
              : [
                  /** no error found */
                ];
          setHasError((prev) => [
            ...prev.filter(
              (e) => !(e.ri === ri && e.ci === ci && e.name === sheet.name)
            ),
            ...thisError,
          ]);

          // TODO: implement like grid.sheet.data.addStyle()
          //@ts-expect-error nmemonica/x-spreadsheet todo
          cell.style = errorStyle;
        } else {
          // some non cell input change event
          // validate whole sheet

          const { name } = sheet;
          const invalid = validateInSheet(sheet, validateCSVSheet);
          setHasError((prev) => [
            ...prev.filter((e) => e.name !== name),
            ...invalid.map(({ ri, ci }) => ({ ri, ci, name })),
          ]);
        }

        resetSearchCB();
        grid.reRender();
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
      if (c !== null && c.contains(gridEl)) {
        c?.removeChild(gridEl);
      }
    };
  }, [dispatch, resetSearchCB, workbookImported]);

  const saveSheetHandlerCB = useCallback(() => {
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
      },
      Vocabulary: {
        meta: vMeta.current,
        list: vocabList,
      },
      Kanji: {
        meta: kMeta.current,
        list: kanjiList,
      },
    };
    const { meta, list: oldList } = selectedData[name];
    const { data } = sheetDataToJSON(sheet) as {
      data: Record<string, { uid: string; english: string }>;
    };

    const newList: { uid: string; english: string }[] = Object.keys(data).map(
      (k) => ({ uid: k, english: data[k].english })
    );
    const { updatedMeta: metaUpdatedUids } = updateEditedUID(
      meta,
      oldList,
      newList
    );

    // store workbook in indexedDB
    // (keep ordering and notes)
    void openIDB()
      .then((db) =>
        putIDBItem(
          { db, store: IDBStores.WORKBOOK },
          { key: "0", workbook: trimmed }
        )
      )
      .then(() => {
        updateStateAfterWorkbookEdit(dispatch, name, metaUpdatedUids);
      });
  }, [dispatch, phraseList, vocabList, kanjiList]);

  const downloadFileHandlerCB = useCallback((files: SyncDataFile[]) => {
    files.forEach(({ fileName, file: text }) => {
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
  }, []);

  /**
   * Export data, settings, and progress to file system
   */
  const exportToFileHandlerCB = useCallback(() => {
    // TODO: should zip and include settings?

    void dataTransferAggregator().then(downloadFileHandlerCB);
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

    const { ri } = result[resultIdx.current];

    // first row is frozen for headers
    workbook.focusOnCell(ri - 1, 0);
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

    const css =
      hidden === true
        ? `display: block; right: ${1}px; bottom: ${1}px;`
        : hiddenCss;
    menu?.setAttribute("style", css);
  }, []);

  const [dataAction, setDataAction] = useState<
    | "menu"
    | "importSync"
    | "exportSync"
    | "importFile"
    | "signaling"
    | "import"
    | "export"
  >();
  const closeDataAction = useCallback(() => {
    setDataAction(undefined);
  }, []);
  const openDataActionMenuCB = useCallback(() => {
    setDataAction("menu");
  }, []);
  /** Cycle through validation failures */
  const validationFailedCB = useCallback(() => {
    const workbook = wbRef.current;

    if (workbook === null || hasError.length === 0) {
      return;
    }

    const index =
      warningIdx.current !== undefined && warningIdx.current < hasError.length
        ? warningIdx.current
        : 0;
    const errorCell = hasError[index];
    // first row is frozen for headers
    workbook.focusOn(errorCell.name, errorCell.ri - 1, errorCell.ci);

    warningIdx.current = (index + 1) % hasError.length;
  }, [hasError]);
  const openImportFileCB = useCallback(() => {
    setDataAction("importFile");
  }, []);
  const openSignalingCB = useCallback(() => {
    setDataAction("signaling");
  }, []);

  /**
   * Imports datasets and settings to app
   */
  const importDataHandlerCB = useCallback(
    (
      importWorkbook?: FilledSheetData[],
      importSettings?: Partial<AppSettingState>,
      importProgress?: Partial<AppProgressState>
    ) => {
      let importCompleteP: Promise<unknown>[] = [];
      if (importSettings && Object.keys(importSettings).length > 0) {
        // write to device's local storage
        void setUserSetting(importSettings);

        // initialize app setttings from local storage
        const settingsP = dispatch(appSettingsInitialized());

        importCompleteP = [...importCompleteP, settingsP];
      }
      if (
        importProgress !== undefined &&
        Object.keys(importProgress).length > 0
      ) {
        // write to device's local storage
        void setStudyProgress(importProgress);
      }
      if (importWorkbook && importWorkbook.length > 0) {
        const allSheetRequired = Object.keys(workbookSheetNames).map(
          (k) => k as keyof typeof workbookSheetNames
        );
        const workbookP = getWorkbookFromIndexDB(allSheetRequired).then(
          (dbWorkbook) => {
            const trimmed = Object.values(workbookSheetNames).map((w) => {
              const { prettyName: prettyName } = w;

              const fileSheet = importWorkbook.find(
                (d) => d.name.toLowerCase() === prettyName.toLowerCase()
              );
              if (fileSheet) {
                return removeLastRowIfBlank(fileSheet);
              }

              // dbWorkbook guarantees to contain sheet
              const dbSheetIdx = dbWorkbook.findIndex(
                (d) => d.name.toLowerCase() === prettyName.toLowerCase()
              );
              // keep existing or blank placeholder
              return dbWorkbook[dbSheetIdx];
            });

            // store workbook in indexedDB
            // update cached json objects
            return openIDB()
              .then((db) =>
                putIDBItem(
                  { db, store: IDBStores.WORKBOOK },
                  { key: "0", workbook: trimmed }
                )
              )
              .then(() => {
                // reload workbook (update useEffect)
                setWorkbookImported(Date.now());

                trimmed.forEach((sheet) => {
                  updateStateAfterWorkbookEdit(dispatch, sheet.name);
                });

                return;
              });
          }
        );

        importCompleteP = [...importCompleteP, workbookP];
      }

      return Promise.all(importCompleteP).then(() => Promise.resolve());
    },
    [dispatch]
  );

  return (
    <>
      <div className="sheet main-panel pt-2">
        <DataSetActionMenu
          visible={dataAction === "menu"}
          close={closeDataAction}
          saveChanges={saveSheetHandlerCB}
          importFromFile={openImportFileCB}
          exportToFile={exportToFileHandlerCB}
          signaling={openSignalingCB}
        />
        <DataSetImportFile
          visible={dataAction === "importFile"}
          close={closeDataAction}
          importHandler={importDataHandlerCB}
        />

        {dataAction === "signaling" && (
          <WebRTCProvider>
            {/* <WRTCSignalingText close={closeDataAction} /> */}
            <WRTCSignalingQR close={closeDataAction} />
            <DataSetSharingActions>
              <DataSetExport action="export" close={closeDataAction} />
              <DataSetImport
                action="import"
                close={closeDataAction}
                downloadHandler={downloadFileHandlerCB}
                importHandler={importDataHandlerCB}
              />
            </DataSetSharingActions>
          </WebRTCProvider>
        )}

        <div className="d-flex flex-row justify-content-end pt-2 px-3 w-100">
          <div className="pt-1 pe-1">
            <Badge
              badgeContent={hasError.length}
              color={hasError.length > 0 ? "error" : "success"}
            >
              <Fab
                aria-label="DataSet Actions"
                aria-disabled={!cookies}
                variant="extended"
                size="small"
                color={hasError.length > 0 ? "warning" : undefined}
                disabled={!cookies}
                onClick={
                  hasError.length > 0
                    ? validationFailedCB
                    : openDataActionMenuCB
                }
                className="m-0 z-index-unset"
                tabIndex={3}
              >
                {hasError.length > 0 ? (
                  <BlockedIcon size="small" />
                ) : (
                  <GearIcon size="small" />
                )}
              </Fab>
            </Badge>
          </div>
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

/**
 * Validate furigana parse for current cell text
 * @param activeSheetName
 * @param cellHeader
 * @param cellText
 * @param errorStyle style to be set on error
 */
function validateFuriganaParse(
  activeSheetName: string,
  cellHeader: string,
  cellText: string,
  errorStyle: cellStyleNames
) {
  let hasError: cellStyleNames | undefined = undefined;

  if (
    (activeSheetName === workbookSheetNames.phrases.prettyName ||
      activeSheetName === workbookSheetNames.vocabulary.prettyName) &&
    prettyHeaders.japanese.includes(cellHeader) &&
    cellText.includes("\n")
  ) {
    const [pronunciation, ortography] = cellText.split("\n");

    const result = furiganaParse(pronunciation, ortography);
    if (result instanceof Error) {
      hasError = errorStyle;
    }
  }

  return hasError;
}

export { SheetMeta };
