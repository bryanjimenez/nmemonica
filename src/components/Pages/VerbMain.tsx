import classNames from "classnames";
import type { RawVocabulary } from "nmemonica";
import { useLayoutEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { type AudioItemParams } from "../../constants/voiceConstants";
import {
  englishLabel,
  getCacheUID,
  getEnglishHint,
  getJapaneseHint,
  japaneseLabel,
  labelPlacementHelper,
  toggleFuriganaSettingHelper,
} from "../../helper/gameHelper";
import { audioPronunciation } from "../../helper/JapaneseText";
import {
  JapaneseVerb,
  type VerbFormArray,
  getVerbFormsArray,
} from "../../helper/JapaneseVerb";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import type { AppDispatch } from "../../slices";
import { furiganaToggled, verbFormChanged } from "../../slices/vocabularySlice";
import Sizable from "../Form/Sizable";
import AudioItem from "../Input/AudioItem";

interface VerbMainProps {
  verb: RawVocabulary;
  showHint: boolean;
  showMeaningSwipe: boolean;
  linkToOtherTerm: (uid: string) => void;
}

export default function VerbMain(props: VerbMainProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { verb, linkToOtherTerm, showHint, showMeaningSwipe } = props;

  const [showMeaning, setShowMeaning] = useState<boolean>(false);

  const {
    verbForm,
    swipeThreshold,
    repetition,
    englishSideUp,
    hintEnabled,
    verbFormsOrder,
    verbColSplit,
  } = useConnectVocabulary();

  useLayoutEffect(() => {
    setShowMeaning(false);
  }, [verb]);

  const buildTenseElement = (key: number, tense: VerbFormArray) => {
    const columnClass = classNames({
      "col pt-3 d-flex flex-column justify-content-around text-nowrap": true,
      "ps-sm-3": key === 0,
      "pe-sm-3": key !== 0,
      "text-end": key !== 0,
    });

    const tenseRows = tense.map((t) => {
      const tenseClass = classNames({
        clickable: true,
        // "fw-bold": this.props.verbForm === t.t,
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

  const verbForms = getVerbFormsArray(verb, verbFormsOrder);
  const { t1, t2 } = splitVerbFormsToColumns(verbForms, verbColSplit);

  const furiganaToggable = toggleFuriganaSettingHelper(
    verb.uid,
    repetition,
    englishSideUp,
    () => {
      void dispatch(furiganaToggled(verb.uid));
    }
  );

  const { inJapanese, inEnglish, japaneseObj } = getVerbLabelItems(
    verb,
    verbForms,
    verbForm,
    verbColSplit,
    furiganaToggable
  );

  const vObj = useMemo(() => JapaneseVerb.parse(verb), [verb]);
  const jValue = japaneseLabel(
    englishSideUp,
    vObj,
    inJapanese,
    linkToOtherTerm
  );
  const eValue = englishLabel(englishSideUp, vObj, inEnglish, linkToOtherTerm);

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

    if (hintEnabled.current && showHint) {
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

  const { topValue, bottomValue, bottomLabel } = labelPlacementHelper(
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
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      pronounce: verb.pronounce && japaneseObj.getPronunciation(),
      form: verbForm,
    }),
    [verb, japaneseObj, verbForm]
  );

  const playButton = useMemo((): React.ReactNode | undefined => {
    let audioWords: AudioItemParams;
    if (englishSideUp) {
      audioWords = {
        tl: "en",
        q: verbJapanese.english,
        uid: verbJapanese.uid + ".en",
      };
    } else {
      const pronunciation = audioPronunciation(verbJapanese);
      if (pronunciation instanceof Error) {
        // TODO: visually show unavailable
        return undefined;
      }
      audioWords = {
        tl: "ja",
        q: pronunciation,
        uid: getCacheUID(verbJapanese),
      };
    }

    return <AudioItem visible={swipeThreshold === 0} word={audioWords} />;
  }, [englishSideUp, verbJapanese, swipeThreshold]);

  return (
    <div className="row w-100">
      {buildTenseElement(0, t1)}
      <div className="col-4 col-sm-7 pt-3 px-0 d-flex flex-column justify-content-around text-center">
        <Sizable
          breakPoint="md"
          smallClassName={{
            ...(!englishSideUp ? { "fs-display-6": true } : { h5: true }),
          }}
          largeClassName={{ "fs-display-6": true }}
        >
          {topValue}
        </Sizable>

        <Sizable
          breakPoint="md"
          className={{ "loop-no-interrupt": true }}
          smallClassName={{
            ...(englishSideUp ? { "fs-display-6": true } : { h5: true }),
          }}
          largeClassName={{ "fs-display-6": true }}
          onClick={() => setShowMeaning((m) => !m)}
        >
          {showMeaning || showMeaningSwipe ? bottomValue : bottomLabel}
        </Sizable>
        <div className="d-flex justify-content-center">{playButton}</div>
      </div>

      {buildTenseElement(2, t2)}
    </div>
  );
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
  const splitIdx = getSplitIdx(verbForms, verbColSplit);

  const formResult = verbForms.find((form) => form.name === theForm);
  const japaneseObj = formResult?.value ?? verbForms[splitIdx].value;

  let inJapanese = japaneseObj.toHTML(furiganaToggable);
  let inEnglish = <>{verb.english}</>;

  return { inJapanese, inEnglish, japaneseObj };
}
