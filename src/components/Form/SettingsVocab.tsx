import {
  ChevronUpIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useMemo } from "react";
import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import PlusMinus from "./PlusMinus";
import SettingsSwitch from "./SettingsSwitch";
import SimpleListMenu from "./SimpleListMenu";
import { ThresholdFilterSlider } from "./ThresholdFilterSlider";
import VerbFormSlider from "./VerbFormSlider";
import { buildAction } from "../../helper/eventHandlerHelper";
import { getStaleGroups } from "../../helper/gameHelper";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import { logger } from "../../slices/globalSlice";
import {
  DebugLevel,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import {
  vocabularyInitState as VOCABULARY_INIT,
  getVocabulary,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  setVerbFormsOrder,
  toggleAutoVerbView,
  toggleIncludeNew,
  toggleIncludeReviewed,
  toggleVocabularyActiveGrp,
  toggleVocabularyBareKanji,
  toggleVocabularyHint,
  toggleVocabularyOrdering,
  toggleVocabularyRomaji,
  updateVerbColSplit,
} from "../../slices/vocabularySlice";
import { SetTermGList } from "../Pages/SetTermGList";

export default function SettingsVocab() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    vocabList: vocabulary,
    vocabGroups,
    sortMethod,
    romajiEnabled: vocabRomaji,
    bareKanji: showBareKanji,
    hintEnabled: vocabHintRef,
    activeGroup: vocabActive,
    autoVerbView,
    verbColSplit,
    difficultyThreshold,
    spaRepMaxReviewItem,
    verbFormsOrder,
    includeNew,
    includeReviewed,
  } = useConnectVocabulary();

  const vocabOrder = sortMethod;
  const vocabHint = vocabHintRef.current;

  if (Object.keys(vocabGroups).length === 0) {
    void dispatch(getVocabulary());
  }

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
    dispatch(logger(error.message, DebugLevel.ERROR));
    dispatch(logger(JSON.stringify(stale), DebugLevel.ERROR));
  }

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <SetTermGList
            termsGroups={vocabGroups}
            termsActive={vocabActive}
            toggleTermActiveGrp={buildAction(
              dispatch,
              toggleVocabularyActiveGrp
            )}
          />
        </div>

        <div className="column-2 setting-block">
          <SimpleListMenu
            title={"Sort by:"}
            options={TermSortByLabel}
            initial={vocabOrder}
            onChange={(index) => {
              return buildAction(dispatch, toggleVocabularyOrdering)(index);
            }}
          />

          <div className="d-flex justify-content-end">
            <ThresholdFilterSlider
              threshold={difficultyThreshold}
              setThreshold={buildAction(dispatch, setMemorizedThreshold)}
            />
          </div>
          {vocabOrder === TermSortBy.RECALL && (
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
          {vocabOrder === TermSortBy.VIEW_DATE && (
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
                        className={classNames({
                          "d-flex justify-content-between": true,
                          "pt-2": k === shownForms.length - verbColSplit,
                          "pb-2":
                            k === shownForms.length - 1 && verbColSplit === 0,
                        })}
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
                  initial={shownForms.length - verbColSplit}
                  setChoiceN={(slip: number) => {
                    dispatch(updateVerbColSplit(shownForms.length - slip));
                  }}
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
