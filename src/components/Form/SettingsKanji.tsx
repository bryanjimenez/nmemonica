import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import SettingsSwitch from "./SettingsSwitch";
import { buildAction } from "../../helper/eventHandlerHelper";
import { labelOptions } from "../../helper/gameHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import {
  getKanji,
  removeFrequencyKanji,
  toggleKanjiActiveGrp,
  toggleKanjiActiveTag,
  toggleKanjiFilter,
  toggleKanjiReinforcement,
} from "../../slices/kanjiSlice";
import { TermFilterBy } from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import { SetTermGFList } from "../Pages/SetTermGFList";
import { SetTermTagList } from "../Pages/SetTermTagList";

export default function SettingsKanji() {
  const dispatch = useDispatch<AppDispatch>();

  const { vocabList: vocabulary } = useConnectVocabulary();
  const {
    filterType: kanjiFilterRef,
    reinforce: kanjiReinforce,
    activeTags: kanjiActive,
    kanjiList: kanji,
    repetition: kRepetition,
    kanjiTagObj: kanjiTags,
  } = useConnectKanji();

  const kanjiFilter = kanjiFilterRef.current;

  if (vocabulary.length === 0) {
    void dispatch(getVocabulary());
  }

  if (Object.keys(kanjiTags).length === 0) {
    void dispatch(getKanji());
  }

  if (kanji.length < 1 || Object.keys(kanjiTags).length < 1)
    return <NotReady addlStyle="vocabulary-settings" />;

  const kanjiSelectedTags = Object.values(kanji).filter((k) =>
    k.tag?.some((aTag: string) => kanjiActive.includes(aTag))
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
          <h4>
            {labelOptions(kanjiFilter, [
              "Kanji Group",
              "Frequency List",
              "Tags",
            ])}
          </h4>
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
            <SettingsSwitch
              active={kanjiReinforce.current}
              action={buildAction(dispatch, toggleKanjiReinforcement)}
              disabled={kanjiFilter === TermFilterBy.FREQUENCY}
              statusText={
                (kanjiReinforce ? `(+${kFreqExcluTagSelected.length} ) ` : "") +
                "Reinforcement"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
