import React from "react";
import PropTypes from "prop-types";
import { XCircleIcon, IssueDraftIcon } from "@primer/octicons-react";
import classNames from "classnames";

/**
 * @typedef {{uid:string, english:string, grp?:string}} MinimunRawItem
 */

/**
 * @template {MinimunRawItem} RawItemType
 * @typedef {Object} SetTermGFListProps
 * @property {RawItemType[]} terms
 * @property {string[]} termsFreq List of uid of terms to be reinforced/frequency
 * @property {string[]} termsActive List of tags that are selected
 * @property {(grp:string)=>function} toggleTermActiveGrp
 * @property {function} removeFrequencyTerm
 */

/**
 * @param {boolean} grpActive
 * @param {number} i
 * @param {string} uid
 * @param {string} english
 * @param {function} removeFrequencyTerm
 */
function listItem(grpActive, i, uid, english, removeFrequencyTerm) {
  return (
    <div
      key={i}
      className={classNames({
        "p-0 px-2": true,
        clickable: grpActive,
      })}
      onClick={() => {
        if (grpActive) {
          removeFrequencyTerm(uid);
        }
      }}
    >
      <span className="p-1">
        {grpActive && (
          <XCircleIcon
            className="incorrect-color"
            size="small"
            aria-label="remove"
          />
        )}
        {!grpActive && (
          <IssueDraftIcon
            // className="incorrect-color"
            size="small"
            aria-label="inactive"
          />
        )}
      </span>
      <span className="p-1">{english}</span>
    </div>
  );
}

/**
 * Groups + Frequency term list
 * @param {SetTermGFListProps<MinimunRawItem>} props
 */
export function SetTermGFList(props) {
  /** @type {string[]} */
  let cleanup = [];

  const thisgrp = props.termsFreq.reduce(
    (/** @type {MinimunRawItem[]} */ acc, f) => {
      const found = props.terms.find((v) => v.uid === f);

      if (found) {
        acc = [...acc, found];
      } else {
        cleanup = [...cleanup, f];
      }

      return acc;
    },
    []
  );

  const grplist = thisgrp.reduce(
    (/** @type {{[key:string]:MinimunRawItem[]}} */ acc, cur) => {
      const key = cur.grp ? cur.grp : "undefined";

      if (acc[key]) {
        acc[key] = [...acc[key], cur];
      } else {
        acc[key] = [cur];
      }

      return acc;
    },
    {}
  );

  return (
    <div>
      <h5 key={0}>Frequency</h5>
      <div key={1}>
        {Object.keys(grplist).map((g, ig) => {
          const grpActive = props.termsActive.includes(g);

          return (
            <div key={ig} className="mb-2">
              <span
                className={classNames({ "font-weight-bold": grpActive })}
                onClick={() => {
                  props.toggleTermActiveGrp(g);
                }}
              >
                {g}
              </span>
              <div>
                {grplist[g].map((word, iw) =>
                  listItem(
                    grpActive,
                    iw,
                    word.uid,
                    word.english,
                    props.removeFrequencyTerm
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      {cleanup.length > 0 && (
        <div className="mt-5 text-break">
          <span className="font-weight-bold">Manual cleanup</span>
          {cleanup.map((orphanUid, i) =>
            listItem(true, i, orphanUid, orphanUid, props.removeFrequencyTerm)
          )}
        </div>
      )}
    </div>
  );
}

SetTermGFList.propTypes = {
  termsActive: PropTypes.array,
  termsFreq: PropTypes.array,
  terms: PropTypes.array,
  removeFrequencyTerm: PropTypes.func,
  toggleTermActiveGrp: PropTypes.func,
};
