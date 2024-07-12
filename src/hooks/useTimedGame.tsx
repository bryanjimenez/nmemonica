import type { MetaDataObj } from "nmemonica";
import React, { useCallback, useEffect, useRef, useState } from "react";

import type { useDeviceMotionActions } from "./useDeviceMotionActions";
import { useForceRender } from "./useFade";
import type { GameActionHandler } from "./useSwipeActions";
import {
  LoopSettingBtn,
  LoopStartBtn,
  LoopStopBtn,
} from "../components/Form/BtnLoop";
import { TimePlayVerifyBtns } from "../components/Form/OptionsBar";
import { loopN, pause } from "../helper/gameHelper";
import { setMediaSessionPlaybackState } from "../helper/mediaHelper";
import type { AppDispatch } from "../slices";
// import {
//   setWordTPCorrect,
//   setWordTPIncorrect,
// } from "../slices/vocabularySlice";

/* globals NodeJS */

/** Time duration for interrupt-to-auto-quit countdown */
const LOOP_QUIT_MS = 15000;

export function useTimedGame(
  gameActionHandler: GameActionHandler,
  englishSideUp: boolean,
  deviceMotionEvent?: ReturnType<typeof useDeviceMotionActions>
) {
  const loopAbortControllers = useRef<AbortController[] | undefined>(undefined);

  /** Array of TimedPlay auto quit timers */
  const loopQuitTimer = useRef<NodeJS.Timeout[] | null>(null);

  const [loop, setLoop] = useState<0 | 1 | 2 | 3>(0); // number of times to repeat a word/phrase
  const [loopQuitCount, setLoopQuitCount] = useState(LOOP_QUIT_MS / 1000); // countdown for auto disable loop

  /** timed play answered */
  const tpAnswered = useRef<boolean | undefined>(undefined);
  const [tpAnimation, setTpAnimation] = useState<number | null>(null); //progress/time bar value
  /** timed play answer timestamp */
  const tpTimeStamp = useRef<number | undefined>(undefined);
  /** time elapsed from prompt to answer (ms) */
  const tpElapsed = useRef<number | undefined>(undefined);
  const [tpBtn, setTpBtn] = useState<
    "incorrect" | "pronunciation" | "reset" | undefined
  >(undefined); //answer verify options

  useEffect(() => {
    const ab = loopAbortControllers;

    return () => {
      ab.current?.forEach((ac) => ac.abort());
    };
  }, []);

  /**
   * Resets all loop variables to starting position
   */
  const resetTimedPlay = useCallback(() => {
    let wasReset = false;

    if (loop > 0 && loopAbortControllers.current === undefined) {
      loopQuitTimer.current?.forEach((t) => {
        clearTimeout(t);
      });
      loopQuitTimer.current = null;

      setLoopQuitCount(LOOP_QUIT_MS / 1000);
      tpAnswered.current = undefined;
      setTpBtn(undefined);
      tpTimeStamp.current = undefined;
      tpElapsed.current = undefined;
      setTpAnimation(null);

      wasReset = true;
    }

    return wasReset;
  }, [loop]);

  const forceRender = useForceRender();

  let loopActionBtn;
  if (loop === 0) {
    loopActionBtn = null;
  } else {
    if (loopAbortControllers.current?.length === 0) {
      // prevent accidental double touch
      loopActionBtn = <LoopStopBtn />;
    } else if (loopAbortControllers.current === undefined) {
      loopActionBtn = (
        <LoopStartBtn
          countDown={
            Array.isArray(loopQuitTimer.current) ? loopQuitCount : undefined
          }
          onClick={() => {
            if (Array.isArray(loopAbortControllers.current)) {
              // avoid accidental double touch
            } else {
              if (Array.isArray(loopQuitTimer.current)) {
                // abort interrupt-to-auto-quit
                const [countDown] = loopQuitTimer.current;
                clearInterval(countDown);
                setLoopQuitCount(LOOP_QUIT_MS / 1000);
              }
              tpAnswered.current = undefined;
              setTpBtn(undefined);

              // prevent accidental double touch
              loopAbortControllers.current = [];
              setTimeout(beginLoop, 100);
              forceRender();
            }
          }}
        />
      );
    } else if (loopAbortControllers.current !== undefined) {
      loopActionBtn = (
        <LoopStopBtn
          onClick={() => {
            abortLoop();
            resetTimedPlay();
            setLoop(0);
          }}
        />
      );
    }
  }

  const loopSettingBtn = (
    <LoopSettingBtn
      active={loop > 0}
      loop={loop}
      onClick={
        // TODO: fn
        () => {
          const wasLooping = abortLoop();
          loopQuitTimer.current = null;
          if (wasLooping) {
            interruptTimedPlayAnimation(tpAnimation, setTpAnimation);
          }
          setLoop((prevLoop) => {
            const zero = prevLoop === 3;

            tpAnswered.current = zero ? undefined : tpAnswered.current;

            return (!zero ? prevLoop + 1 : 0) as 0 | 1 | 2 | 3;
          });
        }
      }
    />
  );

  const timedPlayVerifyBtn = (misPronounced: boolean) => (
    <TimePlayVerifyBtns
      visible={tpAnswered.current !== undefined}
      hover={tpBtn}
      prevMissPronu={misPronounced}
      onPronunciation={() => {
        if (misPronounced) {
          tpAnswered.current = false;
          setTpBtn((prev) => (prev === "reset" ? undefined : "reset"));
        } else {
          tpAnswered.current = false;
          setTpBtn((prev) =>
            prev === "pronunciation" ? undefined : "pronunciation"
          );
        }
      }}
      onIncorrect={() => {
        tpAnswered.current = false;
        setTpBtn((prev) => (prev === "incorrect" ? undefined : "incorrect"));
      }}
      onReset={() => {
        tpAnswered.current = false;
        setTpBtn((prev) => (prev === "reset" ? undefined : "reset"));
      }}
    />
  );

  /**
   * Returns false had it not been looping.
   */
  const abortLoop = useCallback(() => {
    let wasLooping = false;

    loopAbortControllers.current?.forEach((ac /*, idx, { length }*/) => {
      wasLooping = true;
      ac.abort();
    });
    loopAbortControllers.current = undefined;

    return wasLooping;
  }, [loopAbortControllers]);

  /**
   * For the loop
   */
  const looperSwipe = useCallback(
    (direction: string, AbortController?: AbortController) => {
      let promise;
      if (loop > 0) {
        promise = gameActionHandler(direction, AbortController);
      }
      return promise ?? Promise.reject(new Error("loop disabled"));
    },
    [gameActionHandler, loop]
  );

  const beginLoop = useCallback(() => {
    abortLoop(); // beginLoop
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    const ac3 = new AbortController();
    const ac4 = new AbortController();
    const ac5 = new AbortController();

    const onShakeEventHandler = () => {
      if (tpTimeStamp !== undefined) {
        abortLoop();
        resetTimedPlay();
        setLoop(0);
      }
    };

    let endMotionEventListen: (() => void) | undefined;
    if (typeof deviceMotionEvent === "function") {
      const {
        addDeviceMotionEvent: startMotionEventListen,
        removeDeviceMotionEvent: stopListen,
      } = deviceMotionEvent(onShakeEventHandler);

      // Start listening for motion events
      startMotionEventListen();
      endMotionEventListen = stopListen;
    }

    loopAbortControllers.current = [ac1, ac2, ac3, ac4, ac5];

    let gamePropmt: (ac: AbortController) => Promise<unknown>;
    let gameResponse: (ac: AbortController) => Promise<unknown>;
    if (englishSideUp) {
      gamePropmt = (ac) => looperSwipe("down", ac);

      gameResponse = (ac) => loopN(loop, () => looperSwipe("up", ac), 1500, ac);
    } else {
      gamePropmt = (ac) => looperSwipe("up", ac);

      gameResponse = (ac) =>
        loopN(loop, () => looperSwipe("down", ac), 1500, ac);
    }

    const countDown = (p: number, w: number) => {
      setTpAnimation((prevVal) => {
        let step;
        if (prevVal === null || 100 - prevVal < 1) {
          step = (p / w) * 100;
        } else {
          step = prevVal + (p / w) * 100;
        }
        return step;
      });
    };

    void pause(700, ac1)
      .then(() => {
        // begin elapsing here
        tpTimeStamp.current = Date.now();
        return gamePropmt(ac2).catch(
          (error: Error & { cause?: { code: string } }) => {
            if (error.cause?.code === "UserAborted") {
              // skip all playback
              throw error;
            } else {
              // caught trying to fetch gamePrompt
              // continue
            }
          }
        );
      })
      .then(() => {
        // begin tpAnimation here
        return pause(3000, ac3, countDown);
      })
      .then(() => {
        // end tpAnimation here
        setTpAnimation(null);
        tpTimeStamp.current = undefined;
        return gameResponse(ac4)
          .then(() => {
            loopAbortControllers.current = undefined;
            return looperSwipe("left");
          })
          .catch((error: Error & { cause?: { code: string } }) => {
            if (error.cause?.code === "UserAborted") {
              // user aborted
              // don't continue
            } else {
              // caught trying to fetch gameResponse
              // continue
              loopAbortControllers.current = undefined;
              return looperSwipe("left");
            }
          });
      })
      .then(() => pause(100, ac5))
      .catch(() => {
        // aborted
      })
      .then(() => {
        // finally
        if (typeof endMotionEventListen === "function") {
          endMotionEventListen();
        }
      });
  }, [
    abortLoop,
    deviceMotionEvent,
    englishSideUp,
    loop,
    looperSwipe,
    resetTimedPlay,
  ]);

  /**
   * During timed play interrupt
   */
  const getElapsedTimedPlay = useCallback(() => {
    let tpElapsed;

    // FIXME: can't dispatch action to log here

    // const uid =
    //   this.state.reinforcedUID ||
    //   getTermUID(
    //     this.state.selectedIndex,
    //     this.state.order,
    //     this.state.filteredVocab
    //   );
    // const term = getTerm(uid, this.props.vocab);
    // const msg = msgInnerTrim(term.english, 30);

    if (tpTimeStamp.current !== undefined) {
      // guessed within time

      const dateThen = tpTimeStamp.current;
      tpElapsed = Math.abs(Date.now() - dateThen);
      // const elapStr = " " + answerSeconds(tpElapsed) + "s";

      // this.props.logger("Timed Play [" + msg + "]" + elapStr, DebugLevel.DEBUG);
    } else {
      // guessed too late or too early
      // this.props.logger("Timed Play [" + msg + "] X-( ", DebugLevel.DEBUG);
    }

    return { tpElapsed };
  }, []);

  /**
   * Update Timed Play score for term on metadata object
   */
  const gradeTimedPlayEvent = useCallback(
    (
      dispatch: AppDispatch,
      uid: string,
      repetition: Record<string, MetaDataObj | undefined>
    ) => {
      if (loop > 0 && tpAnswered.current !== undefined) {
        if (tpBtn === "reset") {
          if (repetition[uid]?.pron === true) {
            // reset incorrect pronunciation
            if (tpElapsed.current !== undefined) {
              // dispatch(
              //   setWordTPCorrect(uid, tpElapsed.current, {
              //     pronunciation: undefined,
              //   })
              // );
            }
          }
          // else don't grade ... skip
        } else {
          if (tpAnswered.current) {
            if (tpElapsed.current !== undefined) {
              // dispatch(setWordTPCorrect(uid, tpElapsed.current));
            }
          } else {
            // const reason = {
            //   pronunciation: tpBtn === "pronunciation" || undefined,
            // };
            // dispatch(setWordTPIncorrect(uid, reason));
          }
        }
      }
    },
    [loop, tpBtn]
  );

  /**
   * Handles Timed Play Game behavior during a move
   * @param direction Direction of move
   * @param handler
   */
  const timedPlayAnswerHandlerWrapper = useCallback(
    (direction: string, handler: GameActionHandler) => {
      if (loop === 0) return handler;

      let answerHandler = handler;
      if (direction === "up" || direction === "down") {
        // force incorrect direction to correct handler
        const correctedDirection = englishSideUp ? "up" : "down";
        answerHandler = (/*wrongDirection: string*/) =>
          handler(correctedDirection);
      }

      const wrappedHandler = interruptTimedPlayToAnswer(
        direction,
        answerHandler,
        setLoop,
        tpAnimation,
        setTpAnimation,
        setLoopQuitCount,
        loopQuitTimer,
        tpTimeStamp,
        abortLoop,
        getElapsedTimedPlay,
        tpAnswered,
        tpElapsed
      );

      return wrappedHandler;
    },
    [abortLoop, englishSideUp, getElapsedTimedPlay, loop, tpAnimation]
  );

  return {
    beginLoop,
    abortLoop,
    looperSwipe,
    gradeTimedPlayEvent,
    resetTimedPlay,
    loopSettingBtn,
    loopActionBtn,
    timedPlayVerifyBtn,

    timedPlayAnswerHandlerWrapper,

    loop,
    setLoop,
    tpAnimation,
    tpAnswered,
  };
}

/**
 * Logic during Timed Play swipe or key action
 */
function interruptTimedPlayToAnswer(
  direction: string,
  answerHandler: GameActionHandler,
  setLoop: React.Dispatch<React.SetStateAction<0 | 1 | 2 | 3>>,
  tpAnimation: number | null,
  setTpAnimation: React.Dispatch<React.SetStateAction<number | null>>,
  setLoopQuitCount: React.Dispatch<React.SetStateAction<number>>,
  loopQuitTimer: React.MutableRefObject<NodeJS.Timer[] | null>,
  tpTimeStamp: React.MutableRefObject<number | undefined>,
  abortLoop: () => boolean,
  getElapsedTimedPlay: () => { tpElapsed?: number },
  tpAnswered: React.MutableRefObject<boolean | undefined>,
  tpElapsed: React.MutableRefObject<number | undefined>
) {
  let handler = answerHandler;

  let needInterruptAnimation = true;

  // interrupt loop
  const wasLooping = abortLoop();
  if (wasLooping) {
    const duringQuery: boolean | undefined =
      tpAnimation === null && tpTimeStamp.current !== undefined;
    const duringCountDown =
      tpAnimation !== null && tpTimeStamp.current !== undefined;
    const duringResponse =
      tpAnimation === null && tpTimeStamp.current === undefined;

    if (direction === "up" || direction === "down") {
      const elapsed = getElapsedTimedPlay();
      tpElapsed.current = elapsed.tpElapsed;
      tpAnswered.current = true;

      if (duringQuery) {
        needInterruptAnimation = false;

        tpAnswered.current = undefined;
        setTimeout(() => {
          tpAnswered.current = true;
        }, 1500);
        setTpAnimation(0);
        setTimeout(() => {
          setTpAnimation(null);
        }, 1500);
      } else if (duringCountDown) {
        // normal behavior
      } else if (duringResponse) {
        tpAnswered.current = false;
        handler = () => Promise.resolve(/** avoid replaying ontop of loop */);
        needInterruptAnimation = false;
      }
    } else {
      if (duringResponse) {
        needInterruptAnimation = false;
      }

      // interrupt-to-auto-quit
      const countDown = interruptTimedPlayToAutoQuit(setLoop, setLoopQuitCount);
      loopQuitTimer.current = [countDown];
    }

    if (needInterruptAnimation) {
      interruptTimedPlayAnimation(tpAnimation, setTpAnimation);
    }

    setMediaSessionPlaybackState("paused");
  }

  return handler;
}

/**
 * Interrupt Timed play animation
 */
function interruptTimedPlayAnimation(
  tpAnimation: number | null,
  setTpAnimation: React.Dispatch<React.SetStateAction<number | null>>
) {
  if (tpAnimation !== null) {
    setTimeout(() => {
      setTpAnimation(0);

      setTimeout(() => {
        setTpAnimation((a) => (a === 0 ? null : a));
      }, 1000);
    }, 1500);
  }
}

function interruptTimedPlayToAutoQuit(
  setLoop: React.Dispatch<React.SetStateAction<0 | 1 | 2 | 3>>,
  setLoopQuitCount: React.Dispatch<React.SetStateAction<number>>
) {
  const countDown = setInterval(() => {
    setLoopQuitCount((prev) => {
      const zero = prev === 1;
      setLoop((l) => (zero ? 0 : l));

      if (zero) {
        clearTimeout(countDown);
      }

      return !zero ? prev - 1 : LOOP_QUIT_MS / 1000;
    });
  }, 1000);

  return countDown;
}
