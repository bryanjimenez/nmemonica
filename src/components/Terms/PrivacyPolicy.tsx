import { Link } from "react-router-dom";

import { CookiePolicyMeta } from "./CookiePolicy";

const githubProject = "https://github.com/bryanjimenez/nmemonica";
const githubPolicyHistory =
  "https://github.com/bryanjimenez/nmemonica/commits/main/src/components/Terms/PrivacyPolicy.tsx";
const githubReadMe =
  "https://github.com/bryanjimenez/nmemonica/blob/main/README.md";

const PrivacyPolicyMeta = {
  location: "/privacy/",
  label: "PrivacyPolicy",
};

const headerCss = "py-2 pt-4";

export default function PrivacyPolicy() {
  return (
    <>
      <div className="privacy-policy main-panel h-100">
        <div className="d-flex justify-content-between h-100 px-2">
          <div className="py-3">
            <h1>Privacy Policy</h1>

            <h2 className={headerCss}>Type of information collected</h2>
            <p className="m-0 ps-2">
              We do not collect personal information. However, when you use our
              website or app the user is encouraged to enter free form
              information (&quot;user generated content&quot;, &quot;UGC&quot;,
              or &quot;user created study material&quot;). This UGC is not
              publicly available. Each user&apos;s study material is private
              from other users and available only to them unless explicitly
              shared.
            </p>

            <h2 className={headerCss}>Method of information collection</h2>
            <p className="m-0 ps-2">
              We do not collect personal information. However, a basic function
              of the application is to allow the user to add study material
              (UGC) with the purpose of using it in study sessions. This UGC can
              be entered in the application (via the &quot;Edit&quot; data
              sheets page). You are responsible for the UGC entered into the
              application.
            </p>

            <h2 className={headerCss}>Personal information handling</h2>
            <p className="m-0 ps-2">
              We do not collect personal information. The user generated
              content&apos;s purpose is self consumption in the form of study
              material.
            </p>

            <h2 className={headerCss}>Sharing user generated content</h2>
            <p className="m-0 ps-2">
              The application enables users to share their UGC with other users.
              This can be done by importing and exporting the UGC as files to
              and from their device or through the in-App &quot;Sync&quot;
              service (in the &quot;Edit&quot; data sheets page). The
              &quot;Sync&quot; sharing service is not a third party service. End
              to end encryption is used when a sharing transaction happens
              between two users. The service is a data relay between two users
              and no data nor any user identifying information is kept on the
              service any longer than the sharing transaction between the two
              users. Any user can share their UGC by providing a one-time share
              id and an encryption key to the receiving user. The available
              items that can be shared are the user`&apos;s Datasets and their
              App`&apos;s user settings. Datasets are shared as a whole, partial
              Dataset sharing is not possible via the Sync service. User
              settings contain metadata including individual term view counts,
              frequency, and other time related information. You are responsible
              for the UGC entered into the application and with whom you share
              it with.
            </p>

            <h2 className={headerCss}>Cookies</h2>
            <p className="m-0 ps-2">
              Please refer to our{" "}
              <Link to={CookiePolicyMeta.location}>Cookie Policy</Link>.
            </p>
            <h2 className={headerCss}>Opting out</h2>
            <p className="m-0 ps-2">
              We hope this application is useful to you. However, at any time
              you can withdraw your consent and delete the application to clear
              all application data.
            </p>

            <h2 className={headerCss}>Privacy Policy updates</h2>
            <p className="m-0 ps-2">
              The latest Privacy Policy will be accessible here. Previous
              versions will be archived on the{" "}
              <Link to={githubPolicyHistory} target="_blank" rel="noreferer">
                Github
              </Link>{" "}
              repository.
            </p>
            <h2 className={headerCss}>Questions?</h2>
            <p className="m-0 ps-2">
              Questions on how our app works? See our project&apos;s{" "}
              <Link to={githubReadMe} target="_blank" rel="noreferer">
                README
              </Link>{" "}
              Page.
            </p>
            <p className="m-0 ps-2">
              For now you can contact us via{" "}
              <Link to={githubProject} target="_blank" rel="noreferer">
                Github
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export { PrivacyPolicyMeta };
