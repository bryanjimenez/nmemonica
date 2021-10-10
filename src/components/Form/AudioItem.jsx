import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";
import {
  AUTOPLAY_EN_JP,
  AUTOPLAY_JP_EN,
  AUTOPLAY_OFF,
} from "../../actions/settingsAct";

export default function AudioItem(props) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

  let player;
  let tStart;
  let playPushed = false;

  // console.log(props.autoPlay + " " + JSON.stringify(props.word));
  // props.word = [currJWord, currEword, lastJWord]
  // props.word = [playOnClick, playOnShow, playOnSwipe]
  const touchPlayParam = { word: props.word[0], tl: "ja" };
  let autoPlayEndPoint = [];

  if (props.autoPlay === AUTOPLAY_EN_JP && props.word.length === 2) {
    autoPlayEndPoint = [
      pronounceEndoint + "?tl=" + "en" + "&q=" + props.word[1],
    ];
  } else if (props.autoPlay === AUTOPLAY_JP_EN && props.word.length === 2) {
    autoPlayEndPoint = [
      pronounceEndoint + "?tl=" + "ja" + "&q=" + props.word[0],
    ];
  } else if (props.autoPlay === AUTOPLAY_EN_JP && props.word.length === 3) {
    autoPlayEndPoint = [
      pronounceEndoint + "?tl=" + "ja" + "&q=" + props.word[2],
      pronounceEndoint + "?tl=" + "en" + "&q=" + props.word[1],
    ];
  } else if (props.autoPlay === AUTOPLAY_JP_EN && props.word.length === 3) {
    autoPlayEndPoint = [
      pronounceEndoint + "?tl=" + "en" + "&q=" + props.word[2],
      pronounceEndoint + "?tl=" + "ja" + "&q=" + props.word[1],
    ];
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
    const time = ~~(Date.now() - tStart);

    const override = time < 500 ? "" : "/override_cache";
    const endpoint =
      pronounceEndoint +
      override +
      "?tl=" +
      touchPlayParam.tl +
      "&q=" +
      touchPlayParam.word;

    player.src = endpoint;
    player.play();
  };

  return (
    <div
      className="d-flex justify-content-center clickable"
      onMouseDown={clickEvHan0}
      onTouchStart={clickEvHan0}
      onMouseUp={clickEvHan1}
      onTouchEnd={clickEvHan1}
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
        src={props.autoPlay !== AUTOPLAY_OFF ? autoPlayEndPoint[0] : undefined}
        onError={() => {
          // likely failed to fetch resource
          playNextAudio();
        }}
        onEnded={() => {
          playNextAudio();
        }}
      />
      <UnmuteIcon size="medium" aria-label="pronunciation" />
    </div>
  );
}

AudioItem.propTypes = {
  word: PropTypes.array.isRequired,
  autoPlay: PropTypes.number.isRequired, //0->off,1->JP,2->EN,JP,3->JP,EN
  onPushedPlay: PropTypes.func,
  onAutoPlayDone: PropTypes.func,
};
