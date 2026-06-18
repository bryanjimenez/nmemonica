import { CircularProgress } from "@mui/material";
import { UnmuteIcon } from "@primer/octicons-react";
import classNames from "classnames";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import {
  EnglishVoiceType,
  type JapaneseVoiceType,
  VOICE_KIND_EN,
  VOICE_KIND_JA,
} from "../../constants/voiceConstants";
import {
  AudioBufferRecord,
  copyBufferFromCacheStore,
  copyBufferToCacheStore,
} from "../../helper/audioSynthPreCache";
import { audioPronunciation } from "../../helper/JapaneseText";
import { useConnectAudio } from "../../hooks/useConnectAudio";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { playAudio } from "../../slices/audioHelper";
import { setEnglishVoice, setJapaneseVoice } from "../../slices/globalSlice";
import {
  dropAudioWorker,
  getSynthAudioWorkaroundNoAsync,
  initAudioWorker,
} from "../../slices/voiceSlice";
import { AppDispatch } from "../../typings/slices";
import SimpleListMenu from "../Form/SimpleListMenu";
import { properCase } from "../Games/KanjiGame";

async function tryJAVoice(
  dispatch: AppDispatch,
  japaneseVoice: JapaneseVoiceType,
  audioCacheStore: RefObject<AudioBufferRecord>
) {
  const translation = {
    ["default"]: "default",
    [VOICE_KIND_JA.ANGRY]: "怒ってる",
    [VOICE_KIND_JA.HAPPY]: "嬉しい",
    [VOICE_KIND_JA.NEUTRAL]: "中性",
    [VOICE_KIND_JA.SAD]: "悲しい",
  };

  const sampleSentence = `${translation[japaneseVoice]}音声はテストです`;

  const inJapanese = audioPronunciation({
    japanese: sampleSentence,
  });
  if (inJapanese instanceof Error) {
    throw inJapanese;
  }
  const uid = inJapanese;

  const cachedAudioBuf = copyBufferFromCacheStore(audioCacheStore, uid);

  if (cachedAudioBuf !== undefined) {
    void playAudio(cachedAudioBuf);
    return;
  }

  const res = await dispatch(
    getSynthAudioWorkaroundNoAsync({
      key: uid,
      index: undefined,
      tl: "ja",
      q: inJapanese,
    })
  ).unwrap();

  copyBufferToCacheStore(audioCacheStore, res.uid, res.buffer);

  void playAudio(res.buffer);
}

async function tryENVoice(
  dispatch: AppDispatch,
  englishVoice: EnglishVoiceType,
  audioCacheStore: RefObject<AudioBufferRecord>
) {
  const sampleSentence = `This is a test of the ${englishVoice} voice`;
  const uid = `${sampleSentence}.en`;

  const cachedAudioBuf = copyBufferFromCacheStore(audioCacheStore, uid);

  if (cachedAudioBuf !== undefined) {
    void playAudio(cachedAudioBuf);
    return;
  }

  const res = await dispatch(
    getSynthAudioWorkaroundNoAsync({
      key: uid,
      index: undefined,
      tl: "en",
      q: sampleSentence,
    })
  ).unwrap();

  copyBufferToCacheStore(audioCacheStore, res.uid, res.buffer);

  void playAudio(res.buffer);
}

export default function SettingsAudio() {
  const dispatch = useDispatch<AppDispatch>();

  const { loadingAudio } = useConnectAudio();

  const { japaneseVoice, englishVoice } = useConnectSetting();

  const jVoiceOptions = useMemo(
    () => ["default", ...Object.values(VOICE_KIND_JA)],
    []
  );
  const eVoiceOptions = useMemo(
    () => ["default", ...Object.values(VOICE_KIND_EN)],
    []
  );

  const onlyOnce = useRef(false);
  const [warmup, setwarmup] = useState(false);

  const initializeVoiceWorkerRef = useRef(() => {
    // will initialize and warmup the worker thread
    const asyncBlock = async () => {
      if (onlyOnce.current === false) {
        await dispatch(initAudioWorker());
        setwarmup(true);
      }
      onlyOnce.current = true;
    };

    void asyncBlock();

    return () => {
      void dispatch(dropAudioWorker());
    };
  });

  useEffect(() => {
    const initializeWorker = initializeVoiceWorkerRef.current;

    return initializeWorker();
  }, []);

  const audioCacheStore = useRef<AudioBufferRecord>({});

  const changeJVoiceHandler = useCallback(
    (index: number) => {
      const value = jVoiceOptions[index];

      // @ts-expect-error voice type
      void dispatch(setJapaneseVoice(value));
    },
    [dispatch, jVoiceOptions]
  );

  const changeEVoiceHandler = useCallback(
    (index: number) => {
      const value = eVoiceOptions[index];

      // @ts-expect-error voice type
      void dispatch(setEnglishVoice(value));
    },
    [dispatch, eVoiceOptions]
  );

  const notification =
    loadingAudio.length !== 1
      ? undefined // both
      : loadingAudio.some((l) => l.endsWith(".en"))
        ? "EN"
        : "JA";

  const icon = (audioType: typeof notification) => {
    if (warmup === false) {
      return (
        <div className="mt-2 me-4 disabled-color" aria-label="Loading audio">
          <UnmuteIcon className="clickable" size="medium" />
          <span className="notification" style={{ top: -20 }}>
            {<CircularProgress size={"10px"} thickness={6} />}
          </span>
        </div>
      );
    }

    return (
      <div
        className={classNames({
          "mt-2 me-4": true,
          "disabled-color": notification === audioType,
        })}
        aria-label={notification === audioType ? "Loading audio" : "Try voice"}
      >
        <UnmuteIcon
          className={classNames({
            "clickable rotate-transition": true,
            "rotate-315": notification !== audioType,
          })}
          size="medium"
        />
        {notification === audioType && (
          <span className="notification" style={{ top: -20 }}>
            <CircularProgress size={"10px"} thickness={6} />
          </span>
        )}
      </div>
    );
  };

  const el = (
    <div className="outer">
      <h3 className="mt-3 mb-1 fw-light">Japanese</h3>
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <div
            className="mt-3 ms-3"
            onClick={() => {
              if (warmup === true && loadingAudio.length === 0) {
                void tryJAVoice(dispatch, japaneseVoice, audioCacheStore);
              }
            }}
          >
            {icon("JA")}
          </div>
        </div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Voice type:"}
              options={jVoiceOptions.map(properCase)}
              initial={jVoiceOptions.indexOf(japaneseVoice)}
              onChange={changeJVoiceHandler}
            />
          </div>
        </div>
      </div>
      <h3 className="mt-3 mb-1 fw-light">English</h3>
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1">
          <div
            className="mt-3 ms-3"
            onClick={() => {
              if (warmup === true && loadingAudio.length === 0) {
                void tryENVoice(dispatch, englishVoice, audioCacheStore);
              }
            }}
          >
            {icon("EN")}
          </div>
        </div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Voice type:"}
              options={eVoiceOptions.map((v) =>
                v.split(" ").map(properCase).join(" ")
              )}
              initial={eVoiceOptions.indexOf(englishVoice)}
              onChange={changeEVoiceHandler}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
