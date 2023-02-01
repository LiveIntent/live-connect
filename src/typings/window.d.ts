import { ILiveConnect } from '../types'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type XDomainRequest = any

  interface Window {
    // eslint-disable-next-line camelcase
    liQ_instances?: ILiveConnect[]
    liQ?: ILiveConnect
    XDomainRequest?: { new(): XDomainRequest; prototype: XDomainRequest; create(): XDomainRequest }; // for IE compat
    [k: string]: unknown // allow accessing arbitrary fields
    msCrypto: Crypto
  }
}
