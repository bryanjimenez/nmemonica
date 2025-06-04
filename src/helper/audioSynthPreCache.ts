import partition from "lodash/partition";

import { AppDispatch } from "../slices";
import {
  AudioItemParams,
  getSynthAudioWorkaroundNoAsync,
  logAudioError,
} from "../slices/voiceSlice";

/**
 * Max absolute difference to keep items cached
 * from current index
 */
const MAX_CACHE_ITEM_IDX_RADIUS = 5;

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
  store: React.RefObject<AudioBufferRecord>,
  terms: {
    uid: AudioItemParams["uid"];
    pronunciation: AudioItemParams["q"];
    index?: AudioItemParams["index"];
    tl: AudioItemParams["tl"];
  }[]
): Promise<void> {
  const [en, ja] = partition(terms, (t) => t.tl === "en");

  let nonParallel = ja;
  let engP = Promise.resolve();

  if (en.length === 1) {
    const [{ uid, pronunciation, index, tl }] = en;
    if (store.current[uid] === undefined) {
      engP = dispatch(
        getSynthAudioWorkaroundNoAsync({
          key: uid,
          index,
          tl,
          q: pronunciation,
        })
      )
        .unwrap()
        .then((res) => {
          store.current[res.uid] = { index: res.index, buffer: res.buffer };
        })
        .catch((exception) => {
          logAudioError(dispatch, exception, pronunciation, "onPreCache");
        });
    }
  } else {
    // more than one .. can't parallelize
    nonParallel = [...ja, ...en];
  }

  for (const { uid, pronunciation, index, tl } of nonParallel) {
    try {
      if (store.current[uid] === undefined) {
        // eslint-disable-next-line no-await-in-loop
        const res = await dispatch(
          getSynthAudioWorkaroundNoAsync({
            key: uid,
            index,
            tl,
            q: pronunciation,
          })
        ).unwrap();

        if (index !== undefined) {
          // only check if incoming term has an index
          const curIndex = index;

          Object.keys(store.current).forEach((kUid) =>
            cacheWindowTrim(store, kUid, curIndex)
          );
        }

        store.current[res.uid] = { index: res.index, buffer: res.buffer };
      }
    } catch (exception) {
      logAudioError(dispatch, exception, pronunciation, "onPreCache");
    }
  }

  return engP;
}

function cacheWindowTrim(
  store: React.RefObject<AudioBufferRecord>,
  kUid: string,
  curIndex: number
) {
  const cacheItem = store.current[kUid];
  const cacheIdx = cacheItem?.index;

  if (cacheItem === undefined || cacheIdx === undefined) {
    return;
  }

  if (Math.abs(curIndex - cacheIdx) > MAX_CACHE_ITEM_IDX_RADIUS) {
    store.current[kUid] = undefined;
  }
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
