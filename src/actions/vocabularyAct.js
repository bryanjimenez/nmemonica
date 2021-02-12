import { firebaseConfig } from "../../environment.development";

export const GET_VOCABULARY = "get_vocabulary";

export function getVocabulary() {
  return (dispatch, getState) => {
    const version = getState().version.vocabulary || 0;

    return fetch(firebaseConfig.databaseURL + "/lambda/vocabulary.json", {
      headers: { "Data-Version": version },
    })
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_VOCABULARY,
          value: data,
        })
      );
  };
}
