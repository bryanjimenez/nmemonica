import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import {
  englishLabel,
  getCacheUID,
  getEnglishHint,
  getJapaneseHint,
  japaneseLabel,
  labelPlacementHelper,
  toggleFuriganaSettingHelper,
} from "../../helper/gameHelper";
import { setStateFunction } from "../../hooks/helperHK";
import { furiganaToggled } from "../../slices/vocabularySlice";
import AudioItem from "../Form/AudioItem";
import Sizable from "../Form/Sizable";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 */

/**
 * @typedef {Object} VocabularyMainProps
 * @property {RawVocabulary} vocabulary
 * @property {boolean} showHint
 * @property {boolean} reCache
 */

/**
 * @param {VocabularyMainProps} props
 */
export default function VocabularyMain(props) {
  const dispatch = /** @type {AppDispatch} */ (useDispatch());

  const [showMeaning, setShowMeaning] = useState(
    /** @type {string|undefined} */ (undefined)
  );
  const [showRomaji, setShowRomaji] = useState(
    /** @type {string|undefined} */ (undefined)
  );
  const [naFlip, setNaFlip] = useState(
    /** @type {"-na" | undefined} */ (undefined)
  );

  const { global, vocabulary: v } = useSelector(
    (/** @type {RootState}*/ { global, vocabulary }) => ({ global, vocabulary })
  );
  const { swipeThreshold } = global;
  const {
    repetition,
    romaji: romajiActive,
    practiceSide: englishSideUp,
    hintEnabled,
    bareKanji: showBareKanjiSetting,
  } = v.setting;

  const { vocabulary, reCache, showHint } = props;

  useEffect(() => {
    if (showMeaning && vocabulary.uid !== showMeaning) {
      setShowMeaning(undefined);
    }

    if (showRomaji && vocabulary.uid !== showRomaji) {
      setShowRomaji(undefined);
    }
  }, [vocabulary]);

  const toggleFuriganaCB = useCallback(
    (/** @type {string} */ uid) => dispatch(furiganaToggled(uid)),
    [dispatch]
  );

  const furiganaToggable = useMemo(
    () =>
      toggleFuriganaSettingHelper(
        vocabulary.uid,
        repetition,
        englishSideUp,
        toggleFuriganaCB
      ),
    [toggleFuriganaCB, vocabulary.uid, repetition, englishSideUp]
  );

  let jLabel = <span>{"[Japanese]"}</span>;
  let eLabel = <span>{"[English]"}</span>;

  const vObj = JapaneseText.parse(vocabulary);
  const inJapanese = vObj.toHTML(furiganaToggable);

  const inEnglish = vocabulary.english;
  const romaji = vocabulary.romaji;

  const jValue = japaneseLabel(englishSideUp, vObj, inJapanese);
  const eValue = englishLabel(englishSideUp, vObj, inEnglish);

  if (hintEnabled && showHint) {
    if (englishSideUp) {
      const jHint = getJapaneseHint(vObj);
      jLabel = jHint || jLabel;
    } else {
      const eHint = getEnglishHint(vocabulary);
      eLabel = eHint || eLabel;
    }
  }

  const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
    englishSideUp,
    eValue,
    jValue,
    eLabel,
    jLabel
  );

  /** English showing, menu showBareKanji enabled, this terms furigana disabled */
  const showBareKanji =
    englishSideUp === true &&
    showBareKanjiSetting === true &&
    repetition[vocabulary.uid]?.f === false;

  const audioWords = useMemo(() => {
    let sayObj = vocabulary;
    if (JapaneseText.parse(vocabulary).isNaAdj()) {
      const naAdj = JapaneseText.parse(vocabulary).append(naFlip && "な");

      sayObj = {
        ...vocabulary,
        japanese: naAdj.toString(),
        pronounce: vocabulary.pronounce && naAdj.getPronunciation(),
        form: naFlip,
      };
    }

    return englishSideUp
      ? { tl: "en", q: vocabulary.english, uid: vocabulary.uid + ".en" }
      : {
          tl: englishSideUp ? "en" : "ja",
          q: audioPronunciation(sayObj),
          uid: getCacheUID(sayObj),
        };
  }, [vocabulary, englishSideUp, naFlip]);

  const onPushedPlay = useCallback(
    () => setNaFlip((na) => (na ? undefined : "-na")),
    []
  );

  const playButton = (
    <AudioItem
      visible={swipeThreshold === 0}
      word={audioWords}
      reCache={reCache}
      onPushedPlay={onPushedPlay}
    />
  );

  const shortEN = inEnglish.length < 55;

  return (
    <div className="pt-3 d-flex flex-column justify-content-around text-center">
      <Sizable
        breakPoint="md"
        largeClassName={{ "fs-display-5": true }}
        smallClassName={
          // {Japanese : English}
          {
            ...(!englishSideUp
              ? { "fs-display-6": true }
              : { [shortEN ? "fs-display-6" : "h3"]: true }),
          }
        }
      >
        {topValue}
      </Sizable>
      {romajiActive && romaji && (
        <h5>
          <span
            onClick={setStateFunction(setShowRomaji, (r) =>
              r === vocabulary.uid ? undefined : vocabulary.uid
            )}
            className="clickable loop-no-interrupt"
          >
            {showRomaji === vocabulary.uid ? romaji : "[Romaji]"}
          </span>
        </h5>
      )}
      <Sizable
        className={{ "loop-no-interrupt": true }}
        breakPoint="md"
        largeClassName={{ "fs-display-5": true }}
        smallClassName={
          // {Japanese : English}
          {
            ...(englishSideUp
              ? { "fs-display-6": true }
              : { [shortEN ? "fs-display-6" : "h3"]: true }),
          }
        }
        onClick={
          showBareKanji
            ? undefined
            : setStateFunction(setShowMeaning, (m) =>
                m === vocabulary.uid ? undefined : vocabulary.uid
              )
        }
      >
        {showMeaning === vocabulary.uid || showBareKanji
          ? bottomValue
          : bottomLabel}
      </Sizable>

      <div className="d-flex justify-content-center">{playButton}</div>
    </div>
  );
}

VocabularyMain.propTypes = {
  vocabulary: PropTypes.object.isRequired,
  reCache: PropTypes.bool,
  showHint: PropTypes.bool,
};
