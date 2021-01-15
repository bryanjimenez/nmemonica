import firebase from "firebase/app";
import "firebase/database";

export const GET_VERBS = "get_verbs";

export function getVerbs() {
  return (dispatch) => {
    firebase
      .database()
      .ref("lambda/verbs")
      .once("value")
      .then((snapshot) => {
        dispatch({
          type: GET_VERBS,
          value: snapshot.val(),
        });
      })
      .catch(() => {
        console.warn("getVerbs failed");
      });
  };
}
