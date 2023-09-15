import { Enricher, EventBus } from '../types'
import { WrappedStorageHandler } from '../handlers/storage-handler'
import { resolve } from '../manager/decisions'

type Input = { storageHandler: WrappedStorageHandler, eventBus: EventBus, pageUrl?: string, domain: string }
type Output = { decisionIds: string[] }

export const enrichDecisionIds: Enricher<Input, Output> = state => {
  const { storageHandler, eventBus } = state
  return { ...state, ...resolve(state, storageHandler, eventBus) }
}
