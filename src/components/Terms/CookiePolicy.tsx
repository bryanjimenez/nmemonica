import React from "react";

import { cookieAcceptance } from "../../helper/cookieHelper";

const CookiePolicyMeta = {
  location: "/cookies/",
  label: "CookiePolicy",
};

const headerCss = "py-2 pt-4";
const topicCss = "py-2 pt-4"

export default function CookiePolicy() {
  return (
    <React.Fragment>
      <div className="cookie-policy main-panel h-100">
        <div className="d-flex justify-content-between h-100 px-2">
          <div className="py-3">
            <h1>Cookie Policy</h1>

            <h2 className={headerCss}>What are cookies?</h2>
            <p className="m-0 ps-2">
              A cookie (and cookie technologies for example: browser cookies,
              local storage, and IndexedDB storage) is a file that is stored on
              your device that contains information which identifies you to a
              website. Websites use cookies to personalize your web experience
              based on your preferences and also for personalized ads.
            </p>
            <p className="m-0 ps-2 pt-2">
              To learn more about browser storage technologies see{" "}
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#what_technologies_store_data_in_the_browser"
                target="_blank"
                rel="noreferrer"
              >
                MDN Storage_API
              </a>
              .
            </p>
            <h2 className={headerCss}>How do we use cookies?</h2>
            <p className="m-0 ps-2">
              This application does not collect personal information, analyze
              user browsing behavior, display targeted ads, nor does it share
              any of your data with third parties.
            </p>
            <p className="m-0 ps-2">
              This application uses cookie technologies to:
            </p>
            <ul>
              <li>Identify you as a user.</li>
              <li>Store user app data (language datasets).</li>
              <li>Store user app media (language pronunciations).</li>
              <li>
                Enable offline app use by utilizing stored data and media.
              </li>
            </ul>
            <h2 className={headerCss}>Opting out of cookies</h2>
            <p className="m-0 ps-2">
              Please note that blocking cookies will impact the functionality of
              the application and only minimal features will remain.
            </p>
            <p className="m-0 ps-2">
              Instructions on deleting cookies for commonly used browsers:
            </p>
            <p className="m-0 ps-2">
              <a
                href="https://support.google.com/chrome/answer/95647?hl=en"
                target="_blank"
                rel="noreferrer"
              >
                Chrome
              </a>
            </p>
            <p className="m-0 ps-2">
              <a
                href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored"
                target="_blank"
                rel="noreferrer"
              >
                Firefox
              </a>
            </p>
            <p className="m-0 ps-2">
              <a
                href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies"
                target="_blank"
                rel="noreferrer"
              >
                Microsoft Edge
              </a>
            </p>

            <h2 className={headerCss}>Cookie usage</h2>

            <h3 className={topicCss}>Technical Cookies</h3>

            <div className="pb-3">
              <table className="border">
                <thead className="border">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Purpose</th>
                    <th className="p-2">Cookie type and duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2">{cookieAcceptance}</td>
                    <td className="p-2">
                      Stores your cookie preferences (date agreed)
                    </td>
                    <td className="p-2">
                      First party persistent cookie. Expires 2 yrs (or max
                      allowed by browser) from date agreed.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className={topicCss}>Local storage</h3>
            <p className="m-0 ps-2">
              Local storage is used to store the user&apos;s app settings. This
              is nearly permanent storage that enables app functionality when
              offline.
            </p>

            <h3 className={topicCss}>IndexedDB</h3>
            <p className="m-0 ps-2">
              IndexedDB is used to store the user&apos;s app dataset. This is
              nearly permanent storage that enables app functionality when
              offline.
            </p>

            <h3 className={topicCss}>Persistent Storage</h3>
            <p className="m-0 ps-2">
              Persistent Storage is a setting you can enable to prevent the
              browser from deleting data from this application (without being asked) in the event storage quota nears it&apos;s limit.
              Storage can always be cleared with explicit user action.
            </p>
            <p className="m-0 ps-2 pt-2">
              To learn more, see{" "}
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#does_browser-stored_data_persist"
                target="_blank"
                rel="noreferrer"
              >
                Does browser-stored data persist?
              </a>
            </p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export { CookiePolicyMeta };
