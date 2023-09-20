import { WrappedStorageHandler } from '../handlers/storage-handler'
import { Enricher } from '../types'
import { determineHighestWritableDomain } from '../utils/domain'

type Input = object
type Output = { cookieDomain: string }

export function enrichDomain(storageHandler: WrappedStorageHandler): Enricher<Input, Output> {
  return state => ({ ...state, cookieDomain: determineHighestWritableDomain(storageHandler) })
}
