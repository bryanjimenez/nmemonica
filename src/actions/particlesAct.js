import particles from "../../data/particles.json";
import firebase from "firebase/app";
import "firebase/database";

export const GET_PARTICLES = "get_particles";

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
        // pull static data here
        console.warn("Remote pull failed. Using local data.");
        dispatch({
          type: GET_PARTICLES,
          value: particles,
        });
      });
  };
}
