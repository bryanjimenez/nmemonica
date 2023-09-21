import { useMemo } from "react";

import { getLastViewCounts, getRecallCounts } from "../../helper/statsHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectPhrase } from "../../hooks/useConnectPhrase";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";

export default function SettingsStats() {
  const { repetition: phraseRep } = useConnectPhrase();
  const { repetition: vocabRep } = useConnectVocabulary();
  const { repetition: kanjiRep } = useConnectKanji();

  const numberOfDays = 5;
  const { phraseC, vocabC, kanjiC, phraseR, vocabR, kanjiR } = useMemo(() => {
    return {
      phraseC: getLastViewCounts(phraseRep, numberOfDays),
      vocabC: getLastViewCounts(vocabRep, numberOfDays),
      kanjiC: getLastViewCounts(kanjiRep, numberOfDays),

      phraseR: getRecallCounts(phraseRep),
      vocabR: getRecallCounts(vocabRep),
      kanjiR: getRecallCounts(kanjiRep),
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
                <td className="p-1">-1</td>
                <td className="p-1">2.0</td>
                <td className="p-1">{"[1,2)"}</td>
                <td className="p-1">{"(0,1)"}</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Phrases:</td>
                <td>{phraseR.wrong}</td>
                <td>{phraseR.overdue}</td>
                <td>{phraseR.due}</td>
                <td>{phraseR.pending}</td>
              </tr>
              <tr>
                <td>Vocabulary:</td>
                <td>{vocabR.wrong}</td>
                <td>{vocabR.overdue}</td>
                <td>{vocabR.due}</td>
                <td>{vocabR.pending}</td>
              </tr>
              <tr>
                <td>Kanji:</td>
                <td>{kanjiR.wrong}</td>
                <td>{kanjiR.overdue}</td>
                <td>{kanjiR.due}</td>
                <td>{kanjiR.pending}</td>
              </tr>
              <tr>
                <td>{/** Totals */}</td>
                <td>{phraseR.wrong + vocabR.wrong + kanjiR.wrong}</td>
                <td>{phraseR.overdue + vocabR.overdue + kanjiR.overdue}</td>
                <td>{phraseR.due + vocabR.due + kanjiR.due}</td>
                <td>{phraseR.pending + vocabR.pending + kanjiR.pending}</td>
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
                    <td key={`${i} ${dayOfTheWeek}`} className="p-1">
                      {i === 0 ? "Today" : dayOfTheWeek}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Phrases:</td>
                  {phraseC.map((count, i) => (
                    <td key={`${i} ${count}`}>{count}</td>
                  ))}
                </tr>
                <tr>
                  <td>Vocabulary:</td>
                  {vocabC.map((count, i) => (
                    <td key={`${i} ${count}`}>{count}</td>
                  ))}
                </tr>
                <tr>
                  <td>Kanji:</td>
                  {kanjiC.map((count, i) => (
                    <td key={`${i} ${count}`}>{count}</td>
                  ))}
                </tr>
                <tr>
                  <td>{/** Totals */}</td>
                  {phraseC.map((el, i) => {
                    return (
                      <td key={`total-${daysOW[i]}-${i}`}>
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
    </div>
  );

  return el;
}
