import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";
import { addParam } from "../../helper/urlHelper";

/**
 * @typedef {Object} AudioItemProps
 * @property {boolean} visible,
 * @property {boolean} [reCache],
 * @property {{tl: string, q: string, uid: string }} word
 * @property {function} [onPushedPlay]
 */

/**
 * @param {AudioItemProps} props
 */
export default function AudioItem(props) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

  /** @type {HTMLAudioElement|null} */
  let player;
  /** @type {number} */
  let tStart;

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

    if (player) {
      player.src = addParam(pronounceEndoint + override, touchPlayParam);
      player.play();
    } else {
      console.error("AudioItem not ready");
    }
  };

  return (
    <div
      className="clickable"
      // onMouseDown={props.visible ? clickEvHan0 : undefined}
      onTouchStart={props.visible ? clickEvHan0 : undefined}
      // onMouseUp={props.visible ? clickEvHan1 : undefined}
      onTouchEnd={props.visible ? clickEvHan1 : undefined}
    >
      <audio
        ref={(ref) => {
          // src attr remains from last onClick
          if (ref && ref.src) {
            ref.removeAttribute("src");
          }
          return (player = ref);
        }}
        onError={() => {
          // likely failed to fetch resource
        }}
        onEnded={() => {}}
      />
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
