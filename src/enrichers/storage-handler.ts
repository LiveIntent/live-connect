import { EventBus, ReadOnlyStorageHandler, StorageHandler } from 'live-connect-common'
import { StorageStrategy } from '../model/storage-strategy'
import { Enricher } from '../types'
import { WrappedReadOnlyStorageHandler, WrappedStorageHandler } from '../handlers/storage-handler'

type InputReadOnly = { storageStrategy: StorageStrategy, storageHandler: ReadOnlyStorageHandler, eventBus: EventBus }
type OutputReadOnly = { storageHandler: WrappedReadOnlyStorageHandler }

export const enrichReadOnlyStorageHandler: Enricher<InputReadOnly, OutputReadOnly> = state => {
  const storageHandler = WrappedReadOnlyStorageHandler.make(state.storageStrategy, state.storageHandler, state.eventBus)
  return { ...state, storageHandler }
}

type Input = { storageStrategy: StorageStrategy, storageHandler: StorageHandler, eventBus: EventBus }
type Output = { storageHandler: WrappedStorageHandler }

export const enrichStorageHandler: Enricher<Input, Output> = state => {
  const storageHandler = WrappedStorageHandler.make(state.storageStrategy, state.storageHandler, state.eventBus)
  return { ...state, storageHandler }
}
