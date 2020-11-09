import phrases from "../../data/phrases.json";
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
        // pull static data here
        console.warn("Remote pull failed. Using local data.");
        dispatch({
          type: GET_PHRASES,
          value: phrases,
        });
      });
  };
}
