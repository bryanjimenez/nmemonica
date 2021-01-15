import firebase from "firebase/app";
import "firebase/database";

export const GET_PHRASES = "get_phrases";

export function getPhrases() {
  return (dispatch) => {
    firebase
      .database()
      .ref("lambda/phrases")
      .once("value")
      .then((snapshot) => {
        dispatch({
          type: GET_PHRASES,
          value: snapshot.val(),
        });
      })
      .catch(() => {
        console.warn("getPhrases failed");
      });
  };
}
