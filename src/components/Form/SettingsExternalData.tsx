import { Button } from "@mui/material";
import {
  CheckCircleIcon,
  DownloadIcon,
  UndoIcon,
} from "@primer/octicons-react";
import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import ExtSourceInput, {
  ExternalSourceType,
  getExternalSourceType,
} from "./ExtSourceInput";
import { dataServiceEndpoint } from "../../../environment.production";
import { IDBStores, openIDB, putIDBItem } from "../../../pwa/helper/idbHelper";
import { sheetDataToJSON } from "../../../service/helper/jsonHelper";
import { swMessageSaveDataJSON } from "../../helper/serviceWorkerHelper";
import { useSubscribe } from "../../hooks/useSubscribe";
import { type AppDispatch, RootState } from "../../slices";
import { setLastImport, setLocalDataEdited } from "../../slices/globalSlice";
import { clearKanji } from "../../slices/kanjiSlice";
import { clearOpposites } from "../../slices/oppositeSlice";
import { clearParticleGame } from "../../slices/particleSlice";
import { clearPhrases } from "../../slices/phraseSlice";
import { importDatasets } from "../../slices/sheetSlice";
import {
  VersionInitSlice,
  setSwVersions,
  setVersion,
} from "../../slices/versionSlice";
import { clearVocabulary } from "../../slices/vocabularySlice";

export default function SettingsExternalData() {
  const dispatch = useDispatch<AppDispatch>();

  const { localServiceURL, lastImport } = useSelector(
    ({ global }: RootState) => global
  );

  const [userInputError, setUserInputError] = useState(false);
  const [userTrust, setUserTrust] = useState<boolean | null>(false);

  const [imported, setImported] = useState<boolean | null>(false);
  const serviceAddress = useRef(localServiceURL);
  const { registerCB } = useSubscribe(dispatch, serviceAddress);

  const importCB = useCallback(() => {
    if (!confirm("User edited datasets will be overwritten")) {
      return;
    }

    const type = getExternalSourceType(localServiceURL);
    if (type === ExternalSourceType.Unset) {
      // fetch cache.json
      void dispatch(setLocalDataEdited(false));
    } else {
      // don't fetch cache.json
      void dispatch(setLocalDataEdited(true));
    }

    void dispatch(importDatasets())
      .unwrap()
      .then((obj) => {
        return Promise.all(
          obj.map((sheetObj) => {
            const { data, hash } = sheetDataToJSON(sheetObj);
            const name = sheetObj.name.toLowerCase() as keyof VersionInitSlice;
            dispatch(setVersion({ name, hash }));

            return swMessageSaveDataJSON(
              dataServiceEndpoint + "/" + name + ".json.v" + hash,
              data,
              hash
            ).then(() => sheetObj);
          })
        ).then((workbook) => {
          // store workbook in indexedDB
          void openIDB().then((db) =>
            putIDBItem(
              { db, store: IDBStores.WORKBOOK },
              { key: "0", workbook }
            )
          );

          // update service worker versions
          return dispatch(setSwVersions());
        });
      })
      .then(() => {
        // clear saved data states
        dispatch(clearVocabulary());
        dispatch(clearPhrases());
        dispatch(clearKanji());
        dispatch(clearParticleGame());
        dispatch(clearOpposites());

        setImported(true);
        dispatch(
          setLastImport(
            `${["Reset", "Local", "GitHub"][type]}: ${new Date().toJSON()}`
          )
        );
      });
  }, [dispatch, localServiceURL]);

  const onChangeInputCB = useCallback((valid: boolean) => {
    setUserInputError(valid);
  }, []);

  const onChangeTrustCB = useCallback((trust: boolean | null) => {
    setUserTrust(trust);
    if (!trust) {
      setImported(null);
    }
  }, []);

  return (
    <div className="outer">
      <div className="d-flex flex-column flex-sm-row justify-content-between">
        <div className="column-1 mb-2 me-sm-2">
          <div className="mt-2 mb-2">
            {[
              <div key="label">Recent import history:</div>,
              ...lastImport.map((i) => (
                <div key={i} className="pt-1">
                  {i}
                </div>
              )),
            ]}
          </div>
        </div>

        <div className="column-2">
          <div className="mb-2">
            <ExtSourceInput
              onChangeInput={onChangeInputCB}
              onChangeTrust={onChangeTrustCB}
            />
          </div>
          <div className="d-flex">
            <div className="px-1">
              <Button
                variant="outlined"
                size="small"
                disabled={
                  userInputError ||
                  localServiceURL === "" ||
                  userTrust !== true ||
                  imported === true
                }
                onClick={importCB}
              >
                {imported ? (
                  <CheckCircleIcon size="small" className="pe-1" />
                ) : (
                  <DownloadIcon size="small" className="pe-1" />
                )}
                Import
              </Button>
            </div>
            <div className="px-1">
              <Button
                variant="contained"
                size="small"
                disabled={
                  userInputError || localServiceURL === "" || !userTrust
                }
              >
                <Link to={"/sheet"} className="text-decoration-none">
                  Edit <UndoIcon />
                </Link>
              </Button>
            </div>
            <div className="px-1">
              <Button
                variant="outlined"
                onClick={registerCB}
                size="small"
                disabled={
                  userInputError || localServiceURL === "" || !userTrust
                }
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
