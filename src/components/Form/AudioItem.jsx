import React from "react";
import PropTypes from "prop-types";
import { UnmuteIcon } from "@primer/octicons-react";
import { pronounceEndoint } from "../../../environment.development";

export default function AudioItem(props) {
  // https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=
  // https://dev.to/ma5ly/lets-make-a-little-audio-player-in-react-p4p

  let player;
  let tStart;
  let pTimes = 0;
  let playPushed = false;

  // console.log(props.autoPlay + " " + JSON.stringify(props.word));
  let word = props.word[0];
  let tl = "ja";

  const touchPlay = { word: props.word[0], tl: "ja" };

  if (props.autoPlay === 1) {
    word = props.word[0];
  } else if (props.autoPlay === 2 && props.word.length === 2) {
    word = props.word[1];
    tl = "en";
  } else if (props.autoPlay === 2 && props.word.length === 3) {
    word = props.word[2];
    pTimes = 1;
  }

  return (
    <div
      className="d-flex justify-content-center clickable"
      onTouchStart={() => {
        tStart = Date.now();

        playPushed = true;
        if (props.onPushedPlay && typeof props.onPushedPlay === "function") {
          props.onPushedPlay();
        }
      }}
      onTouchEnd={() => {
        const time = ~~(Date.now() - tStart);

        const override = time < 500 ? "" : "/override_cache";
        const endpoint =
          pronounceEndoint +
          override +
          "?tl=" +
          touchPlay.tl +
          "&q=" +
          touchPlay.word;

        player.src = endpoint;
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
        onEnded={() => {
          // trigger on last autoPlay if play never pushed
          if (props.autoPlay > 0 && pTimes === 0 && playPushed === false) {
            if (
              props.onAutoPlayDone &&
              typeof props.onAutoPlayDone === "function"
            ) {
              props.onAutoPlayDone();
            }
          }

          if (props.autoPlay === 2 && pTimes > 0) {
            word = props.word[1];
            tl = "en";

            player.src = pronounceEndoint + "?tl=" + tl + "&q=" + word;
            pTimes--;
            player.play();
          }
        }}
      />
      <UnmuteIcon size="medium" aria-label="pronunciation" />
    </div>
  );
}

AudioItem.propTypes = {
  word: PropTypes.array.isRequired,
  autoPlay: PropTypes.number.isRequired, //0->off,1->JP,2->EN,JP
  onPushedPlay: PropTypes.func,
  onAutoPlayDone: PropTypes.func,
};
