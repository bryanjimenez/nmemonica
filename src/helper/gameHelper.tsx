import classNames from "classnames";
import React from "react";

import { minsSince } from "./consoleHelper";
import { JapaneseText } from "./JapaneseText";
import { JapaneseVerb } from "./JapaneseVerb";
import { isYoon, kanaHintBuilder } from "./kanaHelper";
import { furiganaHintBuilder } from "./kanjiHelper";
import { TermFilterBy } from "../slices/settingHelper";
import type {
  FuriganaToggleMap,
  GroupListMap,
  MetaDataObj,
  RawKanji,
  RawPhrase,
  RawVocabulary,
  ValuesOf,
} from "../typings/raw";

/**
 * Goes to the next term or selects one from the frequency list
 */
export function play<RawItem extends { uid: string }>(
  reinforce: boolean,
  freqFilter: ValuesOf<typeof TermFilterBy>,
  frequency: string[],
  filteredTerms: RawItem[],
  metadata: Record<string, MetaDataObj | undefined>,
  reinforcedUID: string | null,
  updateReinforcedUID: (uid: string) => void,
  gotoNext: () => void
) {
  // some games will come from the reinforced list
  // unless filtering from frequency list
  const reinforced = reinforce && Math.random() < 1 / 3;
  if (
    freqFilter !== TermFilterBy.FREQUENCY &&
    reinforced &&
    frequency.length > 0
  ) {
    const min = 0;
    const staleFreq = frequency.filter((fUid) => {
      const lastSeen = metadata[fUid]?.lastView;

      return lastSeen && minsSince(lastSeen) > frequency.length;
    });
    const max = staleFreq.length;
    const idx = Math.floor(Math.random() * (max - min) + min);
    const vocabulary = filteredTerms.find((v) => staleFreq[idx] === v.uid);

    if (vocabulary) {
      // avoid repeating the same reinforced word
      if (reinforcedUID !== vocabulary.uid) {
        updateReinforcedUID(vocabulary.uid);
        return;
      }
    }
  }

  gotoNext();
}

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

  if (!term) {
    throw new Error("No term found");
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
 * by groups, frequency, or tags
 * @param filterType
 * @param termList word or phrase list
 * @param frequencyList
 * @param activeGrpList
 * @param toggleFilterType
 * @returns filteredPhrases
 */
export function termFilterByType<
  Term extends { uid: string; grp?: string; subGrp?: string; tags: string[] }
>(
  filterType: ValuesOf<typeof TermFilterBy>,
  termList: Term[],
  frequencyList: string[] = [],
  activeGrpList: string[],
  toggleFilterType?: (override: number) => void
) {
  let filteredTerms = termList;

  if (filterType === TermFilterBy.FREQUENCY) {
    // frequency filtering
    if (!frequencyList) {
      throw new TypeError("Filter type requires frequencyList");
    }
    // if (!toggleFilterType) {
    //   throw new TypeError("Filter type requires toggleFilterType");
    // }

    if (frequencyList.length > 0) {
      if (activeGrpList.length > 0) {
        filteredTerms = termList.filter(
          (t) =>
            frequencyList.includes(t.uid) &&
            activeGroupIncludes(activeGrpList, t)
        );
      } else {
        filteredTerms = termList.filter((t) => frequencyList.includes(t.uid));
      }
    } else {
      // last frequency word was just removed
      if (typeof toggleFilterType === "function") {
        toggleFilterType(TermFilterBy.GROUP);
      }
    }
  } else if (filterType === TermFilterBy.TAGS) {
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
 * Active group filtering logic
 */
export function activeGroupIncludes<
  Term extends { grp?: string; subGrp?: string }
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
export function getStaleSpaceRepKeys(
  repetition: Record<string, MetaDataObj | undefined>,
  termList: RawVocabulary[] | RawPhrase[] | RawKanji[],
  staleLabel: string
) {
  const MetadataObjKeys: {
    [key in keyof MetaDataObj]: null;
  } = {
    lastView: null,
    vC: null,
    f: null,
    rein: null,
    pron: null,
    tpPc: null,
    tpAcc: null,
    tpCAvg: null,

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
    if (o !== undefined) {
      Object.keys(o).forEach((key) => {
        let staleInfo;
        if (!SpaceRepKeys.has(key)) {
          let term;
          try {
            term = getTerm<(typeof termList)[0]>(srepUid, termList);
          } catch (err) {
            term = { english: staleLabel };
          }

          staleInfo = { key, uid: srepUid, english: term.english };
        }

        if (staleInfo !== undefined) {
          OldSpaceRepKeys.add(key);
          staleInfoList = [...staleInfoList, staleInfo];
        }
      });
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

  if (isOnTop && (showIntr || pairUID)) {
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
              const separator = <span key={indicators.length + i}> , </span>;
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
      <span>
        {inJapanese}
        <span> {"*"}</span>
      </span>
    );
  } else if (showNaAdj) {
    inJapaneseLbl = (
      <span>
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
  inEnglish: React.JSX.Element,
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

  if (isOnTop && (showIntr || pairUID)) {
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
  const showPolite = rawObj?.polite;
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
  if (isOnTop && showPolite) {
    indicators = [
      ...indicators,
      <span key={indicators.length + 1}>polite</span>,
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
              const separator = <span key={indicators.length + i}> , </span>;
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
  inEnglish: React.JSX.Element,
  inJapanese: React.JSX.Element,
  eLabel: React.JSX.Element,
  jLabel: React.JSX.Element
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
  return !vocabulary.grp || vocabulary.grp === "" ? undefined : (
    <span className="hint">
      {vocabulary.grp + (vocabulary.subGrp ? ", " + vocabulary.subGrp : "")}
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

  if (!uid) {
    console.warn(JSON.stringify(word));
    throw new Error("Missing uid");
  }

  if (word.form) {
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
          .catch((error) => {
            reject(error);
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
  // @ts-expect-error DeviceMotionEvent.requestPermission
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    // @ts-expect-error DeviceMotionEvent.requestPermission
    DeviceMotionEvent.requestPermission()
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
