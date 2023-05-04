import {store} from '../slices/index'

declare global {
  type RootState = ReturnType<typeof store.getState>
  type SettingState = RootState['setting']

  // https://redux-toolkit.js.org/tutorials/typescript#define-root-state-and-dispatch-types
  type AppDispatch = typeof store.dispatch
}