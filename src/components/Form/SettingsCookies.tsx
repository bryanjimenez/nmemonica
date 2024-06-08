import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { InfoIcon } from "@primer/octicons-react";
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
import { CookiePolicyMeta } from "../Pages/CookiePolicy";

export default function SettingsCookies() {
  const dispatch = useDispatch();
  const { cookies: usingCookies } = useConnectSetting();
  const [clicked, setClicked] = useState(false);

  return (
    <div className="outer">
      <div className="d-flex flex-column flex-sm-row justify-content-between">
        <div className="column-2">
          <InfoIcon size="large" />
        </div>
        <div className="column-1 mb-2 me-sm-2 w-50">
          <div className="mt-2 mb-2">
            <p>
              {"We use cookies." +
                (!usingCookies ? " But you've opted out." : "")}
            </p>
            <p
              className={classNames({
                invisible: usingCookies,
                "disabled-color": !usingCookies,
              })}
            >
              Only basic functionality enabled.
            </p>
            <p>
              Read our <Link to={CookiePolicyMeta.location}>Cookie Policy</Link>
              .
            </p>
          </div>
        </div>

        <div className="column-3">
          <div className="d-flex flex-column">
            <FormControl>
              <RadioGroup aria-labelledby="Cookie consent response">
                <FormControlLabel
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
                  label="Accept"
                />
                <FormControlLabel
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
                  label="Reject"
                />
              </RadioGroup>
            </FormControl>
          </div>
        </div>
      </div>
    </div>
  );
}
