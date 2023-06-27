import classNames from "classnames";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";

import { getVerbFormsArray } from "../helper/gameHelper";
import { JapaneseText } from "../helper/JapaneseText";
import { JapaneseVerb } from "../helper/JapaneseVerb";
import { furiganaToggled } from "../slices/vocabularySlice";
import type { FuriganaToggleMap, RawJapanese } from "../typings/raw";

/**
 * Array containing the avaiable verb forms
 */
export function useGetVerbFormsArray(rawVerb: RawJapanese, order?: string[]) {
  return useMemo(() => {
    return getVerbFormsArray(rawVerb, order);
  }, [rawVerb, order]);
}

/**
 * decorates label with metadata info (intransitive, keigo, etc.)
 */
export function useJapaneseLabel(
  isOnBottom: boolean,
  jObj: JapaneseText | JapaneseVerb,
  inJapanese: React.JSX.Element,
  jumpToTerm?: (uid: string) => void
) {
  return useMemo(() => {
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
    let inJapaneseLbl;
    if (indicators.length > 0) {
      inJapaneseLbl = (
        <span>
          {inJapanese}
          {showNaAdj && <span className="opacity-25"> {"な"}</span>}
          <span className="fs-5">
            <span> (</span>
            {indicators.reduce<React.JSX.Element[]>((a, c, i) => {
              if (i > 0 && i < indicators.length) {
                return [...a, <span key={indicators.length + i}> , </span>, c];
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
  }, [isOnBottom, jObj, inJapanese, jumpToTerm]);
}

/**
 * decorates label with metadata info (intransitive, keigo, etc.)
 */
export function useEnglishLabel(
  isOnTop: boolean,
  jObj: JapaneseText | JapaneseVerb,
  inEnglish: React.JSX.Element | string,
  jumpToTerm?: (uid: string) => void
) {
  return useMemo(() => {
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

    let inEnglishLbl;
    if (indicators.length > 0) {
      inEnglishLbl = (
        <span>
          {inEnglish}
          <span>
            <span> (</span>
            {indicators.reduce<React.JSX.Element[]>((a, c, i) => {
              if (i > 0 && i < indicators.length) {
                return [...a, <span key={indicators.length + i}> , </span>, c];
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
  }, [isOnTop, jObj, inEnglish, jumpToTerm]);
}

export function useLabelPlacementHelper(
  englishSideUp: boolean,
  inEnglish: React.JSX.Element | string,
  inJapanese: React.JSX.Element,
  eLabel: React.JSX.Element | string,
  jLabel: React.JSX.Element
) {
  return useMemo(() => {
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
  }, [englishSideUp, inEnglish, inJapanese, eLabel, jLabel]);
}

/**
 * Creates the settings object for furigana toggling
 */
export function useToggleFuriganaSettingHelper(
  uid: string,
  settings: FuriganaToggleMap,
  englishSideUp?: boolean
) {
  const dispatch = useDispatch();

  // show by default unless explicitly set to false
  const show = !(settings?.[uid]?.f === false);

  return useMemo(() => {
    const furiganaToggleObject = {
      furigana: {
        show,
        toggle:
          (englishSideUp === false &&
            (() => {
              dispatch(furiganaToggled(uid));
            })) ||
          undefined,
      },
    };

    return furiganaToggleObject;
  }, [dispatch, uid, show, englishSideUp]);
}
