import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { buildAction } from "../../helper/eventHandlerHelper";
import { labelOptions } from "../../helper/gameHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import {
  getKanji,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  toggleIncludeNew,
  toggleIncludeReviewed,
  toggleKanjiActiveTag,
  toggleKanjiOrdering,
} from "../../slices/kanjiSlice";
import {
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import { NotReady } from "../Form/NotReady";
import SimpleListMenu from "../Form/SimpleListMenu";
import PlusMinus from "../Input/PlusMinus";
import SettingsSwitch from "../Input/SettingsSwitch";
import { ThresholdFilterSlider } from "../Input/ThresholdFilterSlider";
import { SetTermTagList } from "../Pages/SetTermTagList";

export default function SettingsKanji() {
  const dispatch = useDispatch<AppDispatch>();

  const { vocabList: vocabulary } = useConnectVocabulary();
  const {
    filterType: kanjiFilterREF,
    sortMethod,
    difficultyThreshold,
    activeTags: kanjiActive,
    kanjiList: kanji,
    kanjiTagObj: kanjiTags,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,
  } = useConnectKanji();

  const kanjiFilter = kanjiFilterREF.current;
  const kanjiOrder = sortMethod;

  useEffect(() => {
    if (vocabulary.length === 0) {
      void dispatch(getVocabulary());
    }

    if (Object.keys(kanjiTags).length === 0) {
      void dispatch(getKanji());
    }
    // react-hooks/exhaustive-deps **mount only**
    // eslint-disable-next-line
  }, []);

  if (kanji.length < 1 || Object.keys(kanjiTags).length < 1)
    return <NotReady addlStyle="vocabulary-settings" />;

  const kanjiSelectedTags = Object.values(kanji).filter((k) =>
    k.tags.some((aTag: string) => kanjiActive.includes(aTag))
  );

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <span className="fs-5 fw-light">
            {labelOptions(kanjiFilter, ["Kanji Group", "Tags"])}
          </span>
          {/* <div className="mb-2">
            <SettingsSwitch
              active={kanjiFilter % 2 === 0}
              action={buildAction(dispatch, toggleKanjiFilter)}
              color="default"
              statusText={"Filter by"}
            />
          </div> */}
          <SetTermTagList
            selectedCount={
              kanjiSelectedTags.length === 0
                ? Object.values(kanji).length
                : kanjiSelectedTags.length
            }
            termsTags={kanjiTags}
            termsActive={kanjiActive}
            toggleTermActive={buildAction(dispatch, toggleKanjiActiveTag)}
          />
        </div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Sort by:"}
              options={TermSortByLabel}
              allowed={[
                TermSortBy.DIFFICULTY,
                TermSortBy.RANDOM,
                TermSortBy.VIEW_DATE,
                TermSortBy.RECALL,
              ]}
              initial={kanjiOrder}
              onChange={(index) => {
                return buildAction(dispatch, toggleKanjiOrdering)(index);
              }}
            />
          </div>
          {kanjiOrder === TermSortBy.RECALL && (
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
          {kanjiOrder === TermSortBy.VIEW_DATE && (
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
        </div>
      </div>
    </div>
  );

  return el;
}
