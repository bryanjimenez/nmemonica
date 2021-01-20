import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { firebaseConfig } from "../../environment.development";
import { localStorageKey } from "../constants/paths";
import { getLocalStorageSettings } from "../helper/localStorage";
import merge from "lodash/fp/merge";
import { DEFAULT_SETTINGS as stateSettingDefaults } from "../reducers/settingsRed";

export const FIREBASE_LOGIN = "firebase_login";
export const FIREBASE_LOGOUT = "firebase_logout";
export const FIREBASE_CONNECTION = "firebase_connection";
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

/**
 * on login user settings are retrieved from Firebase
 */
export function getUserSettings() {
  return (dispatch) => {
    const user = firebase.auth().currentUser;
    const ref = "user/" + user.uid;

    const fbP = firebase.database().ref(ref).once("value");
    const lsP = getLocalStorageSettings(localStorageKey);

    Promise.all([fbP, lsP]).then((resolved) => {
      const fbSettings = resolved[0].val();
      const lsSettings = resolved[1];

      // TODO: local and remote settings are off sync should ask?
      if (
        lsSettings &&
        fbSettings &&
        lsSettings.lastModified > fbSettings.lastModified
      ) {
        // set localStore to firebase
        // console.log('ls->fb')
        // return firebase
        //   .database()
        //   .ref(ref)
        //   .update(lsSettings)
        //   .then(() => {
        //     dispatch({
        //       type: GET_USER_SETTINGS,
        //       value: lsSettings,
        //     });
        //   });
      } else {
        // set firebase to localStore
        // console.log('fb->ls')
        // return setLocalStorage(localStorageKey, fbSettings).then((settings) => {
        //   dispatch({
        //     type: GET_USER_SETTINGS,
        //     value: settings,
        //   });
        // });
      }

      // use merge to prevent losing defaults not found in localStorage
      const mergedSettings = merge(stateSettingDefaults, fbSettings);
      delete mergedSettings.lastModified;

      dispatch({
        type: GET_USER_SETTINGS,
        value: mergedSettings,
      });
    });
  };
}

/**
 * initializes redux state.settings from the
 * settings on localStorage
 */
export function initializeSettingsFromLocalStorage() {
  return (dispatch, getState) => {
    const { user } = getState().login;

    if (!user) {
      // not logged in
      return getLocalStorageSettings(localStorageKey).then((lsSettings) => {
        // use merge to prevent losing defaults not found in localStorage
        const mergedSettings = merge(stateSettingDefaults, lsSettings);
        delete mergedSettings.lastModified;

        dispatch({
          type: GET_USER_SETTINGS,
          value: mergedSettings,
        });
      });
    }
  };
}
