import data from "../../data/verbs.json";
import firebase from "firebase/app";
import "firebase/database";
import { firebaseConfig } from "../../conf";

export const GET_VERBS = "get_verbs";

export function getVerbs() {
  return (dispatch) => {
    dispatch({
      type: GET_VERBS,
      value: data,
    });
    /*
    firebase
      .database()
      .ref("menu")
      .once("value")
      .then(snapshot => {
        dispatch({
          type: GET_MENU,
          payload: snapshot.val()
        });
      })
      .catch(() => {
        // pull static data here
        dispatch({
          type: GET_VERBS,
          payload: data.contact
        });
      });
      */
  };
}
