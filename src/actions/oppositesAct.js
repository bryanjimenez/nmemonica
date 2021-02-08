import { firebaseConfig } from "../../environment.development";

export const GET_OPPOSITES = "get_opposites";

export function getOpposites() {
  return (dispatch, getState) => {
    const version = getState().version.opposites || 0;

    return fetch(firebaseConfig.databaseURL + "/lambda/opposites.json", {
      headers: { "Data-Version": version },
    })
      .then((res) => res.json())
      .then((data) =>
        dispatch({
          type: GET_OPPOSITES,
          value: data,
        })
      );
  };
}
