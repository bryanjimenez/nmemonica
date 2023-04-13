import {store} from '../slices/index'

declare global {
  type RootState = ReturnType<typeof store.getState>
  type SettingState = RootState['setting']
}