import opposites from "../../data/opposites.json";
import firebase from "firebase/app";
import "firebase/database";

export const GET_OPPOSITES = "get_opposites";

// TODO: use firebase for opposites
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
        // pull static data here
        console.warn("Remote pull failed. Using local data.");
        dispatch({
          type: GET_OPPOSITES,
          value: opposites,
        });
      });
  };
}
