import { UnmuteIcon } from "@primer/octicons-react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";

import { ExternalSourceType, getExternalSourceType } from "./ExtSourceInput";
import { pronounceEndoint } from "../../../environment.development";
import { audioServicePath } from "../../../environment.production";
import { fetchAudio } from "../../helper/audioHelper.production";
import { addParam } from "../../helper/urlHelper";
import { RootState } from "../../slices";

interface AudioItemProps {
  visible: boolean;
  reCache?: boolean;
  word: { tl: string; q: string; uid: string };
  onPushedPlay?: () => void;
}

export default function AudioItem(props: AudioItemProps) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=

  const localServiceURL = useSelector(
    ({ global }: RootState) => global.localServiceURL
  );

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

    const override = time < 500 && !props.reCache ? "" : "/override_cache";

    const audioUrl =
      getExternalSourceType(localServiceURL) === ExternalSourceType.LocalService
        ? localServiceURL + audioServicePath
        : pronounceEndoint;

    const url = addParam(audioUrl + override, touchPlayParam);
    void fetchAudio(url);
  };

  return (
    <div
      className="clickable"
      // onMouseDown={props.visible ? clickEvHan0 : undefined}
      onTouchStart={props.visible ? clickEvHan0 : undefined}
      // onMouseUp={props.visible ? clickEvHan1 : undefined}
      onTouchEnd={props.visible ? clickEvHan1 : undefined}
    >
      {props.visible && <UnmuteIcon size="medium" aria-label="pronunciation" />}
    </div>
  );
}

AudioItem.defaultProps = {
  visible: false,
};

AudioItem.propTypes = {
  word: PropTypes.shape({
    tl: PropTypes.string.isRequired, // target language used in req
    q: PropTypes.string.isRequired, // query used in req
    uid: PropTypes.string.isRequired, // index used in cache
  }).isRequired,
  reCache: PropTypes.bool,
  onPushedPlay: PropTypes.func,
  visible: PropTypes.bool,
};
