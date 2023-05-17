import { useEffect } from "react";
import {
  mediaSessionAttach,
  mediaSessionDetachAll,
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
} from "../helper/mediaHelper";

/**
 * Use browser's media session controls
 * @param {string} name
 * @param {number} loop
 * @param {function} beginLoop
 * @param {function} abortLoop
 * @param {function} looperSwipe
 */
export function useMediaSession(name, loop, beginLoop, abortLoop, looperSwipe) {
  useEffect(() => {
    setMediaSessionMetadata(name);
    // setMediaSession___PlaybackState("paused???");

    /**
     * @type {import("../typings/raw").ActionHandlerTuple[]}
     */
    const actionHandlers = [
      [
        "play",
        () => {
          if (loop) {
            beginLoop();
            setMediaSessionPlaybackState("playing");
          }
        },
      ],
      [
        "pause",
        () => {
          if (loop) {
            abortLoop();
            setMediaSessionPlaybackState("paused");
          }
        },
      ],
      [
        "stop",
        () => {
          if (loop) {
            abortLoop();
            setMediaSessionPlaybackState("paused");
          }
        },
      ],
      [
        "previoustrack",
        () => {
          if (loop) {
            abortLoop();
            looperSwipe("right");
          }
        },
      ],
      [
        "nexttrack",
        () => {
          if (loop) {
            abortLoop();
            looperSwipe("left");
          }
        },
      ],
    ];

    mediaSessionAttach(actionHandlers);

    return () => {
      mediaSessionDetachAll();
    };
  }, [name, loop, beginLoop, abortLoop, looperSwipe]);
}
