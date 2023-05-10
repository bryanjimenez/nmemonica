import React from "react";
import { useDispatch } from "react-redux";
import { getStaleGroups, labelOptions } from "../../helper/gameHelper";
import { buildAction } from "../../hooks/helperHK";
import { useSettingsPhraseConnected } from "../../hooks/useConnectSettings";
import {
  getPhrase,
  removeFrequencyPhrase,
  togglePhraseActiveGrp,
  togglePhrasesFilter,
  togglePhrasesOrdering,
  togglePhrasesReinforcement,
  togglePhrasesRomaji,
} from "../../slices/phraseSlice";
import {
  TermFilterBy,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { SetTermGList } from "../Pages/SetTermGList";
import { NotReady } from "./NotReady";
import SettingsSwitch from "./SettingsSwitch";

export default function SettingsPhrase() {
  const dispatch = /** @type {AppDispatch} */ (useDispatch());

  const {
    phrases,
    phraseGroups,
    phraseOrder,
    phraseRomaji,
    phraseReinforce,
    phraseActive,
    phraseFilter,
    phraseRep,
  } = useSettingsPhraseConnected();

  if (phrases.length === 0) {
    dispatch(getPhrase());
  }

  const phraseFreq = Object.keys(phraseRep).filter(
    (k) => phraseRep[k]?.rein === true
  );

  if (phrases.length < 1 || Object.keys(phraseGroups).length < 1)
    return <NotReady addlStyle="phrases-settings" />;

  const stale = getStaleGroups(phraseGroups, phraseActive);
  if (stale.length > 0) {
    // @ts-expect-error Error.cause
    const error = new Error("Stale phrases active group", {
      cause: { code: "StalePhraseActiveGrp", value: stale },
    });
    throw error;
  }

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <h4>
            {labelOptions(phraseFilter, [
              "Phrases Group",
              "Frequency List",
              "NOT_USED_Tags",
            ])}
          </h4>
          <div className="mb-2">
            <SettingsSwitch
              active={phraseFilter % 2 === 0}
              action={buildAction(dispatch, togglePhrasesFilter)}
              color="default"
              statusText={"Filter by"}
            />
          </div>
          {phraseFilter === TermFilterBy.GROUP && (
            <SetTermGList
              termsGroups={phraseGroups}
              termsActive={phraseActive}
              toggleTermActiveGrp={(grp) =>
                dispatch(togglePhraseActiveGrp(grp))
              }
            />
          )}
          {phraseFilter === TermFilterBy.FREQUENCY &&
            phraseFreq.length === 0 && (
              <div className="fst-italic">No phrases have been chosen</div>
            )}
          {phraseFilter === TermFilterBy.FREQUENCY && phraseFreq.length > 0 && (
            <SetTermGFList
              termsActive={phraseActive}
              termsFreq={phraseFreq}
              terms={phrases}
              removeFrequencyTerm={(uid) =>
                dispatch(removeFrequencyPhrase(uid))
              }
              toggleTermActiveGrp={(grp) =>
                dispatch(togglePhraseActiveGrp(grp))
              }
            />
          )}
        </div>
        <div className="column-2">
          <div className="setting-block">
            <div className="mb-2">
              <SettingsSwitch
                active={phraseOrder === TermSortBy.RANDOM}
                action={buildAction(dispatch, togglePhrasesOrdering)}
                color="default"
                statusText={labelOptions(phraseOrder, TermSortByLabel)}
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={phraseReinforce}
                action={buildAction(dispatch, togglePhrasesReinforcement)}
                disabled={phraseFilter === TermFilterBy.FREQUENCY}
                statusText="Reinforcement"
              />
            </div>
            <div className="mb-2">
              <SettingsSwitch
                active={phraseRomaji}
                action={buildAction(dispatch, togglePhrasesRomaji)}
                statusText="Romaji"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
