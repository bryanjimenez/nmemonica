import React from "react";
import PropTypes from "prop-types";
import { XCircleIcon, IssueDraftIcon } from "@primer/octicons-react";
import classNames from "classnames";

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
        "p-0 pl-2 pr-2": true,
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
 */
export function SetTermGFList(props) {
  let cleanup = [];

  const thisgrp = props.vocabFreq.reduce((acc, f) => {
    const found = props.vocabulary.find((v) => v.uid === f);

    if (found) {
      acc = [...acc, found];
    } else {
      cleanup = [...cleanup, f];
    }

    return acc;
  }, []);

  const grplist = thisgrp.reduce((acc, cur) => {
    if (acc[cur.grp]) {
      acc[cur.grp] = [...acc[cur.grp], cur];
    } else {
      acc[cur.grp] = [cur];
    }

    return acc;
  }, {});

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
        <div className="mt-5">
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
