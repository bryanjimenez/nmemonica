import type { RawVocabulary } from "nmemonica";
import { Suspense, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import { JapaneseText, furiganaParseRetry } from "../../helper/JapaneseText";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { type AppDispatch } from "../../slices";
import { getPhrase } from "../../slices/phraseSlice";
import { getVocabulary } from "../../slices/vocabularySlice";

export default function SettingsFailedFurigana() {
  const dispatch = useDispatch<AppDispatch>();
  const { vocabList: vocabulary } = useConnectVocabulary();
  const { phraseList: phrases } = useConnectPhrase();

  useEffect(() => {
    if (vocabulary.length === 0) {
      void dispatch(getVocabulary());
    }
    if (phrases.length === 0) {
      void dispatch(getPhrase());
    }
  }, []);

  const failedFurigana = useMemo(
    () => failedFuriganaList([...phrases, ...vocabulary]),
    [vocabulary, phrases]
  );

  const el = (
    <>
      {failedFurigana.length > 0 && (
        <div className="mb-2">
          <h5>Failed Furigana Parse</h5>
          <Suspense fallback={<NotReady addlStyle="failed-furigana-view" />}>
            <div className="failed-furigana-view container mt-2 p-0">
              {failedFurigana}
            </div>
          </Suspense>
        </div>
      )}
    </>
  );

  return el;
}

function failedFuriganaList(terms: RawVocabulary[]) {
  return terms.reduce<React.JSX.Element[]>((a, text, i) => {
    const t = JapaneseText.parse(text);
    if (t.hasFurigana()) {
      try {
        furiganaParseRetry(t.getPronunciation(), t.getSpellingRAW());
      } catch (e) {
        if (e instanceof Error && "cause" in e) {
          const errData = e.cause as { code: string; info: unknown };
          if (errData.code === "ParseError" || errData.code === "InputError") {
            const separator = <hr key={`parse-err-sep-${text.uid}`} />;

            const row = (
              <div key={`parse-err-${text.uid}`} className="row">
                <span className="col p-0">
                  {t.toHTML({ showError: false })}
                </span>
                <span className="col p-0">{text.english}</span>
                <span className="col p-0 app-sm-fs-xx-small">
                  <div>{e.message}</div>
                  <div>{errData.info ? JSON.stringify(errData.info) : ""}</div>
                </span>
              </div>
            );

            return a.length > 0 && i < terms.length - 1
              ? [...a, separator, row]
              : [...a, row];
          }
        }
      }
    }
    return a;
  }, []);
}
