const userAbortError = new Error("User interrupted audio playback.", {
  cause: { code: "UserAborted" },
});

function fadeOut(audio: HTMLAudioElement) {
  return new Promise<void>((resolve) => {
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

// Single instance of AudioContext https://web.dev/webaudio-intro/#toc-play
let audioCtx: AudioContext | null = null;

/**
 * Play an audio (can be interrupted)
 */
export function playAudio(
  buffer: ArrayBuffer,
  AbortController?: AbortController
) {
  if (audioCtx === null) {
    // To prevent:
    // An AudioContext was prevented from starting automatically.
    // It must be created or resumed after a user gesture on the page.
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createBufferSource();
  const destination = audioCtx.destination;

  const playP = audioCtx.decodeAudioData(buffer).then((decodBuf) => {
    source.buffer = decodBuf;

    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    source.connect(destination);

    // start the source playing
    source.start();
  });

  const interruptP: Promise<void> = new Promise((resolve, reject) => {
    const listener = () => {
      source.stop();
      reject(userAbortError);
    };

    source.addEventListener("ended", () => {
      AbortController?.signal.removeEventListener("abort", listener);
      resolve();
    });

    if (AbortController?.signal.aborted === true) {
      listener();
    }

    AbortController?.signal.addEventListener("abort", listener);
  });

  return Promise.all([interruptP, playP]);
}

/**
 * Fetch audio
 *
 * Play using AudioContext
 * @deprecated use getSynthAudioWorkaroundNoAsync
 */
async function fetchAudio(audioUrl: Request) {
  const audioRes = await fetch(audioUrl, { credentials: "include" });
  // const audioBuf = await audioRes.arrayBuffer();

  return audioRes.blob();
}

/**
 * Use HTMLAudioElement Audio() to play media
 * @deprecated use fetchAudio
 */
function sourceAudio(audioUrl: string, AbortController: AbortController) {
  let swipePromise;

  const audio = new Audio(audioUrl);

  swipePromise = Promise.all([
    new Promise<void>((resolve, reject) => {
      const listener = () => {
        void fadeOut(audio).then(() => {
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
    }),
    audio.play(),
  ]);

  return swipePromise;
}
