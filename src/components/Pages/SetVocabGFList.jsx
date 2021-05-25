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
export function SetVocabGFList(props) {
  const thisgrp = props.vocabFreq.map((f) =>
    props.vocabulary.find((v) => v.uid === f)
  );

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
                  props.toggleVocabularyActiveGrp(g);
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
    </div>
  );
}

SetVocabGFList.propTypes = {
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
  vocabFreq: PropTypes.array,
  vocabulary: PropTypes.array,
  removeFrequencyWord: PropTypes.func,
  toggleVocabularyActiveGrp: PropTypes.func,
};
