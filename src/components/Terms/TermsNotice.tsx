import { InfoIcon } from "@primer/octicons-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import { CookiePolicyMeta } from "./CookiePolicy";
import { PrivacyPolicyMeta } from "./PrivacyPolicy";
import { TermsAndConditionsMeta } from "./TermsAndConditions";
import { allowedCookies } from "../../helper/cookieHelper";
import { RootState } from "../../slices";
import { Notice } from "../Form/Notice";
import { CookieOptions } from "../Form/SettingsCookies";

interface TermsNoticeProps {
  showInPages: string[];
}

export function TermsNotice(props: TermsNoticeProps) {
  const { showInPages } = props;
  const location = useLocation();

  const cookieImportant = !useMemo(allowedCookies, [location]);
  const { cookies, cookieRefresh } = useSelector(
    (state: RootState) => state.global
  );

  const path =
    location.pathname.length > 1 && location.pathname.endsWith("/")
      ? location.pathname.slice(0, -1)
      : location.pathname;

  const allowedPagesForNotice = [
    "/",
    ...showInPages.map((p) => (p.endsWith("/") ? p.slice(0, -1) : p)),
  ];

  if (!cookieImportant || !allowedPagesForNotice.includes(path)) {
    // Don't show if in Settings page or permission has been granted
    return null;
  }

  return (
    <Notice
      initShown={cookieImportant && !cookies && cookieRefresh === -1}
      refresh={cookieRefresh}
      timeout={1500}
      label="Terms Information"
      icon={<InfoIcon size="medium" />}
    >
      <div className="px-2">
        <div className="pb-1">
          <div>
            <p className="text-wrap fw-light">
              First time using our app? Before we continue please review the
              topics below. All <strong>Guidelines</strong> will be accessible
              from the &quot;Settings&quot; page.
            </p>
          </div>
        </div>
        <div className="pb-1">
          <strong>Usage Guidelines</strong>
        </div>
        <div>
          <p className="text-wrap m-0 ps-2">
            Please take a moment to read our{" "}
            <Link to={TermsAndConditionsMeta.location}>
              Terms and Conditions
            </Link>{" "}
            and <Link to={PrivacyPolicyMeta.location}>Privacy Policy</Link>.
          </p>
        </div>
        <div className="pb-1">
          <strong>Cookie Policy</strong>
        </div>
        <div>
          <p className="text-wrap m-0 ps-2">
            By clicking &quot;Accept Cookies&quot;, you agree Nmemonica can
            store cookies on your device and use cookies in accordance with our{" "}
            <Link to={CookiePolicyMeta.location}>Cookie Policy</Link>.
          </p>
          <div>
            <div className="setting-block">
              <div className="d-flex flex-column">
                <div className="align-self-end">
                  <CookieOptions />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Notice>
  );
}
