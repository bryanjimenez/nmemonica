import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";
import {
  AUTOPLAY_EN_JP,
  AUTOPLAY_JP_EN,
  AUTOPLAY_OFF,
} from "../../actions/settingsAct";
import { addParam } from "../../helper/urlHelper";
import { gPronounceCacheIndexParam } from "../../constants/paths";

export default function AudioItem(props) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

  // console.log(props.autoPlay + " " + JSON.stringify(props.word));
  // props.word = [currJWord, currEword, lastJWord]
  // props.word = [playOnClick, playOnShow, playOnSwipe]
  const words = props.word;

  let player;
  let tStart;
  let playPushed = false;

  const touchPlayParam = words[0];

  let autoPlayEndPoint = [];

  if (props.autoPlay === AUTOPLAY_EN_JP && words.length === 2) {
    autoPlayEndPoint = [addParam(pronounceEndoint, words[1])];
  } else if (props.autoPlay === AUTOPLAY_JP_EN && words.length === 2) {
    autoPlayEndPoint = [addParam(pronounceEndoint, words[0])];
  } else if (props.autoPlay === AUTOPLAY_EN_JP && words.length === 3) {
    autoPlayEndPoint = [
      addParam(pronounceEndoint, words[2]),
      addParam(pronounceEndoint, words[1]),
    ];
  } else if (props.autoPlay === AUTOPLAY_JP_EN && words.length === 3) {
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
      props.autoPlay > AUTOPLAY_OFF &&
      autoPlayEndPoint.length === 0 &&
      playPushed === false
    ) {
      if (props.onAutoPlayDone && typeof props.onAutoPlayDone === "function") {
        props.onAutoPlayDone();
      }
    }

    if (
      [AUTOPLAY_EN_JP, AUTOPLAY_JP_EN].includes(props.autoPlay) &&
      autoPlayEndPoint.length > 0
    ) {
      player.src = autoPlayEndPoint[0];
      player.play();
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

    player.src = addParam(pronounceEndoint + override, touchPlayParam);
    player.play();
  };

  return (
    <div className="d-flex justify-content-center">
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
            if (ref && ref.src && props.autoPlay === AUTOPLAY_OFF) {
              ref.removeAttribute("src");
            }
            return (player = ref);
          }}
          autoPlay={props.autoPlay !== AUTOPLAY_OFF}
          src={
            props.autoPlay !== AUTOPLAY_OFF ? autoPlayEndPoint[0] : undefined
          }
          onError={() => {
            // likely failed to fetch resource
            playNextAudio();
          }}
          onEnded={() => {
            playNextAudio();
          }}
        />
        {props.visible && (
          <UnmuteIcon size="medium" aria-label="pronunciation" />
        )}
      </div>
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
      [gPronounceCacheIndexParam]: PropTypes.string, // index used in cache
    })
  ).isRequired,
  autoPlay: PropTypes.number, //0->off,1->JP,2->EN,JP,3->JP,EN
  reCache: PropTypes.bool,
  onPushedPlay: PropTypes.func,
  onAutoPlayDone: PropTypes.func,
  visible: PropTypes.bool,
};
