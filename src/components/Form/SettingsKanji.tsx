import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import PlusMinus from "./PlusMinus";
import SettingsSwitch from "./SettingsSwitch";
import SimpleListMenu from "./SimpleListMenu";
import { ThresholdFilterSlider } from "./ThresholdFilterSlider";
import { buildAction } from "../../helper/eventHandlerHelper";
import { labelOptions } from "../../helper/gameHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import {
  getKanji,
  removeFrequencyKanji,
  setMemorizedThreshold,
  setSpaRepMaxItemReview,
  toggleIncludeNew,
  toggleIncludeReviewed,
  toggleKanjiActiveGrp,
  toggleKanjiActiveTag,
  toggleKanjiFilter,
  toggleKanjiOrdering,
  toggleKanjiReinforcement,
} from "../../slices/kanjiSlice";
import {
  TermFilterBy,
  TermSortBy,
  TermSortByLabel,
} from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { SetTermTagList } from "../Pages/SetTermTagList";

export default function SettingsKanji() {
  const dispatch = useDispatch<AppDispatch>();

  const { vocabList: vocabulary } = useConnectVocabulary();
  const {
    filterType: kanjiFilterREF,
    orderType: kanjiOrderREF,
    difficultyThreshold,
    reinforce: kanjiReinforce,
    activeTags: kanjiActive,
    kanjiList: kanji,
    repetition: kRepetition,
    kanjiTagObj: kanjiTags,
    spaRepMaxReviewItem,
    includeNew,
    includeReviewed,
  } = useConnectKanji();

  const kanjiFilter = kanjiFilterREF.current;
  const kanjiOrder = kanjiOrderREF.current;

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
  const kanjiSelectedUids = kanjiSelectedTags.map((k) => k.uid);

  const kanjiFreq = Object.keys(kRepetition).filter(
    (k) => kRepetition[k]?.rein === true
  );

  // kanjis in frequency list, but outside of current tag selection
  const kFreqExcluTagSelected = kanjiFreq.filter(
    (k) => !kanjiSelectedUids.includes(k)
  );

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <span className="fs-5 fw-light">
            {labelOptions(kanjiFilter, [
              "Kanji Group",
              "Frequency List",
              "Tags",
            ])}
          </span>
          <div className="mb-2">
            <SettingsSwitch
              active={kanjiFilter % 2 === 0}
              action={buildAction(dispatch, toggleKanjiFilter)}
              color="default"
              statusText={"Filter by"}
            />
          </div>
          {kanjiFilter === TermFilterBy.FREQUENCY && kanjiFreq.length === 0 && (
            <div className="fst-italic">No words have been chosen</div>
          )}
          {kanjiFilter === TermFilterBy.TAGS && (
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
          )}
          {kanjiFilter === TermFilterBy.FREQUENCY && kanjiFreq.length > 0 && (
            <SetTermGFList
              termsActive={kanjiActive}
              termsFreq={kanjiFreq}
              terms={kanji}
              removeFrequencyTerm={buildAction(dispatch, removeFrequencyKanji)}
              toggleTermActiveGrp={buildAction(dispatch, toggleKanjiActiveGrp)}
            />
          )}
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
                if (TermSortBy.RECALL === index) {
                  dispatch(toggleKanjiReinforcement(false));
                }
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
          <div className="mb-2">
            <SettingsSwitch
              active={kanjiReinforce.current}
              action={buildAction(dispatch, toggleKanjiReinforcement)}
              disabled={
                kanjiFilter === TermFilterBy.FREQUENCY ||
                kanjiOrder === TermSortBy.RECALL
              }
              statusText={
                (kanjiReinforce.current
                  ? `(+${kFreqExcluTagSelected.length} ) `
                  : "") + "Reinforcement"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
