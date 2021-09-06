import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";

export default function AudioItem(props) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

  let player;
  let tStart;

  console.log(props.autoPlay + " " + JSON.stringify(props.word));
  let word = props.word[0];
  let tl = "ja";

  if (props.autoPlay === 1) {
    word = props.word[0];
  } else if (props.autoPlay === 2 && props.word.length === 2) {
    word = props.word[1];
    tl = "en";
  } else if (props.autoPlay === 2 && props.word.length === 3) {
    word = props.word[2];
    setTimeout(() => {
      const a = new Audio(pronounceEndoint + "?tl=en&q=" + props.word[1]);

      a.play();
    }, 1300);
  }

  return (
    <div
      className="d-flex justify-content-center clickable"
      onTouchStart={() => {
        tStart = Date.now();
      }}
      onTouchEnd={() => {
        const time = Date.now() - tStart;

        if (props.autoPlay === 2) {
          word = props.word[0];
          tl = "ja";
        }

        if (time < 500) {
          player.src = pronounceEndoint + "?tl=" + tl + "&q=" + word;
        } else {
          player.src =
            pronounceEndoint + "/override_cache" + "?tl=" + tl + "&q=" + word;
        }
        player.play();
      }}
    >
      <audio
        ref={(ref) => {
          // src attr remains from last onClick
          if (ref && ref.src && props.autoPlay === 0) {
            ref.removeAttribute("src");
          }
          return (player = ref);
        }}
        autoPlay={props.autoPlay !== 0}
        src={
          props.autoPlay !== 0
            ? pronounceEndoint + "?tl=" + tl + "&q=" + word
            : undefined
        }
      />
      <UnmuteIcon size="medium" aria-label="pronunciation" />
    </div>
  );
}

AudioItem.propTypes = {
  word: PropTypes.array.isRequired,
  autoPlay: PropTypes.number.isRequired,
};
