import { useMemo } from "react";

import {
  getDifficultyCounts,
  getLastViewCounts,
  getRecallCounts,
  getStalenessCounts,
} from "../../helper/statsHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";

export default function SettingsStats() {
  const { repetition: phraseRep } = useConnectPhrase();
  const { repetition: vocabRep } = useConnectVocabulary();
  const { repetition: kanjiRep } = useConnectKanji();

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
    return {
      phraseC: getLastViewCounts(phraseRep, numberOfDays),
      vocabC: getLastViewCounts(vocabRep, numberOfDays),
      kanjiC: getLastViewCounts(kanjiRep, numberOfDays),

      phraseR: getRecallCounts(phraseRep),
      vocabR: getRecallCounts(vocabRep),
      kanjiR: getRecallCounts(kanjiRep),

      phraseQ: getStalenessCounts(phraseRep),
      vocabQ: getStalenessCounts(vocabRep),
      kanjiQ: getStalenessCounts(kanjiRep),

      phraseD: getDifficultyCounts(phraseRep),
      vocabD: getDifficultyCounts(vocabRep),
      kanjiD: getDifficultyCounts(kanjiRep),
    };
  }, [phraseRep, vocabRep, kanjiRep]);

  const oneDay = 1000 * 60 * 60 * 24;
  const daysOW = phraseC.map((v, i) => {
    return new Date(Date.now() - oneDay * i).toLocaleString("en-us", {
      weekday: "short",
    });
  });

  const el = (
    <div className="outer">
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
      <div className="d-flex flex-column flex-sm-row justify-content-between">
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
    </div>
  );

  return el;
}
