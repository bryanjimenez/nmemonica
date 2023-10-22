import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import PlusMinus from "./PlusMinus";
import SettingsSwitch from "./SettingsSwitch";
import SimpleListMenu from "./SimpleListMenu";
import { ThresholdFilterSlider } from "./ThresholdFilterSlider";
import { buildAction } from "../../helper/eventHandlerHelper";
import { getStaleGroups, labelOptions } from "../../helper/gameHelper";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import type { AppDispatch } from "../../slices";
import {
  getPhrase,
  removeFrequencyPhrase,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  toggleIncludeNew,
  toggleIncludeReviewed,
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

export default function SettingsPhrase() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    phraseList: phrases,
    phraseGroups,
    sortMethod: phraseOrderRef,
    romajiActive: phraseRomajiRef,
    difficultyThreshold,
    activeGroup: phraseActive,
    filterType: phraseFilterRef,
    repetition: phraseRep,
    reinforce: phraseReinforceRef,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,
  } = useConnectPhrase();

  const phraseFilter = phraseFilterRef.current;
  const phraseOrder = phraseOrderRef.current;
  const phraseRomaji = phraseRomajiRef.current;
  const phraseReinforce = phraseReinforceRef.current;

  if (phrases.length === 0) {
    void dispatch(getPhrase());
  }

  const phraseFreq = Object.keys(phraseRep).filter(
    (k) => phraseRep[k]?.rein === true
  );

  if (phrases.length < 1 || Object.keys(phraseGroups).length < 1)
    return <NotReady addlStyle="phrases-settings" />;

  const stale = getStaleGroups(phraseGroups, phraseActive);
  if (stale.length > 0) {
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
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Sort by:"}
              options={TermSortByLabel}
              initial={phraseOrder}
              allowed={[
                TermSortBy.RANDOM,
                TermSortBy.VIEW_DATE,
                TermSortBy.RECALL,
              ]}
              onChange={(index) => {
                if (TermSortBy.RECALL === index) {
                  dispatch(togglePhrasesReinforcement(false));
                }
                return buildAction(dispatch, togglePhrasesOrdering)(index);
              }}
            />
          </div>
          {phraseOrder === TermSortBy.RECALL && (
            <PlusMinus
              label="Max review items "
              value={spaRepMaxReviewItem}
              onChange={(value: number) => {
                dispatch(setSpaRepMaxItemReview(value));
              }}
            />
          )}
          <div className="d-flex justify-content-end">
            <ThresholdFilterSlider
              threshold={difficultyThreshold}
              setThreshold={buildAction(dispatch, setMemorizedThreshold)}
            />
          </div>
          {phraseOrder === TermSortBy.VIEW_DATE && (
            <>
              <div className="mb-2">
                <SettingsSwitch
                  active={includeNew}
                  action={buildAction(dispatch, toggleIncludeNew)}
                  statusText="Staleness +New"
                />
              </div>
              <div className="mb-2">
                <SettingsSwitch
                  active={includeReviewed}
                  action={buildAction(dispatch, toggleIncludeReviewed)}
                  statusText="Staleness +Reviewed"
                />
              </div>
            </>
          )}
          <div className="mb-2">
            <SettingsSwitch
              active={phraseReinforce}
              action={buildAction(dispatch, togglePhrasesReinforcement)}
              disabled={
                phraseFilter === TermFilterBy.FREQUENCY ||
                phraseOrder === TermSortBy.RECALL
              }
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
  );

  return el;
}
