import { WrappedStorageHandler } from '../handlers/storage-handler.js'
import { Enricher } from '../types.js'
import { determineHighestWritableDomain } from '../utils/domain.js'

type Input = object
type Output = { cookieDomain: string }

export function enrichDomain(storageHandler: WrappedStorageHandler): Enricher<Input, Output> {
  return state => ({ ...state, cookieDomain: determineHighestWritableDomain(storageHandler) })
}
