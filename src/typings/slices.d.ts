import type { MetaDataObj } from "nmemonica";
import type { GlobalInitSlice } from "../slices/globalSlice";
import type { KanaInitSlice } from "../slices/kanaSlice";
import type { KanjiInitSlice } from "../slices/kanjiSlice";
import type { OppositeInitSlice } from "../slices/oppositeSlice";
import type { ParticleInitSlice } from "../slices/particleSlice";
import type { PhraseInitSlice } from "../slices/phraseSlice";
import type { VocabularyInitSlice } from "../slices/vocabularySlice";
import type { rootState, storeDispatch } from "../slices";

export type RootState = rootState;
export type AppDispatch = storeDispatch;

export interface AppSettingState {
  global: GlobalInitSlice;
  vocabulary: VocabularyInitSlice["setting"];
  phrases: PhraseInitSlice["setting"];
  kanji: KanjiInitSlice["setting"];
  kana: KanaInitSlice["setting"];

  opposite: OppositeInitSlice;
  particle: ParticleInitSlice["setting"];
}

export interface AppProgressState {
  vocabulary: Record<string, MetaDataObj>;
  phrases: Record<string, MetaDataObj>;
  kanji: Record<string, MetaDataObj>;
}
