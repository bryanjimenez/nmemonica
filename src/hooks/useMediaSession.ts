import { useEffect } from "react";

import {
  mediaSessionAttach,
  mediaSessionDetachAll,
  setMediaSessionMetadata,
  setMediaSessionPlaybackState,
} from "../helper/mediaHelper";
import type { ActionHandlerTuple } from "../typings/raw";

/**
 * Use browser's media session controls
 */
export function useMediaSession(
  name: string,
  loop: number,
  beginLoop: () => void,
  abortLoop: () => boolean,
  looperSwipe: (direction: string) => Promise<unknown>
) {
  useEffect(() => {
    setMediaSessionMetadata(name);
    // setMediaSession___PlaybackState("paused???");

    const actionHandlers: ActionHandlerTuple[] = [
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
            void looperSwipe("right");
          }
        },
      ],
      [
        "nexttrack",
        () => {
          if (loop) {
            abortLoop();
            void looperSwipe("left");
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
