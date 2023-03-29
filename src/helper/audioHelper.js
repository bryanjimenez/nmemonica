// @ts-expect-error Error.cause
const userAbortError = new Error("User interrupted audio playback.", {
  cause: { code: "UserAborted" },
});

/**
 * @param {HTMLAudioElement} audio
 * @return {Promise<void>}
 */
export function fadeOut(audio) {
  return new Promise((resolve) => {
    const fade = () => {
      if (audio.volume < 0.000001) {
        clearInterval(i);
        // audio.pause();
        resolve();
      } else {
        if (audio.volume > 0.7) {
          audio.volume *= 0.95;
        } else {
          audio.volume *= Math.pow(audio.volume, Math.pow(audio.volume, -1));
        }
      }
    };

    const i = setInterval(fade, 20);
  });
}

// https://github.com/openmusic/array-to-audiobuffer
// https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
// https://dev.to/codr/protecting-audio-assets-with-javascript-and-web-audio-api-11oo
// https://github.com/WebAudio/web-audio-api/issues/836#issuecomment-223849363

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#crossorigin
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API

/**
 * Fetch audio
 * Play using AudioContext
 * @param {string} audioUrl
 * @param {AbortController} [AbortController]
 */
export function fetchAudio(audioUrl, AbortController) {
  const audioCtx = new AudioContext();
  const source = audioCtx.createBufferSource();

  const fetchP = fetch(audioUrl)
    .then((d) => d.arrayBuffer())
    .then((a) =>
      audioCtx.decodeAudioData(a).then((b) => {
        // const source = audioCtx.createBufferSource();
        source.buffer = b;

        // connect the AudioBufferSourceNode to the
        // destination so we can hear the sound
        source.connect(audioCtx.destination);

        // start the source playing
        source.start();
      })
    );

  /** @type {Promise<void>} */
  const interruptP = new Promise((resolve, reject) => {
    const listener = () => {
      source.stop();
      reject(userAbortError);
    };

    source.addEventListener("ended", () => {
      AbortController?.signal.removeEventListener("abort", listener);
      resolve();
    });

    if (AbortController?.signal.aborted) {
      listener();
    }

    AbortController?.signal.addEventListener("abort", listener);
  });

  return Promise.all([interruptP, fetchP]);
}

/**
 * Use HTMLAudioElement Audio() to play media
 * @deprecated use fetchAudio
 * @param {string} audioUrl
 * @param {AbortController} AbortController
 */
export function sourceAudio(audioUrl, AbortController) {
  let swipePromise;

  const audio = new Audio(audioUrl);

  swipePromise = Promise.all([
    /** @type {Promise<void>} */
    (
      new Promise((resolve, reject) => {
        const listener = () => {
          fadeOut(audio).then(() => {
            reject(userAbortError);
          });
        };

        audio.addEventListener("ended", () => {
          AbortController?.signal.removeEventListener("abort", listener);
          resolve();
        });

        if (AbortController?.signal.aborted) {
          listener();
        }

        AbortController?.signal.addEventListener("abort", listener);
      })
    ),

    audio.play(),
  ]);

  return swipePromise;
}
