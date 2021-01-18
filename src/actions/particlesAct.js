import firebase from "firebase/app";
import "firebase/database";

export const GET_PARTICLES = "get_particles";
export const GET_SUFFIXES = "get_suffixes";

export function getParticles() {
  return (dispatch) => {
    firebase
      .database()
      .ref("lambda/particles")
      .once("value")
      .then((snapshot) => {
        dispatch({
          type: GET_PARTICLES,
          value: snapshot.val(),
        });
      })
      .catch(() => {
        console.warn("getParticles failed");
      });
  };
}

export function getSuffixes() {
  return (dispatch) => {
    firebase
      .database()
      .ref("lambda/suffixes")
      .once("value")
      .then((snapshot) => {
        dispatch({
          type: GET_SUFFIXES,
          value: snapshot.val(),
        });
      })
      .catch(() => {
        console.warn("getSuffixes failed");
      });
  };
}
