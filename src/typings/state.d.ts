import {store} from '../reducers/index'

// FIXME: delete
export type AppRootState = {};

declare global {
  type RootState = ReturnType<typeof store.getState>
}