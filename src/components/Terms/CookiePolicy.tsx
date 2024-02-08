import React from "react";

import { cookieAcceptance } from "../../helper/cookieHelper";

const CookiePolicyMeta = {
  location: "/cookies/",
  label: "CookiePolicy",
};

export default function CookiePolicy() {
  return (
    <React.Fragment>
      <div className="cookie-policy main-panel h-100">
        <div className="d-flex justify-content-between h-100 px-2">
          <div className="pt-3">
            <h1>Cookie Policy</h1>

            <h2 className="py-2">What are cookies?</h2>
            <p>
              A cookie (and cookie technologies for example: browser cookies,
              local storage, and IndexedDB storage) is a file that is stored on
              your device that contains information which identifies you to a
              website. Websites use cookies to personalize your web experience
              based on your preferences and also for personalized ads.
            </p>
            <h2 className="py-2">How do we use cookies?</h2>
            <p>
              This application does not collect personal information, analyze
              user browsing behavior, display targeted ads, nor does it share
              any of your data with third parties.
            </p>
            <p>This application uses cookie technologies to:</p>
            <ul>
              <li>Identify you as a user.</li>
              <li>Store user app data (language datasets).</li>
              <li>Store user app media (language pronunciations).</li>
              <li>
                Enable offline app use by utilizing stored data and media.
              </li>
            </ul>
            <h2 className="py-2">Opting out of cookies</h2>
            <p>
              Please note that blocking cookies will impact the functionality of
              the application and only minimal features will remain.
            </p>
            <p>Instructions on deleting cookies for commonly used browsers:</p>
            <p>
              <a
                href="https://support.google.com/chrome/answer/95647?hl=en"
                target="_blank"
                rel="noreferrer"
              >
                Chrome
              </a>
            </p>
            <p>
              <a
                href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored"
                target="_blank"
                rel="noreferrer"
              >
                Firefox
              </a>
            </p>
            <p>
              <a
                href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies"
                target="_blank"
                rel="noreferrer"
              >
                Microsoft Edge
              </a>
            </p>

            <h2 className="py-2">Cookie usage</h2>

            <h3 className="py-2">Technical Cookies</h3>

            <div className="pb-5">
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

            <h3 className="py-2">Local storage</h3>
            <p>
              Local storage is used to store the user&apos;s app settings. This
              is nearly permanent storage that enables app functionality when
              offline.
            </p>

            <h3 className="py-2">IndexedDB</h3>
            <p>
              IndexedDB is used to store the user&apos;s app data set. This is
              nearly permanent storage that enables app functionality when
              offline.
            </p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export { CookiePolicyMeta };
