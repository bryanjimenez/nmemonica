import { Suspense, useMemo, useState } from "react";

import { NotReady } from "./NotReady";
import { getStaleSpaceRepKeys } from "../../helper/gameHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { collapseExpandToggler } from "../Pages/Settings";

export default function SettingsStale() {
  const [sectionStaleSpaceRep, setSectionStaleSpaceRep] = useState(false);

  const { vocabList: vocabulary, repetition: vRepetition } =
    useConnectVocabulary();
  const { phraseList: phrases, repetition: pRepetition } = useConnectPhrase();
  const { kanjiList: kanji, repetition: kRepetition } = useConnectKanji();

  const { keys: vKeys, list: vocabuStaleInfo } = useMemo(
    () => getStaleSpaceRepKeys(vRepetition, vocabulary, "[Stale Vocabulary]"),
    [vocabulary, vRepetition]
  );
  const { keys: pKeys, list: phraseStaleInfo } = useMemo(
    () => getStaleSpaceRepKeys(pRepetition, phrases, "[Stale Phrase]"),
    [phrases, pRepetition]
  );
  const { keys: kKeys, list: kanjiStaleInfo } = useMemo(
    () => getStaleSpaceRepKeys(kRepetition, kanji, "[Stale Kanji]"),
    [kanji, kRepetition]
  );

  const staleSpaceRepKeys = useMemo(
    () => new Set([...vKeys, ...pKeys, ...kKeys]),
    [vKeys, pKeys, kKeys]
  );

  const staleSpaceRepTerms = useMemo(
    () =>
      staleSpaceRep([
        ...vocabuStaleInfo,
        ...phraseStaleInfo,
        ...kanjiStaleInfo,
      ]),
    [vocabuStaleInfo, phraseStaleInfo, kanjiStaleInfo]
  );

  const el = (
    <>
      <div className="mb-2">
        <div className="d-flex justify-content-between">
          <h5>Stale Space Repetition</h5>
          {collapseExpandToggler(sectionStaleSpaceRep, setSectionStaleSpaceRep)}
        </div>
        <div className="px-4">
          <span>
            {"keys: " + JSON.stringify(Array.from(staleSpaceRepKeys))}
          </span>
        </div>
        {sectionStaleSpaceRep && (
          <Suspense fallback={<NotReady addlStyle="failed-spacerep-view" />}>
            <div className="failed-spacerep-view container mt-2 p-0">
              {staleSpaceRepTerms}
            </div>
          </Suspense>
        )}
      </div>
    </>
  );

  return el;
}

/**
 * Build JSX element listing stale items
 */
function staleSpaceRep(terms: { key: string; uid: string; english: string }[]) {
  return terms.reduce<React.JSX.Element[]>((a, text, i) => {
    const separator = <hr key={`stale-meta-${text.uid}`} />;

    const row = (
      <div key={text.uid} className="row">
        <span className="col p-0">{text.key}</span>
        <span className="col p-0">{text.english}</span>
        <span className="col p-0 app-sm-fs-xx-small">
          <div>{text.uid}</div>
        </span>
      </div>
    );

    return a.length > 0 && i < terms.length
      ? [...a, separator, row]
      : [...a, row];
  }, []);
}
