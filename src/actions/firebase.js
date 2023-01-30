import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { get, getDatabase, ref, update } from "firebase/database";
import { firebaseConfig } from "../../environment.development";
import { localStorageKey } from "../constants/paths";
import {
  getLocalStorageSettings,
  localStoreAttrDelete,
  localStoreAttrUpdate,
} from "../helper/localStorage";
import merge from "lodash/fp/merge";
import { DEFAULT_SETTINGS as stateSettingDefaults } from "../reducers/settingsRed";
import {
  getLastStateValue,
  REMOVE_FREQUENCY_PHRASE,
  REMOVE_FREQUENCY_WORD,
} from "./settingsAct";

export const FIREBASE_LOGIN = "firebase_login";
export const FIREBASE_LOGOUT = "firebase_logout";
export const GET_USER_SETTINGS = "get_user_settings";
export const GET_VERSIONS = "get_versions";

/**
 * @typedef {import("../typings/act").ActCreator} ActCreator
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 * @typedef {import("firebase/app").FirebaseApp} FirebaseApp
 */

/**
 * @type {FirebaseApp}
 */
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

/**
 * @returns {ActCreator}
 */
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

/**
 * @param {boolean} value
 * @returns {ActCreator}
 */
export function authenticated(value) {
  return (dispatch) => {
    dispatch({
      type: FIREBASE_LOGIN,
      value,
    });
  };
}

/**
 * On login user settings are retrieved from Firebase
 * @returns {ActCreator}
 */
export function getUserSettings() {
  return (dispatch) => {
    const auth = getAuth(firebaseInstance);
    const user = auth.currentUser;
    const refPath = "user/" + user.uid;

    const database = getDatabase();

    const fbP = get(ref(database, refPath));
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

function migrateStuff(getState, path, mergedSettings) {
  console.log(path);
  console.log("old freq: " + mergedSettings.frequency?.length);
  let newRein = {};
  if (mergedSettings.frequency && mergedSettings.frequency.length > 0) {
    mergedSettings.frequency.forEach((uid) => {
      if (mergedSettings.repetition[uid]?.rein === undefined) {
        newRein = {
          ...newRein,
          [uid]: { ...mergedSettings.repetition[uid], rein: true },
        };
      }
    });
  }

  const tempReinforce = { ...mergedSettings.repetition, ...newRein };
  // app state only
  // dispatch({
  //   type: ADD_SPACE_REP_WORD,
  //   value: tempReinforce,
  // });
  // localStore
  // const path = "/vocabulary/";
  const attr = "repetition";
  const time = new Date();

  let done = Promise.reject();
  if (Object.keys(newRein).length > 0) {
    done = localStoreAttrUpdate(time, getState, path, attr, tempReinforce).then(
      () => localStoreAttrDelete(time, path, "frequency")
    );
  }

  const tempCheck = Object.keys(tempReinforce).filter(
    (k) => tempReinforce[k]?.rein === true
  );
  console.log("temp: " + tempCheck.length);

  return done;
}

/**
 * Initializes redux state.settings from the
 * settings on localStorage
 * @returns {ActCreator}
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

        migrateStuff(getState, "/vocabulary/", mergedSettings.vocabulary).then(
          () => migrateStuff(getState, "/phrases/", mergedSettings.phrases)
        );

        // calculated values
        const vocabReinforceList = Object.keys(
          mergedSettings.vocabulary.repetition
        ).filter((k) => mergedSettings.vocabulary.repetition[k]?.rein === true);
        const phraseReinforceList = Object.keys(
          mergedSettings.phrases.repetition
        ).filter((k) => mergedSettings.phrases.repetition[k]?.rein === true);

        dispatch({
          type: REMOVE_FREQUENCY_WORD,
          value: { count: vocabReinforceList.length },
        });
        dispatch({
          type: REMOVE_FREQUENCY_PHRASE,
          value: { count: phraseReinforceList.length },
        });
      });
    }
  };
}

/**
 * Get app data versions file
 * @returns {ThenableActCreator}
 */
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

/**
 * Toggles or sets a firebase setting
 * @param {Date} time
 * @param {function} dispatch
 * @param {function} getState
 * @param {string} uid
 * @param {string} path
 * @param {string} attr
 * @param {string} aType
 * @param {*} [value] if no value is specified the prev value will be toggled
 * @returns {Promise<*>}
 */
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
  /** @type {{[attr:string]: any}} */
  let setting;
  if (value) {
    setting = { [attr]: value };
  } else {
    const currVal = getLastStateValue(getState, path, attr);
    setting = { [attr]: !currVal };
  }

  const database = getDatabase();

  return Promise.all([
    update(ref(database, "user/" + uid), { lastModified: time }),
    update(ref(database, "user/" + uid + path), setting),
  ])
    .then(() => {
      dispatch({
        type: aType,
        value: setting[attr],
      });
    })
    .catch((e) => {
      console.error("update failed");
      console.error(e);
    });
}
