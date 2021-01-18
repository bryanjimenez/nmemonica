import firebase from "firebase/app";
import "firebase/database";

export const GET_VOCABULARY = "get_vocabulary";

export function getVocabulary() {
  return (dispatch) => {
    firebase
      .database()
      .ref("lambda/jlptn5")
      .orderByChild("romaji")
      .once("value")
      .then((snapshot) => {
        const vocabulary = {};
        //orderByChild only works on snapshot obj not on json result
        snapshot.forEach((child) => {
          vocabulary[child.key] = child.val();
        });
        dispatch({
          type: GET_VOCABULARY,
          value: vocabulary,
        });
      })
      .catch(() => {
        console.warn("getVocabulary failed.");
      });
  };
}
