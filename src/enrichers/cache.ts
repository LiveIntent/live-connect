import { EventBus, strEqualsIgnoreCase } from 'live-connect-common'
import { DurableCache, NoOpCache, StorageHandlerBackedCache } from '../cache'
import { WrappedStorageHandler } from '../handlers/storage-handler'
import { StorageStrategies, StorageStrategy } from '../model/storage-strategy'
import { Enricher } from '../types'

type Input = { domain: string, storageHandler: WrappedStorageHandler, eventBus: EventBus, storageStrategy: StorageStrategy }
type Output = { cache: DurableCache }

export const enrichCache: Enricher<Input, Output> = state => {
  let cache

  if (strEqualsIgnoreCase(state.storageStrategy, StorageStrategies.none)) {
    cache = NoOpCache
  } else {
    cache = new StorageHandlerBackedCache({
      storageHandler: state.storageHandler,
      domain: state.domain,
      eventBus: state.eventBus
    })
  }
  return { ...state, cache }
}
