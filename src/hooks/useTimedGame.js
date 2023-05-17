import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  LoopSettingBtn,
  LoopStartBtn,
  LoopStopBtn,
} from "../components/Form/BtnLoop";
import { TimePlayVerifyBtns } from "../components/Form/OptionsBar";
import { loopN, pause } from "../helper/gameHelper";
import { setMediaSessionPlaybackState } from "../helper/mediaHelper";
import {
  setWordTPCorrect,
  setWordTPIncorrect,
} from "../slices/vocabularySlice";
import { useForceRender } from "./helperHK";

/** Time duration for interrupt-to-auto-quit countdown */
const LOOP_QUIT_MS = 15000;

/**
 * @param {function} gameActionHandler
 * @param {boolean} englishSideUp
 * @param {function} [deviceMotionEvent]
 */
export function useTimedGame(
  gameActionHandler,
  englishSideUp,
  deviceMotionEvent
) {
  const loopAbortControllers = useRef(
    /** @type {AbortController[] | undefined} */ (undefined)
  );

  /** Array of TimedPlay auto quit timers */
  const loopQuitTimer = useRef(/** @type {NodeJS.Timeout[] | null} */ (null));

  const [loop, setLoop] = useState(/** @type {0|1|2|3}*/ (0)); // number of times to repeat a word/phrase
  const [loopQuitCount, setLoopQuitCount] = useState(LOOP_QUIT_MS / 1000); // countdown for auto disable loop

  /** timed play answered */
  const tpAnswered = useRef(/** @type {boolean | undefined}*/ (undefined));
  const [tpAnimation, setTpAnimation] = useState(
    /** @type {number | null} */ (null)
  ); //progress/time bar value
  /** timed play answer timestamp */
  const tpTimeStamp = useRef(/** @type {number | undefined} */ (undefined));
  /** time elapsed from prompt to answer (ms) */
  const tpElapsed = useRef(/** @type {number | undefined} */ (undefined));
  const [tpBtn, setTpBtn] = useState(
    /** @type {"incorrect"|"pronunciation"|"reset"|undefined} */ (undefined)
  ); //answer verify options

  useEffect(() => {
    const ab = loopAbortControllers;

    return () => {
      ab.current?.forEach((ac) => ac.abort());
    };
  }, []);

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

            return /** @type {0|1|2|3}*/ (!zero ? prevLoop + 1 : 0);
          });
        }
      }
    />
  );

  const timedPlayVerifyBtn = /** @param {boolean} misPronounced*/ (
    misPronounced
  ) => (
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

  function beginLoop() {
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

    /** @type {function | undefined} */
    let endMotionEventListen;
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

    /** @type {(ac: AbortController) => Promise<Awaited<void>[]>} */
    let gamePropmt;
    /** @type {(ac: AbortController) => Promise<void>} */
    let gameResponse;
    if (englishSideUp) {
      gamePropmt = (ac) => looperSwipe("down", ac);

      gameResponse = (ac) => loopN(loop, () => looperSwipe("up", ac), 1500, ac);
    } else {
      gamePropmt = (ac) => looperSwipe("up", ac);

      gameResponse = (ac) =>
        loopN(loop, () => looperSwipe("down", ac), 1500, ac);
    }

    /**
     * @param {number} p Part
     * @param {number} w Whole
     */
    const countDown = (p, w) => {
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

    pause(700, ac1)
      .then(() => {
        // begin elapsing here
        tpTimeStamp.current = Date.now();
        return gamePropmt(ac2).catch((error) => {
          if (error.cause?.code === "UserAborted") {
            // skip all playback
            throw error;
          } else {
            // caught trying to fetch gamePrompt
            // continue
          }
        });
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
          .catch((/** @type {Error} */ error) => {
            // @ts-expect-error Error.cause
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
  }

  /**
   * Returns false had it not been looping.
   */
  const abortLoop = useCallback(() => {
    /** @type {boolean} */
    let wasLooping = false;

    loopAbortControllers.current?.forEach((ac /*, idx, { length }*/) => {
      wasLooping = true;
      ac.abort();
      // TODO: unused
      // if (idx === length - 1) {
      //   // TODO: interruptTimedPlayAnimation  here?
      //   interruptTimedPlayAnimation(setTpAnimation);
      // }
    });
    loopAbortControllers.current = undefined;

    return wasLooping;
  }, [loopAbortControllers]);

  /**
   * For the loop
   * @param {string} direction
   * @param {AbortController} [AbortController]
   */
  function looperSwipe(direction, AbortController) {
    let promise;
    if (loop > 0) {
      promise = gameActionHandler(direction, AbortController);
    }
    return promise || Promise.reject("loop disabled");
  }

  /**
   * During timed play interrupt
   */
  function getElapsedTimedPlay() {
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
  }

  /**
   * Update Timed Play score for term on metadata object
   * @param {AppDispatch} dispatch
   * @param {string} uid
   * @param {import("../typings/raw").SpaceRepetitionMap} repetition
   */
  function gradeTimedPlayEvent(dispatch, uid, repetition) {
    if (loop > 0 && tpAnswered.current !== undefined) {
      if (tpBtn === "reset") {
        if (repetition[uid]?.pron === true) {
          // reset incorrect pronunciation
          if (tpElapsed.current !== undefined) {
            dispatch(
              setWordTPCorrect(uid, tpElapsed.current, {
                pronunciation: undefined,
              })
            );
          }
        }
        // else don't grade ... skip
      } else {
        if (tpAnswered.current === true) {
          if (tpElapsed.current !== undefined) {
            dispatch(setWordTPCorrect(uid, tpElapsed.current));
          }
        } else {
          const reason = {
            pronunciation: tpBtn === "pronunciation" || undefined,
          };
          dispatch(setWordTPIncorrect(uid, reason));
        }
      }
    }
  }

  /**
   * Resets all loop variables to starting position
   */
  function resetTimedPlay() {
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
  }

  /**
   * Handles Timed Play Game behavior during a move
   * @param {string} direction Direction of move
   * @param {function} handler
   */
  function timedPlayAnswerHandlerWrapper(direction, handler) {
    if(loop === 0)
      return handler

    let answerHandler = handler;
    if (direction === "up" || direction === "down") {
      // force incorrect direction to correct handler
      const correctedDirection = englishSideUp ? "up" : "down";
      answerHandler = (/** @type {string} */ wrongDirection) =>
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
  }

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
 * @param {string} direction
 * @param {function} answerHandler
 * @param {React.Dispatch<React.SetStateAction<0|1|2|3>>} setLoop
 * @param {number|null} tpAnimation
 * @param {React.Dispatch<React.SetStateAction<number|null>>} setTpAnimation
 * @param {React.Dispatch<React.SetStateAction<number>>} setLoopQuitCount
 * @param {React.MutableRefObject<NodeJS.Timer[]|null>} loopQuitTimer
 * @param {React.MutableRefObject<number|undefined>} tpTimeStamp
 * @param {function} abortLoop
 * @param {function} getElapsedTimedPlay
 * @param {React.MutableRefObject<boolean|undefined>} tpAnswered
 * @param {React.MutableRefObject<number|undefined>} tpElapsed
 */
function interruptTimedPlayToAnswer(
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
) {
  /** @type {function} */
  let handler = answerHandler;
  const noop = () => {};
  let userInterruptAnimation = () =>
    interruptTimedPlayAnimation(tpAnimation, setTpAnimation);

  // interrupt loop
  const wasLooping = abortLoop();
  if (wasLooping) {
    /** @type {boolean|undefined} */

    const duringQuery =
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
        userInterruptAnimation = noop;

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
        handler = noop; // avoid replaying ontop of loop
        userInterruptAnimation = noop;
      }
    } else {
      if (duringResponse) {
        userInterruptAnimation = noop;
      }

      // interrupt-to-auto-quit
      const countDown = interruptTimedPlayToAutoQuit(setLoop, setLoopQuitCount);
      loopQuitTimer.current = [countDown];
    }

    userInterruptAnimation();
    setMediaSessionPlaybackState("paused");
  }

  return handler;
}

/**
 * Interrupt Timed play animation
 * @param {number|null} tpAnimation
 * @param {React.Dispatch<React.SetStateAction<number|null>>} setTpAnimation
 */
function interruptTimedPlayAnimation(tpAnimation, setTpAnimation) {
  if (tpAnimation !== null) {
    setTimeout(() => {
      setTpAnimation(0);

      setTimeout(() => {
        setTpAnimation((a) => (a === 0 ? null : a));
      }, 1000);
    }, 1500);
  }
}

/**
 *
 * @param {React.Dispatch<React.SetStateAction<0|1|2|3>>} setLoop
 * @param {React.Dispatch<React.SetStateAction<number>>} setLoopQuitCount
 */
function interruptTimedPlayToAutoQuit(setLoop, setLoopQuitCount) {
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
