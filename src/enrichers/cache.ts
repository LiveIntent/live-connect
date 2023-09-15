import { strEqualsIgnoreCase } from "live-connect-common";
import { DurableCache, NoOpCache, StorageHandlerBackedCache } from "../cache";
import { WrappedStorageHandler } from "../handlers/storage-handler";
import { StorageStrategies, StorageStrategy } from "../model/storage-strategy";
import { Enricher } from "../types";

type Input = { domain: string, storageHandler: WrappedStorageHandler, storageStrategy: StorageStrategy }
type Output = { cache: DurableCache }

export const enrichCache: Enricher<Input, Output> = state => {
  let cache

  if (strEqualsIgnoreCase(state.storageStrategy, StorageStrategies.cookie) && strEqualsIgnoreCase(state.storageStrategy, StorageStrategies.none)) {
    cache = NoOpCache
  } else if (strEqualsIgnoreCase(state.storageStrategy, StorageStrategies.ls)) {
    cache = new StorageHandlerBackedCache({
      strategy: 'ls',
      storageHandler: state.storageHandler,
      domain: state.domain,
    })
  } else {
    cache = new StorageHandlerBackedCache({
      strategy: 'cookie',
      storageHandler: state.storageHandler,
      domain: state.domain,
    })
  }
  return { ...state, cache }
}
