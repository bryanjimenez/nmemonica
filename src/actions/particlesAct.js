import { firebaseConfig } from "../../environment.development";

export const GET_PARTICLES = "get_particles";
export const GET_SUFFIXES = "get_suffixes";

/**
 * @typedef {import("../typings/act").ThenableActCreator} ThenableActCreator
 */

/**
 * @returns {ThenableActCreator}
 */
export function getParticles() {
  return (dispatch, getState) => {
    const version = getState().version.particles || 0;

    return fetch(firebaseConfig.databaseURL + "/lambda/particles.json", {
      headers: { "Data-Version": version },
    })
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_PARTICLES,
          value: data,
        })
      );
  };
}

/**
 * @returns {ThenableActCreator}
 */
export function getSuffixes() {
  return (dispatch, getState) => {
    const version = getState().version.suffixes || 0;

    return fetch(firebaseConfig.databaseURL + "/lambda/suffixes.json", {
      headers: { "Data-Version": version },
    })
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_SUFFIXES,
          value: data,
        })
      );
  };
}
