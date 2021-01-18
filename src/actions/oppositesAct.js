import firebase from "firebase/app";
import "firebase/database";

export const GET_OPPOSITES = "get_opposites";

export function getOpposites() {
  return (dispatch) => {
    firebase
      .database()
      .ref("lambda/opposites")
      .once("value")
      .then((snapshot) => {
        dispatch({
          type: GET_OPPOSITES,
          value: snapshot.val(),
        });
      })
      .catch(() => {
        console.warn("getOpposites failed");
      });
  };
}
