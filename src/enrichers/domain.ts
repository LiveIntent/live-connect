import { WrappedStorageHandler } from '../handlers/storage-handler'
import { Enricher } from '../types'
import { determineHighestAccessibleDomain } from '../utils/domain'

type Input = object
type Output = { domain: string }

export function enrichDomain(storageHandler: WrappedStorageHandler): Enricher<Input, Output> {
  return state => ({ ...state, domain: determineHighestAccessibleDomain(storageHandler) })
}
