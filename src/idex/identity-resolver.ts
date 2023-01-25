import { CallHandler } from '../handlers/call-handler'
import { StorageHandler } from '../handlers/storage-handler'
import { EventBus, IIdentityResolver, State } from '../types'
import { DEFAULT_IDEX_EXPIRATION_HOURS } from '../utils/consts'
import { storageHandlerBackedCache, makeIdentityResolver } from './common'

export function IdentityResolver (config: State, storageHandler: StorageHandler, calls: CallHandler, eventBus: EventBus): IIdentityResolver {
  const nonNullConfig = config || {}
  const idexConfig = nonNullConfig.identityResolutionConfig || {}
  const expirationHours = idexConfig.expirationHours || DEFAULT_IDEX_EXPIRATION_HOURS
  const domain = nonNullConfig.domain

  const cache = storageHandlerBackedCache(expirationHours, domain, storageHandler, eventBus)
  return makeIdentityResolver(nonNullConfig, calls, cache, eventBus)
}
