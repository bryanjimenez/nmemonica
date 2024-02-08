import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import classNames from "classnames";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import {
  cookieAcceptance,
  deleteCookie,
  setCookie,
} from "../../helper/cookieHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { toggleCookies } from "../../slices/globalSlice";
import { CookiePolicyMeta } from "../Terms/CookiePolicy";

export function CookieOptions() {
  const dispatch = useDispatch();
  const { cookies: usingCookies } = useConnectSetting();

  const [clicked, setClicked] = useState(false);

  return (
    <FormControl>
      <RadioGroup aria-labelledby="Cookie consent response">
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
  const { cookies: usingCookies } = useConnectSetting();

  return (
    <div className="outer">
      <h3 className="mt-3 mb-1">Cookies</h3>

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
  );
}
