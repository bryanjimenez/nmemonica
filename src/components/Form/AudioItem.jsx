import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";

export default function AudioItem(props) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

  let player;
  let tStart;

  return (
    <div
      className="d-flex justify-content-center clickable"
      onTouchStart={() => {
        tStart = Date.now();
      }}
      onTouchEnd={() => {
        const time = Date.now() - tStart;

        if (time < 500) {
          player.src = pronounceEndoint + "?q=" + props.word;
        } else {
          player.src =
            pronounceEndoint + "/override_cache" + "?q=" + props.word;
        }
        player.play();
      }}
    >
      <audio
        ref={(ref) => {
          // src attr remains from last onClick
          if (ref && ref.src && !props.autoPlay) {
            ref.removeAttribute("src");
          }
          return (player = ref);
        }}
        autoPlay={props.autoPlay}
        src={props.autoPlay ? pronounceEndoint + "?q=" + props.word : undefined}
      />
      <UnmuteIcon size="medium" aria-label="pronunciation" />
    </div>
  );
}

AudioItem.propTypes = {
  word: PropTypes.string.isRequired,
  autoPlay: PropTypes.bool.isRequired,
};
