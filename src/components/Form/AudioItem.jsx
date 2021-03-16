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
        // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p口

        player.src = pronounceEndoint + "?q=" + props.word;
        player.play();
      }}
    >
      <audio
        ref={(ref) => (player = ref)}
        autoPlay={props.autoplay}
        src={pronounceEndoint + "?q=" + props.word}
      />
      <UnmuteIcon size="medium" aria-label="pronunciation" />
    </div>
  );
}

AudioItem.propTypes = {
  word: PropTypes.string.isRequired,
  autoplay: PropTypes.bool.isRequired,
};
