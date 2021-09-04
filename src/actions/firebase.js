import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { firebaseConfig } from "../../environment.development";
import { localStorageKey } from "../constants/paths";
import { getLocalStorageSettings } from "../helper/localStorage";
import merge from "lodash/fp/merge";
import { DEFAULT_SETTINGS as stateSettingDefaults } from "../reducers/settingsRed";

export const FIREBASE_LOGIN = "firebase_login";
export const FIREBASE_LOGOUT = "firebase_logout";
export const GET_USER_SETTINGS = "get_user_settings";
export const GET_VERSIONS = "get_versions";

let firebaseInstance;

export function initialize() {
  return () => {
    try {
      // TODO: IE11 Object.values graceful failure
      firebaseInstance = initializeApp(firebaseConfig);
    } catch (e) {
      console.error(e);
    }
  };
}

export function logout() {
  return (dispatch) => {
    const auth = getAuth(firebaseInstance);
    auth.signOut().then(() => {
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
    const auth = getAuth(firebaseInstance);
    const user = auth.currentUser;
    const ref = "user/" + user.uid;

    const database = getDatabase();
    const fbP = database.ref(ref).once("value");
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

export function getVersions() {
  return (dispatch) => {
    return fetch(firebaseConfig.databaseURL + "/lambda/cache.json")
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_VERSIONS,
          value: data,
        })
      );
  };
}


export function firebaseAttrUpdate(
  time,
  dispatch,
  getState,
  uid,
  path,
  attr,
  aType,
  value
) {
  let setting;
  if (value) {
    setting = { [attr]: value };
  } else {
    const currVal = getLastStateValue(getState, path, attr);
    setting = { [attr]: !currVal };
  }

  const database = getDatabase(firebaseInstance);

  database.ref("user/" + uid).update({ lastModified: time });

  database
    .ref("user/" + uid + path)
    .update(setting)
    .then(() => {
      dispatch({
        type: aType,
        value: setting[attr],
      });
    })
    .catch(function (e) {
      console.error("update failed");
      console.error(e);
    });
}
