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
              from other users and available only to them.
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
              material. Our app uses Google&apos;s translate service to generate
              audio pronunciations. Aside from the text to be translated and the
              target language no other user information is provided to the
              google translate service.
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
