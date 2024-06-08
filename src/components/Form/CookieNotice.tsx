import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

import { Cookie } from "./Cookie";
import {
  allowedCookies,
  cookieAcceptance,
  deleteCookie,
  setCookie,
} from "../../helper/cookieHelper";
import { RootState } from "../../slices";
import { toggleCookies } from "../../slices/globalSlice";
import { CookiePolicyMeta } from "../Pages/CookiePolicy";
import { SettingsMeta } from "../Pages/Settings";

export function CookieNotice() {
  const dispatch = useDispatch();

  const { cookies } = useSelector(({ global }: RootState) => global);
  const [clicked, setClicked] = useState(false);
  const location = useLocation();

  const cookieImportant = !useMemo(allowedCookies, [location]);

  if (
    !cookieImportant ||
    [CookiePolicyMeta.location, SettingsMeta.location].includes(
      location.pathname
    )
  ) {
    // Don't show if in Settings page or permission has been granted
    return null;
  }

  return (
    <Cookie timeout={1500}>
      <div className="px-2">
        <div className="pb-1">
          <strong>Cookie Policy</strong>
        </div>
        <div>
          <p className="text-wrap">
            By clicking &quot;Accept Cookies&quot;, you agree Nmemonica can
            store cookies on your device and use cookies in accordance with our{" "}
            <Link to={CookiePolicyMeta.location}>Cookie Policy</Link>.
          </p>
          <div>
            <div className="setting-block">
              <div className="d-flex flex-column">
                <div className="py-1 align-self-end">
                  <FormControl>
                    <RadioGroup aria-labelledby="Cookie consent response">
                      <FormControlLabel
                        value="Accept Cookies"
                        control={
                          <Radio
                            checked={cookies}
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
                            checked={!cookies && clicked}
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
        </div>
      </div>
    </Cookie>
  );
}
