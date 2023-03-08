import React from "react";
import PropTypes from "prop-types";
import { XCircleIcon, IssueDraftIcon } from "@primer/octicons-react";
import classNames from "classnames";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * @template {{uid:string, english:string}} RawItem
 * @typedef {Object} SetTermGFListProps
 * @property {RawItem[]} vocabulary
 * @property {string[]} vocabFreq
 * @property {string[]} vocabActive
 * @property {(grp:string)=>function} toggleTermActiveGrp
 * @property {function} removeFrequencyWord
 */

/**
 * @param {boolean} grpActive
 * @param {number} i
 * @param {string} uid
 * @param {string} english
 * @param {function} removeFrequencyWord
 * @returns
 */
function listItem(grpActive, i, uid, english, removeFrequencyWord) {
  return (
    <div
      key={i}
      className={classNames({
        "p-0 px-2": true,
        clickable: grpActive,
      })}
      onClick={() => {
        if (grpActive) {
          removeFrequencyWord(uid);
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
 * Groups + Frequency words list
 * @param {SetTermGFListProps} props
 */
export function SetTermGFList(props) {
  /** @type {string[]} */
  let cleanup = [];

  const thisgrp = props.vocabFreq.reduce(
    (/** @type {RawVocabulary[]} */ acc, f) => {
      const found = props.vocabulary.find((v) => v.uid === f);

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
    (/** @type {{[key:string]:RawVocabulary[]}} */ acc, cur) => {
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
          const grpActive = props.vocabActive.includes(g);

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
                    props.removeFrequencyWord
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
            listItem(true, i, orphanUid, orphanUid, props.removeFrequencyWord)
          )}
        </div>
      )}
    </div>
  );
}

SetTermGFList.propTypes = {
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
  vocabFreq: PropTypes.array,
  vocabulary: PropTypes.array,
  removeFrequencyWord: PropTypes.func,
  toggleTermActiveGrp: PropTypes.func,
};
