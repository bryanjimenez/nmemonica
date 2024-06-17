import classNames from "classnames";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { NotReady } from "./NotReady";
import PlusMinus from "./PlusMinus";
import {
  getDifficultyCounts,
  getLastViewCounts,
  getRecallCounts,
  getStalenessCounts,
} from "../../helper/statsHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { AppDispatch } from "../../slices";
import { setGoal as setKanjiGoal } from "../../slices/kanjiSlice";
import { setGoal as setPhraseGoal } from "../../slices/phraseSlice";
import { setGoal as setVocabularyGoal } from "../../slices/vocabularySlice";

const SettingsStale = lazy(() => import("../Form/SettingsStale"));
const SettingsFailedFurigana = lazy(
  () => import("../Form/SettingsFailedFurigana")
);

export default function SettingsStats() {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setLoading(true);
    }, 500);

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  const { repetition: phraseRep, viewGoal: phraseGoal } = useConnectPhrase();
  const { repetition: vocabRep, viewGoal: VocabularyGoal } =
    useConnectVocabulary();
  const { repetition: kanjiRep, viewGoal: KanjiGoal } = useConnectKanji();

  const numberOfDays = 5;
  const {
    phraseC,
    vocabC,
    kanjiC,
    phraseR,
    vocabR,
    kanjiR,
    phraseQ,
    vocabQ,
    kanjiQ,
    phraseD,
    vocabD,
    kanjiD,
  } = useMemo(() => {
    let phraseMeta = phraseRep;
    let vocabMeta = vocabRep;
    let kanjiMeta = kanjiRep;
    if (loading === false) {
      // prevent locking up on mount
      phraseMeta = {};
      vocabMeta = {};
      kanjiMeta = {};
    }

    return {
      phraseC: getLastViewCounts(phraseMeta, numberOfDays),
      vocabC: getLastViewCounts(vocabMeta, numberOfDays),
      kanjiC: getLastViewCounts(kanjiMeta, numberOfDays),

      phraseR: getRecallCounts(phraseMeta),
      vocabR: getRecallCounts(vocabMeta),
      kanjiR: getRecallCounts(kanjiMeta),

      phraseQ: getStalenessCounts(phraseMeta),
      vocabQ: getStalenessCounts(vocabMeta),
      kanjiQ: getStalenessCounts(kanjiMeta),

      phraseD: getDifficultyCounts(phraseMeta),
      vocabD: getDifficultyCounts(vocabMeta),
      kanjiD: getDifficultyCounts(kanjiMeta),
    };
  }, [loading, phraseRep, vocabRep, kanjiRep]);

  const oneDay = 1000 * 60 * 60 * 24;
  const daysOW = phraseC.map((v, i) => {
    return new Date(Date.now() - oneDay * i).toLocaleString("en-us", {
      weekday: "short",
    });
  });

  const [[pM, vM, kM], setMultiplier] = useState([1, 1, 1]);
  const goals = useMemo(
    () => [
      {
        value: phraseGoal,
        mult: pM,
        change: (value: number | undefined) => {
          dispatch(setPhraseGoal(value));
        },
        title: "Phrases",
      },
      {
        value: VocabularyGoal,
        mult: vM,
        change: (value: number | undefined) => {
          dispatch(setVocabularyGoal(value));
        },
        title: "Vocabulary",
      },
      {
        value: KanjiGoal,
        mult: kM,
        change: (value: number | undefined) => {
          dispatch(setKanjiGoal(value));
        },
        title: "Kanji",
      },
    ],
    [dispatch, pM, vM, kM, phraseGoal, VocabularyGoal, KanjiGoal]
  );

  const el = (
    <div className="outer">
      <h3 className="mt-3 mb-1 fw-light">Goals</h3>
      <div className="d-flex flex-column flex-sm-row justify-content-between mb-2">
        <div className="column-1 text-start ps-2 mw-75">
          Set a goal for each section. A notification will appear when the daily
          goal (number of items viewed) is reached.
        </div>
        <div className="column-2 setting-block">
          {goals.map(({ value, mult, change, title }, i) => (
            <div
              key={title}
              className="d-flex flex-row justify-content-end mb-3"
            >
              <PlusMinus value={value} multiplier={mult} onChange={change}>
                <div className="fs-5">{title}</div>
              </PlusMinus>
              <div className="fs-4 d-flex align-items-center">
                <div
                  className={classNames({
                    clickable: true,
                    "fw-bold": mult === 10,
                  })}
                  onClick={() => {
                    setMultiplier((m) => {
                      const updateM: [number, number, number] = [...m];
                      m[i] === 1 ? (updateM[i] = 10) : (updateM[i] = 1);
                      return updateM;
                    });
                  }}
                >
                  {`x${mult}`}
                  {mult === 1 && <span className="invisible">0</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <h3 className="mt-3 mb-1 fw-light">Metrics</h3>
      <div className="d-flex flex-column flex-sm-row justify-content-between">
        <div className="column-1 text-end">
          <table className="w-50">
            <thead>
              <tr>
                <th>Recall</th>
                <td className="p-1">{"(0,1)"}</td>
                <td className="p-1">{"[1,2)"}</td>
                <td className="p-1">2.0</td>
                <td className="p-1">-1</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Phrases:</td>
                <td>{phraseR.pending}</td>
                <td>{phraseR.due}</td>
                <td>{phraseR.overdue}</td>
                <td>{phraseR.wrong}</td>
              </tr>
              <tr>
                <td>Vocabulary:</td>
                <td>{vocabR.pending}</td>
                <td>{vocabR.due}</td>
                <td>{vocabR.overdue}</td>
                <td>{vocabR.wrong}</td>
              </tr>
              <tr>
                <td>Kanji:</td>
                <td>{kanjiR.pending}</td>
                <td>{kanjiR.due}</td>
                <td>{kanjiR.overdue}</td>
                <td>{kanjiR.wrong}</td>
              </tr>
              <tr>
                <td>{/** Totals */}</td>
                <td>{phraseR.pending + vocabR.pending + kanjiR.pending}</td>
                <td>{phraseR.due + vocabR.due + kanjiR.due}</td>
                <td>{phraseR.overdue + vocabR.overdue + kanjiR.overdue}</td>
                <td>{phraseR.wrong + vocabR.wrong + kanjiR.wrong}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <table className="w-50">
              <thead>
                <tr>
                  <th>Viewed</th>
                  {daysOW.map((dayOfTheWeek, i) => (
                    <td key={`${i.toString()} ${dayOfTheWeek}`} className="p-1">
                      {i === 0 ? "Today" : dayOfTheWeek}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Phrases:</td>
                  {phraseC.map((count, i) => (
                    <td key={`${i.toString()} ${count}`}>{count}</td>
                  ))}
                </tr>
                <tr>
                  <td>Vocabulary:</td>
                  {vocabC.map((count, i) => (
                    <td key={`${i.toString()} ${count}`}>{count}</td>
                  ))}
                </tr>
                <tr>
                  <td>Kanji:</td>
                  {kanjiC.map((count, i) => (
                    <td key={`${i.toString()} ${count}`}>{count}</td>
                  ))}
                </tr>
                <tr>
                  <td>{/** Totals */}</td>
                  {phraseC.map((el, i) => {
                    return (
                      <td key={`total-${daysOW[i]}-${i.toString()}`}>
                        {(phraseC[i] ?? 0) +
                          (vocabC[i] ?? 0) +
                          (kanjiC[i] ?? 0)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="d-flex flex-column flex-sm-row justify-content-between mb-2">
        <div className="column-1 text-end">
          <table className="w-50">
            <thead>
              <tr>
                <th>lastView</th>
                <td className="p-1">new</td>
                <td className="p-1">mean</td>
                <td className="p-1">q0</td>
                <td className="p-1">q1</td>
                <td className="p-1">q2</td>
                <td className="p-1">q3</td>
                <td className="p-1">q4</td>
              </tr>
            </thead>
            <tbody>
              {phraseQ.range > 0 && (
                <tr>
                  <td>Phrases:</td>
                  <td>{phraseQ.unPlayed}</td>
                  <td>{phraseQ.mean.toFixed(1)}</td>
                  <td>{phraseQ.min}</td>
                  <td>{phraseQ.q1}</td>
                  <td>{phraseQ.q2}</td>
                  <td>{phraseQ.q3}</td>
                  <td>{phraseQ.max}</td>
                </tr>
              )}
              {vocabQ.range > 0 && (
                <tr>
                  <td>Vocabulary:</td>
                  <td>{vocabQ.unPlayed}</td>
                  <td>{vocabQ.mean.toFixed(1)}</td>
                  <td>{vocabQ.min}</td>
                  <td>{vocabQ.q1}</td>
                  <td>{vocabQ.q2}</td>
                  <td>{vocabQ.q3}</td>
                  <td>{vocabQ.max}</td>
                </tr>
              )}
              {kanjiQ.range > 0 && (
                <tr>
                  <td>Kanji:</td>
                  <td>{kanjiQ.unPlayed}</td>
                  <td>{kanjiQ.mean.toFixed(1)}</td>
                  <td>{kanjiQ.min}</td>
                  <td>{kanjiQ.q1}</td>
                  <td>{kanjiQ.q2}</td>
                  <td>{kanjiQ.q3}</td>
                  <td>{kanjiQ.max}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="column-2 setting-block"></div>
      </div>
      <div className="d-flex flex-column flex-sm-row justify-content-between mb-2">
        <div className="column-1 text-end">
          <table className="w-50">
            <thead>
              <tr>
                <th>difficultyP</th>
                <td className="p-1">0</td>
                <td className="p-1">11</td>
                <td className="p-1">21</td>
                <td className="p-1">31</td>
                <td className="p-1">41</td>
                <td className="p-1">51</td>
                <td className="p-1">61</td>
                <td className="p-1">71</td>
                <td className="p-1">81</td>
                <td className="p-1">91</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Phrases:</td>
                {phraseD.map((count, i) => (
                  <td key={`${i.toString()} ${count}`}>{count}</td>
                ))}
              </tr>
              <tr>
                <td>Vocabulary:</td>
                {vocabD.map((count, i) => (
                  <td key={`${i.toString()} ${count}`}>{count}</td>
                ))}
              </tr>
              <tr>
                <td>Kanji:</td>
                {kanjiD.map((count, i) => (
                  <td key={`${i.toString()} ${count}`}>{count}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="column-2 setting-block"></div>
      </div>

      {loading === true && (
        <div>
          <Suspense fallback={<NotReady addlStyle="failed-spacerep-view" />}>
            <SettingsStale />
          </Suspense>

          <Suspense fallback={<NotReady addlStyle="failed-furigana-view" />}>
            <SettingsFailedFurigana />
          </Suspense>
        </div>
      )}
    </div>
  );

  return el;
}
