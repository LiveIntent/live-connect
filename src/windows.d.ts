import { ILiveConnect } from './types'

declare global {
  interface Window {
    // eslint-disable-next-line camelcase
    liQ_instances?: ILiveConnect[]
    liQ?: ILiveConnect
  }
}
