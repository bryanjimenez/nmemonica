import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { firebaseConfig } from "../../environment.development";

export const FIREBASE_LOGIN = "firebase_login";
export const FIREBASE_LOGOUT = "firebase_logout";
export const GET_USER_SETTINGS = "get_user_settings";

export function initialize() {
  return () => {
    try {
      // TODO: IE11 Object.values graceful failure
      firebase.initializeApp(firebaseConfig);
    } catch (e) {
      console.error(e);
    }
  };
}

export function logout() {
  return (dispatch) => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        dispatch({
          type: FIREBASE_LOGOUT,
        });
      });
  };
}

export function authenticated(value) {
  return (dispatch) => {
    dispatch({
      type: FIREBASE_LOGIN,
      value,
    });
  };
}

export function getUserSettings() {
  // TODO: no settings?
  const user = firebase.auth().currentUser;
  const ref = "user/" + user.uid;

  return (dispatch) => {
    return firebase
      .database()
      .ref(ref)
      .once("value")
      .then((snapshot) => {
        dispatch({
          type: GET_USER_SETTINGS,
          value: snapshot.val(),
        });
      });
  };
}
