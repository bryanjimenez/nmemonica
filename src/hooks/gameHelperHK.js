import classNames from "classnames";
import React, { useMemo } from "react";
import { JapaneseVerb } from "../helper/JapaneseVerb";

/**
 * @typedef {import("../typings/raw").RawJapanese} RawJapanese
 * @typedef {import("../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {import("../typings/raw").VerbFormArray} VerbFormArray
 * @typedef {import("../typings/raw").FuriganaToggleMap} FuriganaToggleMap
 * @typedef {import("../helper/JapaneseText").JapaneseText} JapaneseText
 */

/**
 * Array containing the avaiable verb forms
 * @returns {VerbFormArray}
 * @param {RawJapanese} rawVerb
 * @param {string[]} [order]
 */
export function useGetVerbFormsArray(rawVerb, order) {
  return useMemo(() => {
    const verb = {
      dictionary:
        rawVerb === undefined ? undefined : JapaneseVerb.parse(rawVerb),
    };

    const allAvailable = [
      { name: "-masu", value: verb.dictionary?.masuForm() },
      { name: "-mashou", value: verb.dictionary?.mashouForm() },
      { name: "dictionary", value: verb.dictionary },
      { name: "-nai", value: verb.dictionary?.naiForm() },
      { name: "-saseru", value: verb.dictionary?.saseruForm() },
      { name: "-te", value: verb.dictionary?.teForm() },
      { name: "-ta", value: verb.dictionary?.taForm() },
      ...(verb.dictionary?.chattaForm() !== null
        ? [{ name: "-chatta", value: verb.dictionary?.chattaForm() }]
        : []),
      ...(verb.dictionary?.reruForm() !== null
        ? [{ name: "-reru", value: verb.dictionary?.reruForm() }]
        : []),
    ];

    let filtered;
    if (order && order.length > 0) {
      filtered = order.reduce((/** @type {VerbFormArray} */ acc, form) => {
        const f = allAvailable.find((el) => el.name === form);
        if (f !== undefined) {
          acc = [...acc, f];
        }

        return acc;
      }, []);
    }

    return filtered ?? allAvailable;
  }, [rawVerb, order]);
}

/**
 * decorates label with metadata info (intransitive, keigo, etc.)
 * @param {boolean} isOnBottom
 * @param {JapaneseText | JapaneseVerb} jObj
 * @param {JSX.Element} inJapanese
 * @param {function} [jumpToTerm]
 */
export function useJapaneseLabel(isOnBottom, jObj, inJapanese, jumpToTerm) {
  return useMemo(() => {
    const isOnTop = !isOnBottom;
    /**
     * @type {JSX.Element[]}
     */
    let indicators = [];

    let showAsterix = false;
    let showIntr = false;
    /**
     * @type {string|undefined}
     */
    let pairUID;
    if (
      jObj.constructor.name === JapaneseVerb.name &&
      "isExceptionVerb" in jObj
    ) {
      showAsterix = jObj.isExceptionVerb() || jObj.getVerbClass() === 3;
      showIntr = jObj.isIntransitive();
      pairUID = jObj.getTransitivePair() || jObj.getIntransitivePair();
    }

    const showNaAdj = jObj.isNaAdj();
    const showSlang = jObj.isSlang();
    const showKeigo = jObj.isKeigo();

    if (isOnTop && (showIntr || pairUID)) {
      indicators = [
        ...indicators,
        <span
          key={indicators.length + 1}
          className={classNames({
            clickable: pairUID,
            "question-color": pairUID,
          })}
          onClick={
            pairUID && jumpToTerm
              ? () => {
                  jumpToTerm(pairUID);
                }
              : undefined
          }
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
            {indicators.reduce((/** @type {JSX.Element[]}*/ a, c, i) => {
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
 * @param {boolean} isOnTop
 * @param {JapaneseText | JapaneseVerb} jObj
 * @param {JSX.Element | string} inEnglish
 * @param {function} [jumpToTerm]
 */
export function useEnglishLabel(isOnTop, jObj, inEnglish, jumpToTerm) {
  return useMemo(() => {
    /**
     * @type {JSX.Element[]}
     */
    let indicators = [];

    let showIntr = false;
    /**
     * @type {string|undefined}
     */
    let pairUID;
    if (
      jObj.constructor.name === JapaneseVerb.name &&
      "isExceptionVerb" in jObj
    ) {
      showIntr = jObj.isIntransitive();
      pairUID = jObj.getTransitivePair() || jObj.getIntransitivePair();
    }

    const showSlang = jObj.isSlang();
    const showKeigo = jObj.isKeigo();

    if (isOnTop && (showIntr || pairUID)) {
      indicators = [
        ...indicators,
        <span
          key={indicators.length + 1}
          className={classNames({
            clickable: pairUID,
            "question-color": pairUID,
          })}
          onClick={
            pairUID && jumpToTerm
              ? () => {
                  jumpToTerm(pairUID);
                }
              : undefined
          }
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
            {indicators.reduce((/** @type {JSX.Element[]}*/ a, c, i) => {
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

/**
 * @param {boolean} englishSideUp
 * @param {JSX.Element | string} inEnglish
 * @param {JSX.Element} inJapanese
 * @param {JSX.Element | string} eLabel
 * @param {JSX.Element} jLabel
 */
export function useLabelPlacementHelper(
  englishSideUp,
  inEnglish,
  inJapanese,
  eLabel,
  jLabel
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
 * @typedef {{furigana: { show: boolean, toggle: (() => void) | undefined }}} FuriganaToggleSetting
 */
/**
 * Creates the settings object for furigana toggling
 * @param {string} uid
 * @param {FuriganaToggleMap} settings
 * @param {boolean} [englishSideUp]
 * @param {function} [toggleFn]
 */
export function useToggleFuriganaSettingHelper(
  uid,
  settings,
  englishSideUp,
  toggleFn
) {
  // show by default unless explicitly set to false
  const show = !(settings[uid] && settings[uid].f === false);

  return useMemo(() => {
    const furiganaToggleObject = {
      furigana: {
        show,
        toggle:
          (englishSideUp === false &&
            toggleFn &&
            (() => {
              toggleFn(uid);
            })) ||
          undefined,
      },
    };

    return furiganaToggleObject;
  }, [uid, show, englishSideUp, toggleFn]);
}
