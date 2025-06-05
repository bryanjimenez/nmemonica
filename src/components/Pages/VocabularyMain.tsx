import classNames from "classnames";
import type { RawVocabulary } from "nmemonica";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { type AudioItemParams } from "../../constants/voiceConstants";
import { setStateFunction } from "../../helper/eventHandlerHelper";
import {
  englishLabel,
  getCacheUID,
  getEnglishHint,
  getJapaneseHint,
  japaneseLabel,
  labelPlacementHelper,
  toggleFuriganaSettingHelper,
} from "../../helper/gameHelper";
import { JapaneseText, audioPronunciation } from "../../helper/JapaneseText";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import { furiganaToggled } from "../../slices/vocabularySlice";
import AudioItem from "../Form/AudioItem";
import Sizable from "../Form/Sizable";

interface VocabularyMainProps {
  vocabulary: RawVocabulary;
  showHint: boolean;
  showMeaningSwipe: boolean;
  /** was audio played? */
  wasPlayed: boolean;
}

export default function VocabularyMain(props: VocabularyMainProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { vocabulary, showHint, wasPlayed, showMeaningSwipe } = props;

  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [naFlip, setNaFlip] = useState<"-na" | undefined>(undefined);

  const {
    swipeThreshold,
    repetition,
    englishSideUp,
    hintEnabled,
    bareKanji: showBareKanjiSetting,
  } = useConnectVocabulary();

  useLayoutEffect(() => {
    setShowMeaning(false);
  }, [vocabulary]);

  const toggleFuriganaCB = useCallback(
    () => dispatch(furiganaToggled(vocabulary.uid)),
    [dispatch, vocabulary.uid]
  );

  /** English showing, menu showBareKanji enabled, this terms furigana disabled */
  const showBareKanji =
    englishSideUp &&
    showBareKanjiSetting &&
    repetition[vocabulary.uid]?.f === false;

  const furiganaToggable = useMemo(() => {
    // show furigana
    const revealFurigana =
      (!englishSideUp || showBareKanji) && wasPlayed
        ? { [vocabulary.uid]: { ...repetition[vocabulary.uid], f: true } }
        : undefined;

    return toggleFuriganaSettingHelper(
      vocabulary.uid,
      revealFurigana ?? repetition,
      englishSideUp,
      toggleFuriganaCB
    );
  }, [
    toggleFuriganaCB,
    vocabulary.uid,
    repetition,
    englishSideUp,
    showBareKanji,
    wasPlayed,
  ]);

  let jLabel = <span>{"[Japanese]"}</span>;
  let eLabel = <span>{"[English]"}</span>;

  const vObj = JapaneseText.parse(vocabulary);
  const inJapanese = vObj.toHTML(furiganaToggable);

  const inEnglish = <>{vocabulary.english}</>;

  const jValue = japaneseLabel(englishSideUp, vObj, inJapanese);
  const eValue = englishLabel(englishSideUp, vObj, inEnglish);

  if (hintEnabled.current && showHint) {
    if (englishSideUp) {
      const jHint = getJapaneseHint(vObj);
      jLabel = jHint ?? jLabel;
    } else {
      const eHint = getEnglishHint(vocabulary);
      eLabel = eHint ?? eLabel;
    }
  }

  const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
    englishSideUp,
    eValue,
    jValue,
    eLabel,
    jLabel
  );

  const onPushedPlay = useCallback(
    () => setNaFlip((na) => (na ? undefined : "-na")),
    []
  );

  const playButton = useMemo((): React.ReactNode | undefined => {
    let sayObj = vocabulary;
    if (JapaneseText.parse(vocabulary).isNaAdj()) {
      const naAdj = JapaneseText.parse(vocabulary).append(naFlip && "な");

      sayObj = {
        ...vocabulary,
        japanese: naAdj.toString(),
        pronounce:
          vocabulary.pronounce === undefined
            ? undefined
            : naAdj.getPronunciation(),
        form: naFlip,
      };
    }

    let audioWords: AudioItemParams;
    if (englishSideUp) {
      audioWords = {
        tl: "en",
        q: vocabulary.english,
        uid: vocabulary.uid + ".en",
      };
    } else {
      const pronunciation = audioPronunciation(sayObj);
      if (pronunciation instanceof Error) {
        // TODO: visually show unavailable
        return undefined;
      }
      audioWords = {
        tl: "ja",
        q: pronunciation,
        uid: getCacheUID(sayObj),
      };
    }

    return (
      <AudioItem
        visible={swipeThreshold === 0}
        word={audioWords}
        onPushedPlay={onPushedPlay}
      />
    );
  }, [vocabulary, englishSideUp, naFlip, onPushedPlay, swipeThreshold]);

  const shortEN = vocabulary.english.length < 55;

  const hidden = swipeThreshold > 0;

  return (
    <div
      className={classNames({
        "pt-3 d-flex flex-column justify-content-around text-center": true,
        "px-3": hidden,
      })}
    >
      <Sizable
        breakPoint="md"
        largeClassName={{ "fs-display-5": true }}
        smallClassName={
          // {Japanese : English}
          {
            ...(!englishSideUp
              ? { "fs-display-6": true }
              : {
                  [shortEN ? "fs-display-6" : "h3"]: true,
                  ...(shortEN ? { "lh-xs": true } : {}),
                }),
          }
        }
      >
        {topValue}
      </Sizable>
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
            : setStateFunction(setShowMeaning, (m) => !m)
        }
      >
        {showMeaning || showMeaningSwipe || showBareKanji
          ? bottomValue
          : bottomLabel}
      </Sizable>

      <div className="d-flex justify-content-center">{playButton}</div>
    </div>
  );
}
