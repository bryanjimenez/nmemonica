import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";
import { AutoPlaySetting } from "../../actions/settingsAct";
import { addParam } from "../../helper/urlHelper";

/**
 * @typedef {{word: {
 * tl: string,
 * q: string,
 * uid: string
 * }[],
 * autoPlay: typeof AutoPlaySetting[keyof AutoPlaySetting],
 * reCache?: boolean,
 * onPushedPlay: function,
 * onAutoPlayDone: function,
 * visible: boolean,}} AudioItemProps
 */

/**
 * @param {AudioItemProps} props
 */
export default function AudioItem(props) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

  // console.log(props.autoPlay + " " + JSON.stringify(props.word));
  // props.word = [currJWord, currEword, lastJWord]
  // props.word = [playOnClick, playOnShow, playOnSwipe]
  const words = props.word;

  /** @type {HTMLAudioElement|null} */
  let player;
  /** @type {number} */
  let tStart;
  let playPushed = false;

  const touchPlayParam = words[0];

  /** @type {string[]} */
  let autoPlayEndPoint = [];

  if (props.autoPlay === AutoPlaySetting.EN_JP && words.length === 2) {
    autoPlayEndPoint = [addParam(pronounceEndoint, words[1])];
  } else if (props.autoPlay === AutoPlaySetting.JP_EN && words.length === 2) {
    autoPlayEndPoint = [addParam(pronounceEndoint, words[0])];
  } else if (props.autoPlay === AutoPlaySetting.EN_JP && words.length === 3) {
    autoPlayEndPoint = [
      addParam(pronounceEndoint, words[2]),
      addParam(pronounceEndoint, words[1]),
    ];
  } else if (props.autoPlay === AutoPlaySetting.JP_EN && words.length === 3) {
    autoPlayEndPoint = [
      addParam(pronounceEndoint, words[2]),
      addParam(pronounceEndoint, words[1]),
    ];
  } else {
    autoPlayEndPoint = [addParam(pronounceEndoint, words[0])];
  }

  const playNextAudio = function () {
    // trigger on last autoPlay if play was never pushed
    const [, ...nextEndPoints] = autoPlayEndPoint;
    autoPlayEndPoint = nextEndPoints;

    if (
      props.autoPlay > AutoPlaySetting.OFF &&
      autoPlayEndPoint.length === 0 &&
      playPushed === false
    ) {
      if (props.onAutoPlayDone && typeof props.onAutoPlayDone === "function") {
        props.onAutoPlayDone();
      }
    }

    if (
      [AutoPlaySetting.EN_JP, AutoPlaySetting.JP_EN].includes(props.autoPlay) &&
      autoPlayEndPoint.length > 0
    ) {
      if (player) {
        player.src = autoPlayEndPoint[0];
        player.play();
      } else {
        console.error("AudioItem not ready");
      }
    }
  };

  const clickEvHan0 = () => {
    tStart = Date.now();

    playPushed = true;
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
      onMouseDown={props.visible ? clickEvHan0 : undefined}
      onTouchStart={props.visible ? clickEvHan0 : undefined}
      onMouseUp={props.visible ? clickEvHan1 : undefined}
      onTouchEnd={props.visible ? clickEvHan1 : undefined}
    >
      <audio
        ref={(ref) => {
          // src attr remains from last onClick
          if (ref && ref.src && props.autoPlay === AutoPlaySetting.OFF) {
            ref.removeAttribute("src");
          }
          return (player = ref);
        }}
        autoPlay={props.autoPlay !== AutoPlaySetting.OFF}
        src={
          props.autoPlay !== AutoPlaySetting.OFF
            ? autoPlayEndPoint[0]
            : undefined
        }
        onError={() => {
          // likely failed to fetch resource
          playNextAudio();
        }}
        onEnded={() => {
          playNextAudio();
        }}
      />
      {props.visible && <UnmuteIcon size="medium" aria-label="pronunciation" />}
    </div>
  );
}

AudioItem.defaultProps = {
  autoPlay: 0,
  visible: false,
};

AudioItem.propTypes = {
  word: PropTypes.arrayOf(
    PropTypes.shape({
      tl: PropTypes.string.isRequired, // target language used in req
      q: PropTypes.string.isRequired, // query used in req
      uid: PropTypes.string.isRequired, // index used in cache
    })
  ).isRequired,
  autoPlay: PropTypes.number, //0->off,1->JP,2->EN,JP,3->JP,EN
  reCache: PropTypes.bool,
  onPushedPlay: PropTypes.func,
  onAutoPlayDone: PropTypes.func,
  visible: PropTypes.bool,
};
