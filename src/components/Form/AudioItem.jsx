import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";

export default function AudioItem(props) {
  let player;

  return (
    <div
      className="d-flex justify-content-center clickable"
      onClick={() => {
        // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
        // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

        player.src = pronounceEndoint + "?q=" + props.word;
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
        src={props.autoPlay && pronounceEndoint + "?q=" + props.word}
      />
      <UnmuteIcon size="medium" aria-label="pronunciation" />
    </div>
  );
}

AudioItem.propTypes = {
  word: PropTypes.string.isRequired,
  autoPlay: PropTypes.bool.isRequired,
};
