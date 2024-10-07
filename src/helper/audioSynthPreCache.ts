import { AppDispatch } from "../slices";
import {
  AudioItemParams,
  getSynthAudioWorkaroundNoAsync,
} from "../slices/audioSlice";

/**
 * To reduce response time.
 * Temporary pre cache for (slow) synthesized audio
 */
export type AudioBufferRecord = Record<
  string,
  { index?: number; buffer: ArrayBuffer } | undefined
>;

export type AudioGetterFunction = (
  uid: AudioItemParams["uid"],
  tl: AudioItemParams["tl"],
  q: AudioItemParams["q"]
) => Promise<{
  uid: string;
  index?: number;
  buffer: ArrayBuffer;
}>;

export async function getSynthVoiceBufferToCacheStore(
  dispatch: AppDispatch,
  store: React.MutableRefObject<AudioBufferRecord>,
  terms: { uid: string; pronunciation: string; index?: number }[]
): Promise<void> {
  for (const { uid, pronunciation, index } of terms) {
    if (store.current[uid] === undefined) {
      // eslint-disable-next-line no-await-in-loop
      const res = await dispatch(
        getSynthAudioWorkaroundNoAsync({
          key: uid,
          index,
          tl: "ja",
          q: pronunciation,
        })
      ).unwrap();

      store.current[res.uid] = { index: res.index, buffer: res.buffer };
    }
  }

  return Promise.resolve();
}

export function copyBufferFromCacheStore(
  store: React.MutableRefObject<AudioBufferRecord>,
  key: string
) {
  const precached = store.current[key];

  if (
    precached !== undefined &&
    precached.buffer !== undefined &&
    precached.buffer.byteLength > 0
  ) {
    const audioBuf = precached.buffer;

    const copy = new ArrayBuffer(audioBuf.byteLength);
    new Int8Array(copy).set(new Int8Array(audioBuf));
    store.current[key] = {
      ...store.current[key],
      buffer: audioBuf,
    };

    return copy;
  }
  return undefined;
}

export function copyBufferToCacheStore(
  store: React.MutableRefObject<AudioBufferRecord>,
  key: string,
  buffer: ArrayBuffer
) {
  const copy = new ArrayBuffer(buffer.byteLength);
  new Int8Array(copy).set(new Int8Array(buffer));
  store.current[key] = {
    ...store.current[key],
    buffer: copy,
  };

  return buffer;
}
