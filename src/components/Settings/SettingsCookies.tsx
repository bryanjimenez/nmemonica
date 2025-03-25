import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import {
  cookieAcceptance,
  deleteCookie,
  setCookie,
} from "../../helper/cookieHelper";
import { buildAction } from "../../helper/eventHandlerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { AppDispatch } from "../../slices";
import {
  getMemoryStorageStatus,
  setPersistentStorage,
  toggleCookies,
} from "../../slices/globalSlice";
import SettingsSwitch from "../Input/SettingsSwitch";
import { CookiePolicyMeta } from "../Terms/CookiePolicy";

export function CookieOptions() {
  const dispatch = useDispatch();
  const { cookies: usingCookies } = useConnectSetting();
  const refreshCookieResponseCB = useCallback(() => {
    dispatch(toggleCookies(usingCookies));
  }, [dispatch, usingCookies]);

  const [clicked, setClicked] = useState(false);

  return (
    <FormControl>
      <RadioGroup
        aria-labelledby="Cookie consent response"
        onClick={refreshCookieResponseCB}
      >
        <FormControlLabel
          className="m-0"
          value="Accept Cookies"
          control={
            <Radio
              checked={usingCookies}
              onChange={() => {
                dispatch(toggleCookies(true));
                setCookie(cookieAcceptance, new Date().toJSON());
              }}
            />
          }
          label={
            <span>
              <span>Accept</span>
              <span className={classNames({ invisible: !usingCookies })}>
                ed
              </span>
            </span>
          }
        />
        <FormControlLabel
          className="m-0"
          value="Reject Cookies"
          control={
            <Radio
              checked={!usingCookies && clicked}
              onChange={() => {
                dispatch(toggleCookies(false));
                deleteCookie(cookieAcceptance);
                setClicked(true);
              }}
            />
          }
          label={
            <span>
              <span>Reject</span>
              <span
                className={classNames({ invisible: usingCookies || !clicked })}
              >
                ed
              </span>
            </span>
          }
        />
      </RadioGroup>
    </FormControl>
  );
}

export default function SettingsCookies() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies: usingCookies, memory } = useConnectSetting();

  useEffect(() => {
    void dispatch(getMemoryStorageStatus());
  }, [
    dispatch,
    /** On mount and dismount */
  ]);

  return (
    <>
      <div>
        <h3 className="mt-3 mb-1 fw-light">Cookies</h3>

        <div className="text-end">
          <p>
            Read our <Link to={CookiePolicyMeta.location}>Cookie Policy</Link>.
          </p>
        </div>

        <div className="d-flex flex-row justify-content-between">
          <div className="column-1 mb-2 me-sm-2">
            <div className="ps-2 mt-2 mb-2">
              <p>
                <span>We use cookies.</span>
              </p>
              <p
                className={classNames({
                  invisible: usingCookies,
                })}
              >
                But you&apos;ve opted out.
              </p>
              <p
                className={classNames({
                  invisible: usingCookies,
                  "disabled-color": !usingCookies,
                })}
              >
                <strong>Only basic functionality enabled.</strong>
              </p>
            </div>
          </div>

          <div className="column-2">
            <div className="ps-2 d-flex flex-column align-items-end">
              <CookieOptions />
            </div>
          </div>
        </div>
      </div>
      <div className={classNames({ "disabled-color": !usingCookies })}>
        <h3 className="mt-3 mb-1 fw-light">Persistent Storage</h3>
        <div className="d-flex flex-row justify-content-between">
          <div className="column-1 mb-2 me-sm-2">
            <div className="ps-2 mt-2 mb-2">
              <p className="mw-75">
                <span>
                  For native-app-like experience, enable{" "}
                  <strong>Persistent Storage</strong>. It lets the browser know
                  you&apos;d like to prioritize the storage of this app&apos;s
                  data. Data storage lifetime depends on your browser&apos;s
                  implementation. See Persistent Storage under our{" "}
                  <Link to={CookiePolicyMeta.location}>Cookie Policy</Link> for
                  more details.
                </span>
              </p>
            </div>
          </div>

          <div className="column-2">
            <div className="pt-4 text-end">
              <p>
                {memory.persistent ? <>Enabled</> : <strong>Disabled</strong>}
              </p>
            </div>
            <div className="ps-2 d-flex flex-column align-items-end">
              <SettingsSwitch
                active={memory.persistent}
                action={buildAction(dispatch, setPersistentStorage)}
                disabled={!usingCookies || memory.persistent}
                color="default"
                statusText={""}
              />
            </div>
            <div className="pt-3">
              <p className="text-nowrap text-end">
                {memory.persistent && (
                  <>{`${~~(memory.usage / 1024 / 1024)}
                        /
                        ${~~(memory.quota / 1024 / 1024)}
                        MB`}</>
                )}
              </p>
            </div>
            <div></div>
          </div>
        </div>
      </div>
    </>
  );
}
