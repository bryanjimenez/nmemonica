import { MetaDataObj } from "nmemonica";

import { AppDispatch } from "../slices";
import { workbookSheetNames } from "./sheetHelper";
import {
  clearKanji,
  batchRepetitionUpdate as kanjiBatchMetaUpdate,
} from "../slices/kanjiSlice";
import { clearOpposites } from "../slices/oppositeSlice";
import { clearParticleGame } from "../slices/particleSlice";
import {
  clearPhrases,
  batchRepetitionUpdate as phraseBatchMetaUpdate,
} from "../slices/phraseSlice";
import {
  clearVocabulary,
  batchRepetitionUpdate as vocabularyBatchMetaUpdate,
} from "../slices/vocabularySlice";

/**
 * Updates app state with incoming dataset
 * Updates metadata with incoming metadata
 * @param name name of DataSet
 * @param metaUpdateUids Record containing updated uids
 */
export function updateStateAfterWorkbookEdit(
  dispatch: AppDispatch,
  name: string,
  metaUpdatedUids?: Record<string, MetaDataObj | undefined>
) {
  switch (name) {
    case workbookSheetNames.kanji.prettyName:
      dispatch(clearKanji());
      if (metaUpdatedUids) {
        void dispatch(kanjiBatchMetaUpdate(metaUpdatedUids));
      }
      break;
    case workbookSheetNames.vocabulary.prettyName:
      dispatch(clearVocabulary());
      dispatch(clearOpposites());
      if (metaUpdatedUids) {
        void dispatch(vocabularyBatchMetaUpdate(metaUpdatedUids));
      }
      break;
    case workbookSheetNames.phrases.prettyName:
      dispatch(clearPhrases());
      dispatch(clearParticleGame());
      if (metaUpdatedUids) {
        void dispatch(phraseBatchMetaUpdate(metaUpdatedUids));
      }
      break;
    default:
      throw new Error("Incorrect sheet name: " + name);
  }
}
