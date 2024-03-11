import { StorageStrategies, StorageStrategy } from '../model/storage-strategy.js'
import { Enricher } from '../types.js'

type Input = { privacyMode: boolean, storageStrategy?: StorageStrategy }
type Output = { storageStrategy: StorageStrategy }

export const enrichStorageStrategy: Enricher<Input, Output> = state => {
  const storageStrategy = state.privacyMode ? StorageStrategies.disabled : (state.storageStrategy || StorageStrategies.cookie)
  return { ...state, storageStrategy }
}
