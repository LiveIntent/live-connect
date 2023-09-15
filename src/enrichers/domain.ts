import { WrappedStorageHandler } from "../handlers/storage-handler"
import { Enricher } from "../types"
import { determineHighestAccessibleDomain } from "../utils/domain"

type Input = { storageHandler: WrappedStorageHandler }
type Output = { domain: string }

export const enrichDomain: Enricher<Input, Output> = state =>
  ({ ...state, domain: determineHighestAccessibleDomain(state.storageHandler) })
