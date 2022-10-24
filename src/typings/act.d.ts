export type ActCreator = (dispatch: function, getState: function) => void;

export type ThenableActCreator = (
  dispatch: function,
  getState: function
) => Promise<*>;
