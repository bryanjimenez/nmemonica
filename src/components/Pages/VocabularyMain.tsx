import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
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
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { furiganaToggled } from "../../slices/vocabularySlice";
import AudioItem from "../Form/AudioItem";
import Sizable from "../Form/Sizable";
import type { RawVocabulary } from "../../typings/raw";

interface VocabularyMainProps {
  vocabulary: RawVocabulary,
  showHint:boolean;
  reCache:boolean
}

export default function VocabularyMain(props:VocabularyMainProps) {
  const dispatch = useDispatch<AppDispatch>()

  const { vocabulary, reCache, showHint } = props;

  const [showMeaning, setShowMeaning] = useState<string|undefined>(undefined);
  const [showRomaji, setShowRomaji] = useState<string|undefined>(undefined);
  const [naFlip, setNaFlip] = useState<"-na" | undefined>(undefined);

  const {
    swipeThreshold,
    repetition,
    romajiEnabled,
    englishSideUp,
    hintEnabled,
    bareKanji: showBareKanjiSetting,
  } = useConnectVocabulary();

  useEffect(() => {
    // When scrolling back and forth
    // reset last words shownMeaning (etc.)
    // avoids re-showing when scrolling back
    const currUid = vocabulary.uid;
    setShowMeaning((prev) => (prev === currUid ? prev : undefined));
    setShowRomaji((prev) => (prev === currUid ? prev : undefined));
  }, [vocabulary]);

  const toggleFuriganaCB = useCallback(
    (uid:string) => dispatch(furiganaToggled(uid)),
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

  const inEnglish = <React.Fragment>{vocabulary.english}</React.Fragment>;
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

  const shortEN = vocabulary.english.length < 55;

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
              : { [shortEN ? "fs-display-6" : "h3"]: true,
              ...(shortEN ? {"lh-xs": true}: {}) }),
          }
        }
      >
        {topValue}
      </Sizable>
      {romajiEnabled && romaji && (
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
