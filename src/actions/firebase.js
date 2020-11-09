import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import axios from "axios";
import {
  firebaseConfig,
  // inventoryEndPoint,
} from "../../environment.development";

export const FIREBASE_GET_INVENTORY = "firebase_get_inventory";

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

export function pushAppointment() {
  return (dispatch) => {
    return firebase
      .database()
      .ref("test")
      .push({ test: "test" })
      .then(() => {
        dispatch({
          type: "TEST_OP_START",
        });
      })
      .catch(() => {
        dispatch({
          type: "TEST_OP_FAILED",
        });
      });
  };
}

/*
export function getInventory() {
  return (dispatch) => {
    return axios.get(inventoryEndPoint).then((res) => {
      dispatch({
        type: FIREBASE_GET_INVENTORY,
        value: res.data,
      });
    });
  };
}
*/
