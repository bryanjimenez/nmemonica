import { Button } from "@mui/material";
import { InfoIcon } from "@primer/octicons-react";
import { useDispatch } from "react-redux";

import {
  cookieAcceptance,
  deleteCookie,
  setCookie,
} from "../../helper/cookieHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { toggleCookies } from "../../slices/globalSlice";

export default function SettingsCookies() {
  const dispatch = useDispatch();
  const { cookies: usingCookies } = useConnectSetting();

  return (
    <div className="outer">
      <div className="d-flex flex-column flex-sm-row justify-content-between">
        <div className="column-1 mb-2 me-sm-2">
          <div className="mt-2 mb-2">
            <p>
              {"We use cookies." +
                (!usingCookies ? " But you've opted out." : "")}
            </p>
          </div>
        </div>

        <div className="column-2">
          <InfoIcon size="large" />
        </div>
        <div className="column-3">
          <div className="d-flex flex-column">
            <div className="py-1 align-self-end">
              <Button
                aria-label="Accept Cookies"
                variant={usingCookies ? "contained" : "outlined"}
                size="small"
                onClick={() => {
                  dispatch(toggleCookies(true));
                  setCookie(cookieAcceptance, new Date().toJSON());
                }}
              >
                Accept
              </Button>
            </div>
            <div className="py-1 align-self-end">
              <Button
                aria-label="Reject Cookies"
                variant={!usingCookies ? "contained" : "outlined"}
                color="warning"
                size="small"
                onClick={() => {
                  dispatch(toggleCookies(false));
                  deleteCookie(cookieAcceptance);
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
