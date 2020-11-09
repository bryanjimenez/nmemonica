import data from "../../data/verbs.json";
import firebase from "firebase/app";
import "firebase/database";
import { firebaseConfig } from "../../environment.development";

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
        // pull static data here
        dispatch({
          type: GET_VERBS,
          value: data,
        });
      });
  };
}
