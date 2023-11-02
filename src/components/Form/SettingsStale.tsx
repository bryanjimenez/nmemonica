import { TrashIcon } from "@primer/octicons-react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import { getStaleSpaceRepKeys } from "../../helper/gameHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { type AppDispatch } from "../../slices";
import { deleteMetaKanji } from "../../slices/kanjiSlice";
import { deleteMetaPhrase } from "../../slices/phraseSlice";
import { deleteMetaVocab } from "../../slices/vocabularySlice";
import { collapseExpandToggler } from "../Pages/Settings";

export default function SettingsStale() {
  const dispatch = useDispatch<AppDispatch>();

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

  // Stale uids still in repetition table
  const oldUidKanji = useMemo(
    () =>
      kanjiStaleInfo.reduce<string[]>(
        (acc, t) => (t.key === "uid" ? [...acc, t.uid] : acc),
        []
      ),
    [kanjiStaleInfo]
  );

  const oldUidPhrase = useMemo(
    () =>
      phraseStaleInfo.reduce<string[]>(
        (acc, t) => (t.key === "uid" ? [...acc, t.uid] : acc),
        []
      ),
    [phraseStaleInfo]
  );

  const oldUidVocab = useMemo(
    () =>
      vocabuStaleInfo.reduce<string[]>(
        (acc, t) => (t.key === "uid" ? [...acc, t.uid] : acc),
        []
      ),
    [vocabuStaleInfo]
  );

  const phraseDelMetaCB = useCallback(() => {
    if (oldUidPhrase.length > 0) {
      void dispatch(deleteMetaPhrase(oldUidPhrase));
    }
  }, [dispatch, oldUidPhrase]);

  const vocabDelMetaCB = useCallback(() => {
    if (oldUidVocab.length > 0) {
      void dispatch(deleteMetaVocab(oldUidVocab));
    }
  }, [dispatch, oldUidVocab]);

  const kanjiDelMetaCB = useCallback(() => {
    if (oldUidKanji.length > 0) {
      void dispatch(deleteMetaKanji(oldUidKanji));
    }
  }, [dispatch, oldUidKanji]);

  const el = (
    <>
      {(oldUidPhrase.length > 0 ||
        oldUidVocab.length > 0 ||
        oldUidKanji.length > 0) && (
        <div className="mb-4">
          <h5>Stale Metadata UID</h5>
          <div className="d-flex flex-row justify-content-between">
            <div className="column-1"></div>
            <div className="column-2">
              <div className="setting-block">
                {oldUidPhrase.length > 0 && (
                  <div className="d-flex flex-row justify-content-between">
                    <span>Phrase: {oldUidPhrase.length}</span>
                    <div className="ps-4" onClick={phraseDelMetaCB}>
                      <TrashIcon
                        className="clickable"
                        size="small"
                        aria-label="delete"
                      />
                    </div>
                  </div>
                )}
                {oldUidVocab.length > 0 && (
                  <div className="d-flex flex-row justify-content-between">
                    <span>Vocabulary: {oldUidVocab.length}</span>
                    <div className="ps-4" onClick={vocabDelMetaCB}>
                      <TrashIcon
                        className="clickable"
                        size="small"
                        aria-label="delete"
                      />
                    </div>
                  </div>
                )}
                {oldUidKanji.length > 0 && (
                  <div className="d-flex flex-row justify-content-between">
                    <span>Kanji: {oldUidKanji.length}</span>
                    <div className="ps-4" onClick={kanjiDelMetaCB}>
                      <TrashIcon
                        className="clickable"
                        size="small"
                        aria-label="delete"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-2">
        <div className="d-flex justify-content-between">
          <h5>Stale Space Repetition</h5>
          {collapseExpandToggler(sectionStaleSpaceRep, setSectionStaleSpaceRep)}
        </div>
        <div>
          {oldUidPhrase.length > 0 && (
            <div onClick={phraseDelMetaCB}>
              Stale Phrase Metadata: {oldUidPhrase.length}
            </div>
          )}
          {oldUidVocab.length > 0 && (
            <div onClick={vocabDelMetaCB}>
              Stale Vocab Metadata: {oldUidVocab.length}
            </div>
          )}
          {oldUidKanji.length > 0 && (
            <div onClick={kanjiDelMetaCB}>
              Stale Kanji Metadata: {oldUidKanji.length}
            </div>
          )}
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
