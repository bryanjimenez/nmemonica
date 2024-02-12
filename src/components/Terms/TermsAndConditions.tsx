import React from "react";

const TermsAndConditionsMeta = {
  location: "/terms/",
  label: "TermsAndConditions",
};

const headerCss = "py-2 pt-4";

export default function TermsAndConditions() {
  return (
    <React.Fragment>
      <div className="terms-and-conditions main-panel h-100">
        <div className="d-flex justify-content-between h-100 px-2">
          <div className="pt-3">
            <h1>Terms and Conditions</h1>

            <p>Definitions</p>
            <ul>
              <li>
                &quot;Contributor&quot;: Individuals that creates or owns
                Covered Software.
              </li>
              <li>
                &quot;Covered Software&quot;: Nmemonica; The website or
                application.
              </li>
              <li>
                &quot;You&quot;: Individual using or executing Covered Software.
              </li>
            </ul>

            <p className="m-0 ps-2">
              The following disclaimers apply to any user (You) who may use
              Nmemonica (Covered Software). Usage of the Covered Software
              implies agreement between the user and the Contributors of the
              Covered Software on the following:
            </p>

            <h2 className={headerCss}>Disclaimer of Warranty</h2>

            <p className="m-0 ps-2">
              Covered Software is provided on an &quot;as is&quot; basis,
              without warranty of any kind, either expressed, implied, or
              statutory, including, without limitation, warranties that the
              Covered Software is free of defects, merchantable, fit for a
              particular purpose or non-infringing. The entire risk as to the
              quality and performance of the Covered Software is with You.
              Should any Covered Software prove defective in any respect, You
              (not any Contributor) assume the cost of any necessary servicing,
              repair, or correction. This disclaimer of warranty constitutes an
              essential part of this License. No use of any Covered Software is
              authorized under this License except under this disclaimer.
            </p>

            <h2 className={headerCss}>Limitation of Liability</h2>

            <p className="m-0 ps-2">
              Under no circumstances and under no legal theory, whether tort
              (including negligence), contract, or otherwise, shall any
              Contributor, or anyone who distributes Covered Software as
              permitted above, be liable to You for any direct, indirect,
              special, incidental, or consequential damages of any character
              including, without limitation, damages for lost profits, loss of
              goodwill, work stoppage, computer failure or malfunction, or any
              and all other commercial damages or losses, even if such party
              shall have been informed of the possibility of such damages. This
              limitation of liability shall not apply to liability for death or
              personal injury resulting from such party&apos;s negligence to the
              extent applicable law prohibits such limitation. Some
              jurisdictions do not allow the exclusion or limitation of
              incidental or consequential damages, so this exclusion and
              limitation may not apply to You.
            </p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export { TermsAndConditionsMeta };
