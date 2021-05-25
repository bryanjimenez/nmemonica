import React from "react";
import PropTypes from "prop-types";
import { GroupItem } from "../Form/GroupItem";

/**
 * Group and subgroup list
 */
export function SetVocabGList(props) {
  return (
    <div>
      <h5 key={0}>Groups</h5>

      {Object.keys(props.vocabGroups).map((g, i) => {
        const grpActive = props.vocabActive.includes(g);

        return (
          <div key={i + 1}>
            <GroupItem
              key={i}
              active={props.vocabActive.includes(g)}
              onClick={() => {
                props.toggleVocabularyActiveGrp(g);
              }}
            >
              {g}
            </GroupItem>

            {!grpActive &&
              props.vocabGroups[g].map((s, i) => (
                <GroupItem
                  key={i}
                  addlStyle="ml-3"
                  active={props.vocabActive.includes(g + "." + s)}
                  onClick={() => {
                    props.toggleVocabularyActiveGrp(g + "." + s);
                  }}
                >
                  {s}
                </GroupItem>
              ))}
          </div>
        );
      })}
    </div>
  );
}

SetVocabGList.propTypes = {
  vocabGroups: PropTypes.object,
  vocabActive: PropTypes.array,
  toggleVocabularyActiveGrp: PropTypes.func,
};
