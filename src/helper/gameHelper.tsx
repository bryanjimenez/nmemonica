import classNames from "classnames";
import type {
  FuriganaToggleMap,
  GroupListMap,
  MetaDataObj,
  RawPhrase,
  RawVocabulary,
} from "nmemonica";
import React from "react";

import { JapaneseText } from "./JapaneseText";
import { JapaneseVerb } from "./JapaneseVerb";
import { isYoon, kanaHintBuilder } from "./kanaHelper";
import { furiganaHintBuilder } from "./kanjiHelper";
import { TermFilterBy } from "../slices/settingHelper";
import type { ValuesOf } from "../typings/utils";

export function getTermUID<Term extends { uid: string }>(
  selectedIndex: number,
  filteredTerms: Term[],
  alternateOrder?: number[]
) {
  let term;

  if (alternateOrder) {
    const index = alternateOrder[selectedIndex];
    term = filteredTerms[index];
  } else {
    term = filteredTerms[selectedIndex];
  }

  return term.uid;
}

/**
 * @returns the term in the list matching the uid
 * @param uid
 * @param filteredList list of terms (subset)
 * @param completeList list ot terms
 */
export function getTerm<Term extends { uid: string }>(
  uid: string,
  filteredList: Term[],
  completeList?: Term[]
) {
  let term = filteredList.find((v) => uid === v.uid);

  if (!term && completeList) {
    // previous term was outside of filteredList
    // a jumpToTerm
    term = completeList.find((v) => uid === v.uid);
  }

  if (!term) {
    throw new Error("No term found");
  }

  return term;
}

/**
 * Filters terms (words or phrases) list
 * by groups or tags
 * @param filterType
 * @param termList word or phrase list
 * @param frequencyList
 * @param activeGrpList
 * @param toggleFilterType
 * @returns filteredPhrases
 */
export function termFilterByType<
  Term extends { uid: string; grp?: string; subGrp?: string; tags: string[] },
>(
  filterType: ValuesOf<typeof TermFilterBy>,
  termList: Term[],
  activeGrpList: string[]
) {
  let filteredTerms = termList;

  if (filterType === TermFilterBy.TAGS) {
    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter((term) =>
        term.tags.some((aTag) => activeGrpList.includes(aTag))
      );
    }
  } else {
    // group filtering
    if (activeGrpList.length > 0) {
      filteredTerms = termList.filter((t) =>
        activeGroupIncludes(activeGrpList, t)
      );
    }
  }

  return filteredTerms;
}

/**
 * Calculate `Pending` list and reduce `filtered` Term list
 */
export function getPendingReduceFiltered<Term>(
  leftOver: number[],
  failed: number[],
  overdue: number[],
  notPlayed: number[],
  todayDone: number[],
  filtered: Term[]
) {
  // if *just one* overLimit then add to pending now
  const pending =
    leftOver.length === 1
      ? [...failed, ...overdue, ...leftOver]
      : [...failed, ...overdue];

  const recallGame = pending.length;

  let result = pending;
  if (pending.length === 0) {
    result = [...notPlayed, ...todayDone];
  }

  // normalize indexes for pending and (trim) filtered
  return {
    ...result.reduce<{ pending: number[]; reducedFiltered: Term[] }>(
      (acc, idx, i) => ({
        pending: [...acc.pending, i],
        reducedFiltered: [...acc.reducedFiltered, filtered[idx]],
      }),
      { pending: [], reducedFiltered: [] }
    ),
    recallGame,
  };
}

/**
 * Active group filtering logic
 */
export function activeGroupIncludes<
  Term extends { grp?: string; subGrp?: string },
>(activeGrpList: string[], term: Term) {
  return (
    (term.grp !== undefined &&
      (activeGrpList.includes(term.grp) ||
        (term.subGrp !== undefined &&
          activeGrpList.includes(`${term.grp}.${term.subGrp}`)))) ||
    (term.grp === undefined &&
      (activeGrpList.includes("undefined") ||
        (term.subGrp !== undefined &&
          activeGrpList.includes(`undefined.${term.subGrp}`))))
  );
}

/**
 * Returns a list of groups that no longer are available,
 * but remain on the active groups list
 */
export function getStaleGroups(termGroups: GroupListMap, termActive: string[]) {
  const allGroups = Object.keys(termGroups).reduce<string[]>((acc, g) => {
    acc = [...acc, g, ...termGroups[g].map((sg) => g + "." + sg)];

    return acc;
  }, []);

  const stale = termActive.reduce<string[]>((acc, active) => {
    if (!allGroups.includes(active)) {
      acc = [...acc, active];
    }
    return acc;
  }, []);

  return stale;
}

/**
 * Given a Record of MetadataObj and a term list
 * finds stale keys, and uids in the MetadataObj
 * returns a set of stale keys and a list of which uid the key belonged to
 */
export function getStaleSpaceRepKeys<
  T extends { uid: string; english: string },
>(
  repetition: Record<string, MetaDataObj | undefined>,
  termList: T[],
  staleLabel: string
) {
  if (termList.length === 0 || Object.keys(repetition).length === 0) {
    return { keys: new Set<string>(), list: [] };
  }

  const MetadataObjKeys: {
    [key in keyof MetaDataObj]: null;
  } = {
    lastView: null,
    vC: null,
    f: null,
    pron: null,

    // Space Repetition
    lastReview: null,
    consecutiveRight: null,
    difficultyP: null,
    accuracyP: null,
    daysBetweenReviews: null,
  };
  const SpaceRepKeys = new Set(Object.keys(MetadataObjKeys));

  let OldSpaceRepKeys = new Set<string>();
  let staleInfoList: { key: string; uid: string; english: string }[] = [];
  Object.keys(repetition).forEach((srepUid) => {
    const o = repetition[srepUid];
    let term: { english: string };

    try {
      term = getTerm<(typeof termList)[0]>(srepUid, termList);

      if (o !== undefined) {
        Object.keys(o).forEach((key) => {
          let staleInfo;
          if (!SpaceRepKeys.has(key)) {
            staleInfo = { key, uid: srepUid, english: term.english };
          }

          if (staleInfo !== undefined) {
            OldSpaceRepKeys.add(key);
            staleInfoList = [...staleInfoList, staleInfo];
          }
        });
      }
    } catch {
      term = { english: staleLabel };
      let staleInfo = { key: "uid", uid: srepUid, english: term.english };
      staleInfoList = [...staleInfoList, staleInfo];
    }
  });

  return { keys: OldSpaceRepKeys, list: staleInfoList };
}

/**
 * Minimum time between actions to trigger a space repetition update.
 * Prevents SpaceRepetition updates during quick scrolling.
 */
export function minimumTimeForSpaceRepUpdate(prevTime: number) {
  return ~~(Date.now() - prevTime) > 1500;
}

/**
 * Minimum time required to continue playing TimedPlay.
 * Prevents TimedPlay during quick scrolling.
 */
export function minimumTimeForTimedPlay(prevTime: number) {
  return ~~(Date.now() - prevTime) > 300;
}

export function labelOptions(index: number, options: string[]) {
  return options[index];
}

export function toggleOptions<T>(index: number, options: T[]) {
  const len = options.length;

  return index + 1 < len ? index + 1 : 0;
}

/**
 * Decorates label with metadata info (intransitive, keigo, etc.)
 */
export function japaneseLabel(
  isOnBottom: boolean,
  jObj: JapaneseText | JapaneseVerb,
  inJapanese: React.JSX.Element,
  jumpToTerm?: (uid: string) => void,
  rawObj?: RawPhrase
) {
  const indicatorsCss = "fs-5";
  const isOnTop = !isOnBottom;
  let indicators: React.JSX.Element[] = [];

  let showAsterix = false;
  let showIntr = false;
  let pairUID: string | undefined;
  if (
    jObj.constructor.name === JapaneseVerb.name &&
    "isExceptionVerb" in jObj
  ) {
    showAsterix = jObj.isExceptionVerb() || jObj.getVerbClass() === 3;
    showIntr = jObj.isIntransitive();
    pairUID = jObj.getTransitivePair() ?? jObj.getIntransitivePair();
  }

  const showNaAdj = jObj.isNaAdj();
  const showSlang = jObj.isSlang();
  const showKeigo = jObj.isKeigo();
  const showInverse = rawObj?.inverse;

  if (isOnTop && (showIntr || pairUID !== undefined)) {
    let viewMyPair = undefined;
    if (pairUID !== undefined && typeof jumpToTerm === "function") {
      const p = pairUID;
      viewMyPair = () => {
        jumpToTerm(p);
      };
    }

    indicators = [
      ...indicators,
      <span
        key={indicators.length + 1}
        className={classNames({
          clickable: pairUID,
          "question-color": pairUID,
        })}
        onClick={viewMyPair}
      >
        {showIntr ? "intr" : "trans"}
      </span>,
    ];
  }
  if (isOnTop && showSlang) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>slang</span>,
    ];
  }
  if (isOnTop && showKeigo) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>keigo</span>,
    ];
  }
  if (showAsterix && indicators.length > 0) {
    indicators = [<span key={indicators.length + 1}>*</span>, ...indicators];
  }
  if (isOnTop && showInverse !== undefined) {
    let viewMyInverse = undefined;
    if (typeof jumpToTerm === "function") {
      viewMyInverse = () => {
        jumpToTerm(showInverse);
      };
    }

    indicators = [
      ...indicators,
      <span
        key={indicators.length + 1}
        className={classNames({
          clickable: showInverse,
          "question-color": showInverse,
        })}
        onClick={viewMyInverse}
      >
        inv
      </span>,
    ];
  }

  let inJapaneseLbl;
  if (indicators.length > 0) {
    inJapaneseLbl = (
      <span>
        {inJapanese}
        {showNaAdj && <span className="opacity-25"> {"な"}</span>}
        <span className={indicatorsCss}>
          <span> (</span>
          {indicators.reduce<React.JSX.Element[]>((a, c, i) => {
            if (i > 0 && i < indicators.length) {
              const sepIdx = indicators.length + i;
              const separator = <span key={"sep-" + sepIdx}>, </span>;
              return [...a, separator, c];
            } else {
              return [...a, c];
            }
          }, [])}
          <span>)</span>
        </span>
      </span>
    );
  } else if (showAsterix) {
    inJapaneseLbl = (
      <span className="text-nowrap">
        {inJapanese}
        <span> {"*"}</span>
      </span>
    );
  } else if (showNaAdj) {
    inJapaneseLbl = (
      <span className="text-nowrap">
        {inJapanese}
        <span className="opacity-25"> {"な"}</span>
      </span>
    );
  } else {
    inJapaneseLbl = inJapanese;
  }

  return inJapaneseLbl;
}

/**
 * Decorates label with metadata info (intransitive, keigo, etc.)
 */
export function englishLabel(
  isOnTop: boolean,
  jObj: JapaneseText | JapaneseVerb,
  inEnglish: React.JSX.Element | string,
  jumpToTerm?: (uid: string) => void,
  rawObj?: RawPhrase
) {
  const indicatorsCss = "fs-5";
  let indicators: React.JSX.Element[] = [];
  let showIntr = false;
  let pairUID: string | undefined;
  if (
    jObj.constructor.name === JapaneseVerb.name &&
    "isExceptionVerb" in jObj
  ) {
    showIntr = jObj.isIntransitive();
    pairUID = jObj.getTransitivePair() ?? jObj.getIntransitivePair();
  }

  const showSlang = jObj.isSlang();
  const showKeigo = jObj.isKeigo();

  if (isOnTop && (showIntr || pairUID !== undefined)) {
    let viewMyPair = undefined;
    if (pairUID !== undefined && typeof jumpToTerm === "function") {
      const p = pairUID;
      viewMyPair = () => {
        jumpToTerm(p);
      };
    }

    indicators = [
      ...indicators,
      <span
        key={indicators.length + 1}
        className={classNames({
          clickable: pairUID,
          "question-color": pairUID,
        })}
        onClick={viewMyPair}
      >
        {showIntr ? "intr" : "trans"}
      </span>,
    ];
  }
  if (isOnTop && showSlang) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>slang</span>,
    ];
  }
  if (isOnTop && showKeigo) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>keigo</span>,
    ];
  }

  // rawObj only for phrases
  const showInverse = rawObj?.inverse;
  let showPhraseKeigo = false;
  let showPolite = rawObj?.polite ?? false;
  let showPassive = false;
  let showFormal = false;
  let showColloquial = false;
  let showDerrogative = false;
  if (
    rawObj !== undefined &&
    "tag" in rawObj &&
    typeof rawObj.tag === "object" &&
    rawObj.tag !== null &&
    "tags" in rawObj.tag &&
    Array.isArray(rawObj.tag.tags)
  ) {
    // TODO: these are hardcoded here
    const tags = rawObj.tag.tags.map((t: string) => t.toLowerCase());
    showPhraseKeigo = tags.includes("keigo");
    showPolite = tags.includes("polite");
    showFormal = tags.includes("formal");
    showPassive = tags.includes("passive");
    showColloquial = tags.includes("colloquial");
    showDerrogative = tags.includes("derrogative");
  }

  if (isOnTop && showInverse !== undefined) {
    let viewMyInverse = undefined;
    if (typeof jumpToTerm === "function") {
      viewMyInverse = () => {
        jumpToTerm(showInverse);
      };
    }

    indicators = [
      ...indicators,
      <span
        key={indicators.length + 1}
        className={classNames({
          clickable: showInverse,
          "question-color": showInverse,
        })}
        onClick={viewMyInverse}
      >
        inv
      </span>,
    ];
  }

  if (isOnTop && showPhraseKeigo) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>keigo</span>,
    ];
  }
  if (isOnTop && showFormal) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>formal</span>,
    ];
  }
  if (isOnTop && showPolite) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>polite</span>,
    ];
  }
  if (isOnTop && showPassive) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>passive</span>,
    ];
  }
  if (isOnTop && showColloquial) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>colloq</span>,
    ];
  }
  if (isOnTop && showDerrogative) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>derrog</span>,
    ];
  }

  let inEnglishLbl;
  if (indicators.length > 0) {
    inEnglishLbl = (
      <span>
        {inEnglish}
        <span className={indicatorsCss}>
          <span> (</span>
          {indicators.reduce<React.JSX.Element[]>((a, c, i) => {
            if (i > 0 && i < indicators.length) {
              const sepIdx = indicators.length + i;
              const separator = <span key={"sep-" + sepIdx}>, </span>;
              return [...a, separator, c];
            } else {
              return [...a, c];
            }
          }, [])}
          <span>)</span>
        </span>
      </span>
    );
  } else {
    inEnglishLbl = inEnglish;
  }

  return inEnglishLbl;
}

/**
 * Flips En > Jp or Jp > En
 */
export function labelPlacementHelper(
  englishSideUp: boolean,
  inEnglish: React.JSX.Element | string,
  inJapanese: React.JSX.Element | string,
  eLabel: React.JSX.Element | string,
  jLabel: React.JSX.Element | string
) {
  let topValue, bottomValue, topLabel, bottomLabel;

  if (englishSideUp) {
    topValue = inEnglish;
    bottomValue = inJapanese;
    topLabel = eLabel;
    bottomLabel = jLabel;
  } else {
    topValue = inJapanese;
    bottomValue = inEnglish;
    topLabel = jLabel;
    bottomLabel = eLabel;
  }

  return { topValue, topLabel, bottomValue, bottomLabel };
}

export function getEnglishHint(vocabulary: RawVocabulary) {
  return vocabulary.grp === undefined || vocabulary.grp === "" ? undefined : (
    <span className="hint">
      {vocabulary.grp +
        (vocabulary.subGrp !== undefined ? ", " + vocabulary.subGrp : "")}
    </span>
  );
}

export function getJapaneseHint(japaneseObj: JapaneseText) {
  const yoon = japaneseObj.getPronunciation().slice(1, 2);

  let jHint: React.JSX.Element | null;
  if (isYoon(yoon)) {
    jHint = japaneseObj.getHint(kanaHintBuilder, furiganaHintBuilder, 3, 2);
  } else {
    jHint = japaneseObj.getHint(kanaHintBuilder, furiganaHintBuilder, 3, 1);
  }

  return jHint;
}

/**
 * indexedDB key
 */
export function getCacheUID(word: RawVocabulary) {
  let { uid } = word;

  if (word.form !== undefined) {
    uid += word.form !== "dictionary" ? word.form.replace("-", ".") : "";
  }

  return uid;
}

/**
 * Creates the settings object for furigana toggling
 */
export function toggleFuriganaSettingHelper<T extends FuriganaToggleMap>(
  uid: string,
  settings: T,
  englishSideUp?: boolean,
  toggleFn?: () => void
) {
  // show by default unless explicitly set to false
  const show = !(settings?.[uid]?.f === false);

  // provide a toggle fn
  const toggle =
    englishSideUp === false && typeof toggleFn === "function"
      ? toggleFn
      : undefined;

  const furiganaToggable = {
    furigana: {
      show,
      toggle,
    },
  };

  return furiganaToggable;
}

/**
 * A thenable pause
 * @param ms to pause
 * @param AbortController signal
 * @param countDownFn
 * @returns empty promise
 */
export function pause(
  ms: number,
  { signal }: { signal: AbortSignal },
  countDownFn?: (p: number, w: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const listener = () => {
      clearTimeout(timer);
      clearInterval(animation);
      reject(new Error("Aborted"));
    };

    const animation =
      typeof countDownFn === "function"
        ? setInterval(countDownFn, 200, 200, ms)
        : -1;

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", listener);
      clearInterval(animation);
      resolve();
    }, ms);

    if (signal?.aborted) {
      listener();
    }

    signal?.addEventListener("abort", listener);
  });
}

/**
 * @param n to repeat action
 * @param action
 * @param waitBeforeEach ms to wait before triggering actions
 * @param AbortController signal
 */
export function loopN(
  n: number,
  action: () => Promise<unknown>,
  waitBeforeEach: number,
  { signal }: { signal: AbortSignal }
) {
  const loopPromise = new Promise<void>((resolve, reject) => {
    const listener = () => {
      clearTimeout(timer);

      const error = new Error("User interrupted loop.", {
        cause: { code: "UserAborted" },
      });
      reject(error);
    };

    const timer = setTimeout(() => {
      if (n > 0) {
        action()
          .then(() =>
            loopN(n - 1, action, waitBeforeEach, { signal }).then(() => {
              signal?.removeEventListener("abort", listener);
              resolve();
            })
          )
          .catch((exception) => {
            if (exception instanceof Error) {
              reject(exception);
              return;
            }
            reject(new Error(JSON.stringify(exception)));
          });
      } else {
        signal?.removeEventListener("abort", listener);
        resolve();
      }
    }, waitBeforeEach);

    if (signal?.aborted) {
      listener();
    }

    signal?.addEventListener("abort", listener);
  });

  return loopPromise;
}

/**
 * Triggers eventHandler if threshold condition is met
 * @param event
 * @param threshold
 * @param eventHandler
 */
export function motionThresholdCondition(
  event: DeviceMotionEvent,
  threshold: number,
  eventHandler: (value: number) => void
) {
  // const x = event.acceleration.x;
  const y = event.acceleration?.y;
  const z = event.acceleration?.z;
  if (y === undefined || y === null || z === undefined || z === null) {
    throw new Error("Device does not support DeviceMotionEvent", {
      cause: { code: "DeviceMotionEvent" },
    });
  } else {
    const yz = Math.sqrt(y * y + z * z);
    // const xyz = Math.sqrt(x * x + y * y + z * z);

    if (yz > threshold && typeof eventHandler === "function") {
      eventHandler(yz);
    }
  }
}

/**
 * If required request permission for DeviceMotionEvent
 */
export function getDeviceMotionEventPermission(
  onGranted: () => void,
  onError: (error: Error) => void
) {
  if (
    "DeviceMotionEvent" in window &&
    "requestPermission" in DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    (
      DeviceMotionEvent.requestPermission() as Promise<
        "default" | "denied" | "granted"
      >
    )
      .then((permissionState: "default" | "denied" | "granted") => {
        if (permissionState === "granted") {
          onGranted();
        }
      })
      .catch(onError);
  } else {
    // handle regular non iOS 13+ devices
    onGranted();
  }
}
