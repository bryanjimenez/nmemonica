import { UnmuteIcon } from "@primer/octicons-react";
import { useDispatch } from "react-redux";

import { pronounceEndpoint } from "../../../environment.development";
import { SWRequestHeader } from "../../helper/serviceWorkerHelper";
import { addParam } from "../../helper/urlHelper";
import { AppDispatch } from "../../slices";
import { playAudio } from "../../slices/audioHelper";
import { getAudio } from "../../slices/audioSlice";

interface AudioItemProps {
  visible: boolean;
  reCache?: boolean;
  word: { tl: string; q: string; uid: string };
  onPushedPlay?: () => void;
}

export default function AudioItem(props: AudioItemProps) {
  const dispatch = useDispatch<AppDispatch>();

  let tStart: number;

  const touchPlayParam = props.word;

  const clickEvHan0 = () => {
    tStart = Date.now();

    if (props.onPushedPlay && typeof props.onPushedPlay === "function") {
      props.onPushedPlay();
    }
  };

  const clickEvHan1 = () => {
    // ~~ double bitwise not
    // remove decimal and coerce to number
    const time = ~~(Date.now() - tStart);

    const override =
      time < 500 && props.reCache !== true
        ? {}
        : { headers: SWRequestHeader.CACHE_RELOAD };

    const url = addParam(pronounceEndpoint, touchPlayParam);
    void dispatch(getAudio(new Request(url, override)))
      .unwrap()
      .then((blob) => blob.arrayBuffer())
      .then(playAudio);
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
