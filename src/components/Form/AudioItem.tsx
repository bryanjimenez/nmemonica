import { UnmuteIcon } from "@primer/octicons-react";
import { useRef } from "react";
import { useDispatch } from "react-redux";

import {
  AudioBufferRecord,
  copyBufferToCacheStore,
} from "../../helper/audioSynthPreCache";
import { DebugLevel } from "../../helper/consoleHelper";
import { AppDispatch } from "../../slices";
import { playAudio } from "../../slices/audioHelper";
import {
  type AudioItemParams,
  getSynthAudioWorkaroundNoAsync,
} from "../../slices/audioSlice";
import { logger } from "../../slices/globalSlice";

interface AudioItemProps {
  visible: boolean;
  word: AudioItemParams;
  onPushedPlay?: () => void;
}

export default function AudioItem(props: AudioItemProps) {
  const dispatch = useDispatch<AppDispatch>();
  const audioCacheStore = useRef<AudioBufferRecord>({});

  const touchPlayParam = props.word;

  const clickEvHan0 = () => {
    if (props.onPushedPlay && typeof props.onPushedPlay === "function") {
      props.onPushedPlay();
    }
  };

  const clickEvHan1 = async () => {
    const { uid, tl, q } = touchPlayParam;

    // TODO: need selectedIndex here
    const res = await dispatch(
      getSynthAudioWorkaroundNoAsync({
        key: uid,
        index: undefined,
        tl,
        q,
      })
    ).unwrap();

    void new Promise<{ uid: string; buffer: ArrayBuffer }>((resolve) => {
      resolve({
        uid: res.uid,
        buffer: copyBufferToCacheStore(audioCacheStore, res.uid, res.buffer),
      });
    }).then((res) => {
      if (uid !== res.uid) {
        dispatch(
          logger(`No Async Workaround: ${uid} ${res.uid}`, DebugLevel.ERROR)
        );
      }
      void playAudio(res.buffer);
    });
  };

  return (
    <div
      className="clickable"
      onPointerDown={props.visible ? clickEvHan0 : undefined}
      onPointerUp={props.visible ? clickEvHan1 : undefined}
    >
      {props.visible && <UnmuteIcon size="medium" aria-label="pronunciation" />}
    </div>
  );
}
