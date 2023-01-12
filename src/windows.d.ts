import { ILiveConnect } from './types'

declare global {
  interface Window {
    liQ_instances?: ILiveConnect[]
  }
}
