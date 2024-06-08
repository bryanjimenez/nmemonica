import { MetaDataObj } from "nmemonica";

import { deleteMetadata } from "../slices/settingHelper";

/**
 * TODO: This file is separated from sheetHelper.ts because it does not depend
 * on imports which break test due to esm + ts-node + mocha
 */

/**
 * Update the metadata of a record that is edited and uid changed
 * @param meta Record of MetaDataObj
 * @param oldList of terms
 * @param newList of terms
 * @returns a metadata record with updated uids
 */
export function updateEditedUID<T extends { uid: string; english: string }>(
  meta: Record<string, MetaDataObj | undefined>,
  oldList: T[],
  newList: T[]
) {
  const prevVocab = new Map(oldList.map((v) => [v.uid, v]));
  const currVocab = new Map<string, (typeof newList)[number]>(
    newList.map((v) => [v.uid, v])
  );
  const currEnglish = new Map<string, string>(
    newList.map((v) => [v.english, v.uid])
  );

  let updatedMeta = {
    ...meta,
  };

  const changed: [string, string][] = [];

  prevVocab.forEach((v) => {
    const uidMeta = meta[v.uid];
    if (
      uidMeta !== undefined && //     old has metadata
      !currVocab.has(v.uid) && //     can't find uid in new data
      currEnglish.has(v.english) //   found english match in new data
    ) {
      const engMatchOld = oldList.filter((n) => n.english === v.english);
      const engMatchNew = newList.filter((n) => n.english === v.english);

      if (
        engMatchNew.length === 1 &&
        engMatchNew.length === engMatchOld.length
      ) {
        // simple case
        const uid = currEnglish.get(v.english);
        if (uid === undefined) {
          throw new Error("Expected uid");
        }

        const oldmeta = { ...uidMeta };

        updatedMeta = {
          ...deleteMetadata([v.uid], updatedMeta).record,
          [uid]: oldmeta,
        };
        changed.push([v.uid, uid]);
      } else if (engMatchNew.length === engMatchOld.length) {
        // mult-match case

        const unmatchedOld = engMatchOld.filter(
          (o) => engMatchNew.find((n) => o.uid === n.uid) === undefined
        );

        const unmatchedNew = engMatchNew.filter(
          (o) => engMatchOld.find((n) => o.uid === n.uid) === undefined
        );

        if (unmatchedOld.length === 1 && unmatchedNew.length === 1) {
          const [oldrecord] = unmatchedOld;
          const [newrecord] = unmatchedNew;

          const oldmeta = { ...uidMeta };

          updatedMeta = {
            ...deleteMetadata([oldrecord.uid], updatedMeta).record,
            [newrecord.uid]: oldmeta,
          };
          changed.push([oldrecord.uid, newrecord.uid]);
        } else {
          // TODO: ask user if this is an individual update?
        }
      }
    }
  });

  return { updatedMeta, changedUID: changed };
}
