import { Slider } from "@mui/material";
import {
  ChevronUpIcon,
  PlusCircleIcon,
  SortAscIcon,
  SortDescIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import SettingsSwitch from "./SettingsSwitch";
import SimpleListMenu from "./SimpleListMenu";
import VerbFormSlider from "./VerbFormSlider";
import { buildAction } from "../../helper/eventHandlerHelper";
import { getStaleGroups } from "../../helper/gameHelper";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import {
  TermFilterBy,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import {
  vocabularyInitState as VOCABULARY_INIT,
  getVocabulary,
  removeFrequencyWord,
  setMemorizedThreshold,
  setVerbFormsOrder,
  toggleAutoVerbView,
  toggleVocabularyActiveGrp,
  toggleVocabularyBareKanji,
  toggleVocabularyFilter,
  toggleVocabularyHint,
  toggleVocabularyOrdering,
  toggleVocabularyReinforcement,
  toggleVocabularyRomaji,
  updateVerbColSplit,
} from "../../slices/vocabularySlice";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { SetTermGList } from "../Pages/SetTermGList";

export default function SettingsVocab() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    vocabList: vocabulary,
    vocabGroups,
    sortMethod: vocabOrderRef,
    romajiEnabled: vocabRomaji,
    bareKanji: showBareKanji,
    hintEnabled: vocabHintRef,
    activeGroup: vocabActive,
    autoVerbView,
    verbColSplit,
    filterType: vocabFilterRef,
    memoThreshold: memoThresholdRef,
    repetition: vocabRep,
    reinforce: vocabReinforceRef,
    verbFormsOrder,
  } = useConnectVocabulary();

  const vocabFilter = vocabFilterRef.current;
  const memoThreshold = memoThresholdRef.current;
  const vocabOrder = vocabOrderRef.current;
  const vocabReinforce = vocabReinforceRef.current;
  const vocabHint = vocabHintRef.current;

  const [initialMemoThreshold] = useState(Math.abs(memoThreshold));

  if (Object.keys(vocabGroups).length === 0) {
    void dispatch(getVocabulary());
  }

  const vocabFreq = useMemo(
    () => Object.keys(vocabRep).filter((k) => vocabRep[k]?.rein === true),
    [vocabRep]
  );

  const [shownForms, hiddenForms] = useMemo(() => {
    const allForms = VOCABULARY_INIT.setting.verbFormsOrder;
    const shown = verbFormsOrder.reduce<string[]>((acc, form) => {
      if (allForms.includes(form)) {
        acc = [...acc, form];
      }

      return acc;
    }, []);

    const hidden = allForms.reduce<string[]>((acc, form) => {
      if (!shown.includes(form)) {
        acc = [...acc, form];
      }

      return acc;
    }, []);

    return [shown, hidden];
  }, [verbFormsOrder]);

  if (vocabulary.length < 1 || Object.keys(vocabGroups).length < 1)
    return <NotReady addlStyle="vocabulary-settings" />;

  const stale = getStaleGroups(vocabGroups, vocabActive);
  if (stale.length > 0) {
    const error = new Error("Stale vocabulary active group", {
      cause: { code: "StaleVocabActiveGrp", value: stale },
    });
    throw error;
  }

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <SimpleListMenu
            flip={true}
            title={"Filter by:"}
            options={[
              "Word Group",
              "Frequency List",
              // "NOT_USED_Tags",
            ]}
            initial={vocabFilter}
            onChange={buildAction(dispatch, toggleVocabularyFilter)}
          />
          {vocabFilter === TermFilterBy.GROUP && (
            <SetTermGList
              termsGroups={vocabGroups}
              termsActive={vocabActive}
              toggleTermActiveGrp={buildAction(
                dispatch,
                toggleVocabularyActiveGrp
              )}
            />
          )}
          {vocabFilter === TermFilterBy.FREQUENCY && vocabFreq.length === 0 && (
            <div className="fst-italic">No words have been chosen</div>
          )}
          {vocabFilter === TermFilterBy.FREQUENCY && vocabFreq.length > 0 && (
            <SetTermGFList
              termsActive={vocabActive}
              termsFreq={vocabFreq}
              terms={vocabulary}
              removeFrequencyTerm={buildAction(dispatch, removeFrequencyWord)}
              toggleTermActiveGrp={buildAction(
                dispatch,
                toggleVocabularyActiveGrp
              )}
            />
          )}
        </div>

        <div className="column-2 setting-block">
          <SimpleListMenu
            title={"Sort by:"}
            options={TermSortByLabel}
            initial={vocabOrder}
            onChange={buildAction(dispatch, toggleVocabularyOrdering)}
          />

          {vocabOrder === TermSortBy.DIFFICULTY && (
            <div className="d-flex justify-content-end">
              <Slider
                defaultValue={initialMemoThreshold}
                track={memoThreshold < 0 ? "inverted" : undefined}
                onChangeCommitted={(e, newValue) => {
                  const sign = memoThreshold < 0 ? -1 : 1;
                  if (typeof newValue === "number") {
                    dispatch(setMemorizedThreshold(sign * newValue));
                  }
                }}
                valueLabelDisplay="auto"
              />

              <div
                className="mt-2 ms-3 "
                onClick={buildAction(
                  dispatch,
                  setMemorizedThreshold,
                  -1 * memoThreshold
                )}
              >
                {memoThreshold < 0 ? <SortDescIcon /> : <SortAscIcon />}
              </div>
            </div>
          )}

          <div className="mb-2">
            <SettingsSwitch
              active={vocabReinforce}
              action={buildAction(dispatch, toggleVocabularyReinforcement)}
              disabled={vocabFilter === TermFilterBy.FREQUENCY}
              statusText="Reinforcement"
            />
          </div>
          <div className="mb-2">
            <SettingsSwitch
              active={vocabRomaji}
              action={buildAction(dispatch, toggleVocabularyRomaji)}
              statusText="Romaji"
            />
          </div>
          <div className="mb-2">
            <SettingsSwitch
              active={showBareKanji}
              action={buildAction(dispatch, toggleVocabularyBareKanji)}
              statusText="English+Kanji"
            />
          </div>
          <div className="mb-2">
            <SettingsSwitch
              active={vocabHint}
              action={buildAction(dispatch, toggleVocabularyHint)}
              statusText="Hint"
            />
          </div>
          <div className="mb-2">
            <SettingsSwitch
              active={autoVerbView}
              action={buildAction(dispatch, toggleAutoVerbView)}
              statusText="Auto Verb View"
            />
          </div>
          {autoVerbView && (
            <div className="mb-2">
              <div className="d-flex flex-row justify-content-end">
                <div>
                  {[
                    shownForms.map((form, k) => (
                      <div
                        key={form}
                        className="d-flex justify-content-between"
                      >
                        <div
                          className={classNames({
                            "me-3": true,
                            "disabled-color": k === 0,
                          })}
                          onClick={() => {
                            if (k > 0) {
                              const a = shownForms.slice(0, k - 1);
                              const b = shownForms[k - 1];
                              const x = shownForms[k];
                              const c = shownForms.slice(k + 1);

                              dispatch(setVerbFormsOrder([...a, x, b, ...c]));
                            }
                          }}
                        >
                          <ChevronUpIcon
                            className="mt-1"
                            size="small"
                            aria-label="move up"
                          />
                        </div>
                        <span className="w-100 text-start">{form}</span>

                        <div
                          onClick={() => {
                            if (shownForms.length > 1) {
                              const minusK = [
                                ...shownForms.slice(0, k),
                                ...shownForms.slice(k + 1),
                              ];

                              dispatch(setVerbFormsOrder(minusK));
                            }
                          }}
                        >
                          <XCircleIcon
                            className={classNames({
                              "mt-1 ms-3": true,
                              "incorrect-color": shownForms.length > 1,
                              "disabled-color": shownForms.length === 1,
                            })}
                            size="small"
                            aria-label="remove"
                          />
                        </div>
                      </div>
                    )),
                    hiddenForms.map((form, k) => (
                      <div
                        key={form}
                        className="d-flex justify-content-between"
                      >
                        <div className="me-3 invisible">
                          <ChevronUpIcon
                            className="mt-1"
                            size="small"
                            aria-label="move up"
                          />
                        </div>
                        <span className="w-100 text-start disabled-color">
                          {form}
                        </span>
                        <div
                          onClick={buildAction(dispatch, setVerbFormsOrder, [
                            ...shownForms,
                            hiddenForms[k],
                          ])}
                        >
                          <PlusCircleIcon
                            className="mt-1 ms-3"
                            size="small"
                            aria-label="add"
                          />
                        </div>
                      </div>
                    )),
                  ]}
                </div>
              </div>
            </div>
          )}
          {autoVerbView && (
            <div>
              <div className="d-flex justify-content-end p-2">
                <VerbFormSlider
                  initial={verbColSplit}
                  setChoiceN={buildAction(dispatch, updateVerbColSplit)}
                  max={verbFormsOrder.length}
                  statusText="Column layout"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return el;
}
