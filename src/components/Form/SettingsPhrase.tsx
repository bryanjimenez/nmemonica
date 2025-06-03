import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import PlusMinus from "./PlusMinus";
import SettingsSwitch from "./SettingsSwitch";
import SimpleListMenu from "./SimpleListMenu";
import { ThresholdFilterSlider } from "./ThresholdFilterSlider";
import { DebugLevel } from "../../helper/consoleHelper";
import { buildAction } from "../../helper/eventHandlerHelper";
import { getStaleGroups } from "../../helper/gameHelper";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import type { AppDispatch } from "../../slices";
import { logger } from "../../slices/globalSlice";
import {
  getPhrase,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  toggleIncludeNew,
  toggleIncludeReviewed,
  togglePhraseActiveGrp,
  togglePhrasesOrdering,
  togglePhrasesRomaji,
} from "../../slices/phraseSlice";
import { TermSortBy, TermSortByLabel } from "../../slices/settingHelper";
import { SetTermGList } from "../Pages/SetTermGList";

export default function SettingsPhrase() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    phraseList: phrases,
    phraseGroups,
    sortMethod: phraseOrder,
    romajiActive: phraseRomajiRef,
    difficultyThreshold,
    activeGroup: phraseActive,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,
  } = useConnectPhrase();

  const phraseRomaji = phraseRomajiRef.current;

  if (phrases.length === 0) {
    void dispatch(getPhrase());
  }

  if (phrases.length < 1 || Object.keys(phraseGroups).length < 1)
    return <NotReady addlStyle="phrases-settings" />;

  const stale = getStaleGroups(phraseGroups, phraseActive);
  if (stale.length > 0) {
    const error = new Error("Stale phrases active group", {
      cause: { code: "StalePhraseActiveGrp", value: stale },
    });
    dispatch(logger(error.message, DebugLevel.ERROR));
    dispatch(logger(JSON.stringify(stale), DebugLevel.ERROR));
  }

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <SetTermGList
            termsGroups={phraseGroups}
            termsActive={phraseActive}
            toggleTermActiveGrp={(grp) => dispatch(togglePhraseActiveGrp(grp))}
          />
        </div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Sort by:"}
              options={TermSortByLabel}
              initial={phraseOrder}
              allowed={[
                TermSortBy.DIFFICULTY,
                TermSortBy.RANDOM,
                TermSortBy.VIEW_DATE,
                TermSortBy.RECALL,
              ]}
              onChange={(index) => {
                return buildAction(dispatch, togglePhrasesOrdering)(index);
              }}
            />
          </div>
          {phraseOrder === TermSortBy.RECALL && (
            <div className="mb-2">
              <PlusMinus
                value={spaRepMaxReviewItem}
                onChange={(value) => {
                  dispatch(setSpaRepMaxItemReview(value));
                }}
              >
                <div className="text-nowrap">Max review items</div>
                <div className="text-center">
                  <span
                    className="clickable"
                    onClick={() => {
                      dispatch(setSpaRepMaxItemReview(0));
                    }}
                  >
                    <b>m</b>in
                  </span>{" "}
                  -{" "}
                  <span
                    className="clickable"
                    onClick={() => {
                      dispatch(setSpaRepMaxItemReview(undefined));
                    }}
                  >
                    <b>M</b>ax
                  </span>
                </div>
              </PlusMinus>
            </div>
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
