import { Enricher, EventBus } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'
import { resolve } from '../manager/decisions'

type Input = { pageUrl?: string, domain: string }
type Output = { decisionIds: string[] }

export function enrichDecisionIds(
  storageHandler: WrappedStorageHandler,
  eventBus: EventBus
): Enricher<Input, Output> {
  return state => ({ ...state, ...resolve(state, storageHandler, eventBus) })
}
