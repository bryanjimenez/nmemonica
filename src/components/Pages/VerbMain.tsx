import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import {
  type VerbFormArray,
  getCacheUID,
  getEnglishHint,
  getJapaneseHint,
} from "../../helper/gameHelper";
import { audioPronunciation } from "../../helper/JapaneseText";
import { JapaneseVerb } from "../../helper/JapaneseVerb";
import {
  useEnglishLabel,
  useGetVerbFormsArray,
  useJapaneseLabel,
  useLabelPlacementHelper,
  useToggleFuriganaSettingHelper,
} from "../../hooks/gameHelperHK";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import { verbFormChanged } from "../../slices/vocabularySlice";
import type { RawVocabulary } from "../../typings/raw";
import AudioItem from "../Form/AudioItem";
import Sizable from "../Form/Sizable";

interface VerbMainProps {
  verb: RawVocabulary;
  reCache: boolean;
  showHint: boolean;
  linkToOtherTerm: (uid: string) => void;
}

function getSplitIdx(verbForms: VerbFormArray, verbColSplit: number) {
  const middle =
    Math.trunc(verbForms.length / 2) + (verbForms.length % 2 === 0 ? 0 : 1);

  const rightShift = middle - verbColSplit;
  const splitIdx = Math.trunc(verbForms.length / 2) + rightShift;

  return splitIdx;
}

/**
 * splits the verb forms into two columns
 * @returns an object containing two columns
 */
function splitVerbFormsToColumns(
  verbForms: VerbFormArray,
  verbColSplit: number
) {
  const splitIdx = getSplitIdx(verbForms, verbColSplit);

  const t1 = verbForms.slice(0, splitIdx);
  const t2 = verbForms.slice(splitIdx);
  return { t1, t2 };
}

/**
 * @param verb
 * @param verbForms
 * @param theForm the form to filter by
 * @param verbColSplit
 * @param furiganaToggable
 */
function getVerbLabelItems(
  verb: RawVocabulary,
  verbForms: VerbFormArray,
  theForm: string,
  verbColSplit: number,
  furiganaToggable: { furigana: { show?: boolean; toggle?: () => void } } // TODO: refactor? JapaneseText.toHTML
) {
  const romaji = verb.romaji ?? ".";
  const splitIdx = getSplitIdx(verbForms, verbColSplit);

  const formResult = verbForms.find((form) => form.name === theForm);
  const japaneseObj = formResult?.value ?? verbForms[splitIdx].value;

  let inJapanese = japaneseObj.toHTML(furiganaToggable);
  let inEnglish = verb.english;

  return { inJapanese, inEnglish, romaji, japaneseObj };
}

export default function VerbMain(props: VerbMainProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { verb, reCache, linkToOtherTerm, showHint } = props;

  const [showMeaning, setShowMeaning] = useState<string | undefined>(undefined);
  const [showRomaji, setShowRomaji] = useState<string | undefined>(undefined);

  const {
    verbForm,
    swipeThreshold,
    repetition,
    romajiEnabled,
    englishSideUp,
    hintEnabled,
    verbFormsOrder,
    verbColSplit,
  } = useConnectVocabulary();

  useEffect(() => {
    // When scrolling back and forth
    // reset last words shownMeaning (etc.)
    // avoids re-showing when scrolling back
    const currUid = verb.uid;
    setShowMeaning((prev) => (prev === currUid ? prev : undefined));
    setShowRomaji((prev) => (prev === currUid ? prev : undefined));
  }, [verb]);

  const buildTenseElement = (key: number, tense: VerbFormArray) => {
    const columnClass = classNames({
      "pt-3 flex-shrink-1 d-flex flex-column justify-content-around text-nowrap":
        true,
      "ps-sm-3": key === 0,
      "pe-sm-3": key !== 0,
      "text-end": key !== 0,
    });

    const tenseRows = tense.map((t) => {
      const tenseClass = classNames({
        clickable: true,
        // "font-weight-bold": this.props.verbForm === t.t,
      });

      const braketClass = classNames({
        invisible: verbForm === t.name,
      });

      return (
        <div
          className={tenseClass}
          key={t.name}
          onClick={() => {
            if (verbForm === t.name) {
              dispatch(verbFormChanged("dictionary"));
            } else {
              dispatch(verbFormChanged(t.name));
            }
          }}
        >
          <span className={braketClass}>[</span>
          <span>{t.name}</span>
          <span className={braketClass}>]</span>
        </div>
      );
    });

    return (
      <div key={key} className={columnClass}>
        {tenseRows}
      </div>
    );
  };

  const verbForms = useGetVerbFormsArray(verb, verbFormsOrder);
  const { t1, t2 } = splitVerbFormsToColumns(verbForms, verbColSplit);

  const furiganaToggable = useToggleFuriganaSettingHelper(
    verb.uid,
    repetition,
    englishSideUp
  );

  const { inJapanese, inEnglish, romaji, japaneseObj } = getVerbLabelItems(
    verb,
    verbForms,
    verbForm,
    verbColSplit,
    furiganaToggable
  );

  const vObj = useMemo(() => JapaneseVerb.parse(verb), [verb]);
  const jValue = useJapaneseLabel(
    englishSideUp,
    vObj,
    inJapanese,
    linkToOtherTerm
  );
  const eValue = useEnglishLabel(
    englishSideUp,
    vObj,
    inEnglish,
    linkToOtherTerm
  );

  const { jLabel, eLabel } = useMemo(() => {
    let eLabel = <span>{"[English]"}</span>;
    let jLabel = (
      <Sizable
        fragment={true}
        breakPoint="sm"
        smallValue="[J]"
        largeValue="[Japanese]"
      />
    );

    if (hintEnabled && showHint) {
      if (englishSideUp) {
        const jHint = getJapaneseHint(japaneseObj);
        if (jHint) {
          jLabel = jHint;
        }
      } else {
        const eHint = getEnglishHint(verb);
        if (eHint) {
          eLabel = eHint;
        }
      }
    }

    return { jLabel, eLabel };
  }, [hintEnabled, showHint, englishSideUp, japaneseObj, verb]);

  const { topValue, bottomValue, bottomLabel } = useLabelPlacementHelper(
    englishSideUp,
    eValue,
    jValue,
    eLabel,
    jLabel
  );

  const verbJapanese = useMemo(
    () => ({
      ...verb,
      japanese: japaneseObj.toString(),
      pronounce: verb.pronounce && japaneseObj.getPronunciation(),
      form: verbForm,
    }),
    [verb, japaneseObj, verbForm]
  );

  const audioWords = useMemo(() => {
    return englishSideUp
      ? { tl: "en", q: verbJapanese.english, uid: verbJapanese.uid + ".en" }
      : {
          tl: "ja",
          q: audioPronunciation(verbJapanese),
          uid: getCacheUID(verbJapanese),
        };
  }, [englishSideUp, verbJapanese]);

  const playButton = (
    <AudioItem
      visible={swipeThreshold === 0}
      word={audioWords}
      reCache={reCache}
    />
  );

  return (
    <>
      {buildTenseElement(0, t1)}
      <div
        key={1}
        className="pt-3 w-100 d-flex flex-column justify-content-around text-center"
      >
        <Sizable
          breakPoint="md"
          smallClassName={{
            ...(!englishSideUp ? { "fs-display-6": true } : { h5: true }),
          }}
          largeClassName={{ "fs-display-6": true }}
        >
          {topValue}
        </Sizable>

        {romajiEnabled && romaji && (
          <div>
            <span
              className="clickable loop-no-interrupt"
              onClick={() =>
                setShowRomaji((r) => (r === verb.uid ? undefined : verb.uid))
              }
            >
              {showRomaji === verb.uid ? romaji : "[romaji]"}
            </span>
          </div>
        )}

        <Sizable
          breakPoint="md"
          className={{ "loop-no-interrupt": true }}
          smallClassName={{
            ...(englishSideUp ? { "fs-display-6": true } : { h5: true }),
          }}
          largeClassName={{ "fs-display-6": true }}
          onClick={() =>
            setShowMeaning((m) => (m === verb.uid ? undefined : verb.uid))
          }
        >
          {showMeaning === verb.uid ? bottomValue : bottomLabel}
        </Sizable>
        <div className="d-flex justify-content-center">{playButton}</div>
      </div>

      {buildTenseElement(2, t2)}
    </>
  );
}

VerbMain.propTypes = {
  verb: PropTypes.object.isRequired,
  reCache: PropTypes.bool,
  linkToOtherTerm: PropTypes.func,
  showHint: PropTypes.bool,
};
