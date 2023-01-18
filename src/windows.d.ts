import { ILiveConnect } from './types'

declare global {
  interface Window {
    // eslint-disable-line camelcase
    liQ_instances?: ILiveConnect[]
  }
}
