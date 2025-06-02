import { UnmuteIcon } from "@primer/octicons-react";
import { useRef } from "react";
import { useDispatch } from "react-redux";

import {
  AudioBufferRecord,
  copyBufferToCacheStore,
} from "../../helper/audioSynthPreCache";
import { AppDispatch } from "../../slices";
import { playAudio } from "../../slices/audioHelper";
import {
  type AudioItemParams,
  getAudio,
  getSynthAudioWorkaroundNoAsync,
} from "../../slices/audioSlice";

interface AudioItemProps {
  visible: boolean;
  word: AudioItemParams;
  onPushedPlay?: () => void;

  reCache?: boolean;
}

export default function AudioItem(props: AudioItemProps) {
  const dispatch = useDispatch<AppDispatch>();
  const audioCacheStore = useRef<AudioBufferRecord>({});

  let tStart: number;

  const touchPlayParam = props.word;

  const clickEvHan0 = () => {
    tStart = Date.now();

    if (props.onPushedPlay && typeof props.onPushedPlay === "function") {
      props.onPushedPlay();
    }
  };

  const clickEvHan1 = async () => {
    // ~~ double bitwise not
    // remove decimal and coerce to number
    const time = ~~(Date.now() - tStart);

    const override = !(time < 500 && props.reCache !== true);

    const { uid, tl, q } = touchPlayParam;

    if (tl === "ja") {
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
        if (uid === res.uid) {
          return playAudio(res.buffer);
        }
        throw new Error("Incorrect uid");
      });
    } else {
      void dispatch(
        getAudio({
          uid,
          index: undefined,
          tl,
          q,
          override,
        })
      )
        .unwrap()
        .then(({ buffer }) => playAudio(buffer));
    }
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
